/// @author Matt Smithies (DOVU Global Limited)

/// SPDX-License-Identifier: MIT"
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Import Hedera-specific HTS interop contracts
import "./libraries/hashgraph/HederaTokenService.sol";
import "./libraries/hashgraph/HederaResponseCodes.sol";

/**
* This contract of the most basic approach to:
*   1) Projects being able to be created to be staked against
*   2) Uses been able to claim demo tokens to stack towards a project
*   3) Uses being able to withdraw tokens from the project and then deposit them into another.
*
* Question? Should we used ReentrancyGuard for anything that calls HTS?
*/
contract StakableProject is HederaTokenService, Ownable {

    // TODO: Become external, so that it can be imported
    struct Project {
        int64 balance;
        int64 verified_kgs; // We might add some claimable carbon
        bool created;
    }

    /** @notice Events **/

    // When a user has staked to a project
    event StakeComplete(address indexed sender, string projectRef, int64 amount);

    // When a user has unstaked
    event Unstaked(address indexed sender, string projectRef, int64 amount);

    // When the staking pool has been updated with tokens (fees, penalties, etc)
    event TreasuryDeposit(address indexed sender, int64 amount);


    // Links a Dynamic NFT (dNFT) HTS token id to a project within the contract
    mapping (string => Project) projects;

    // Keep track of the number of projects that have been added to the contract
    uint numberOfProjects = 0;

    // This is the token address for a demo token, that can be claimed and staked/unstaked
    address tokenAddress;

    // This is the quantity of tokens that different users to specific projects (dnft_id_)
    mapping (string => mapping (address => int64)) sentTokens;

    // Total claimed tokens by user, TODO: add note on why it doesn't reduce.
    // As a user can externally receive tokens for staking
    mapping (address => int64) totalClaimedTokensByUser;

    // This is the quantity of demo tokens in the contract treasury
    int64 treasuryTokens = 0;

    // This is the amount of claimable tokens that a user can claim with (doesn't stop HTS transfers)
    int64 maximumClaimableTokens = 10;


    /** Modifier Methods **/

    modifier hasTokensInTreasury() {
        require(treasuryTokens >= maximumClaimableTokens, "Token Treasury does not have enough value");
        _;
    }

    modifier hasProject(string memory dnft_id_) {
        require(projects[dnft_id_].created, "Project does not exist from id");
        _;
    }

    constructor(address tokenAddress_) {
        tokenAddress = tokenAddress_;

        // Associate token as part of the constructor
        int response = HederaTokenService.associateToken(address(this), tokenAddress);

        if (response != HederaResponseCodes.SUCCESS) {
            revert ("Treasury associate failed");
        }
    }

    function updateClaimableTokens(int64 amount_) external onlyOwner {
        require(amount_ > 0);

        maximumClaimableTokens = amount_;
    }

    function addTokensToTreasury(int64 tokenAmount_) external onlyOwner {
        treasuryTokens += tokenAmount_;

        int response = HederaTokenService.transferToken(tokenAddress, msg.sender, address(this), tokenAmount_);

        if (response != HederaResponseCodes.SUCCESS) {
            revert ("Transfer Failed");
        }
    }

    function addProject(string memory dnft_id_, int64 verified_kg) external onlyOwner {
        require(!projects[dnft_id_].created, "Project already exists from id");

        projects[dnft_id_] = Project(0, verified_kg, true);
    }

    function addVerifiedCarbon(string memory dnft_id_, int64 verified_kg) external onlyOwner {
        projects[dnft_id_].verified_kgs += verified_kg;
    }

    function removeVerifiedCarbon(string memory dnft_id_, int64 verified_kg) external onlyOwner {
        require(projects[dnft_id_].verified_kgs - verified_kg >= 0, "Unable to remove verified carbon");

        projects[dnft_id_].verified_kgs -= verified_kg;
    }

    // This is a facet for claiming tokens
    function claimDemoTokensForStaking(int64 amount_) external hasTokensInTreasury {
        require(totalClaimedTokensByUser[msg.sender] + amount_ <= maximumClaimableTokens);

        totalClaimedTokensByUser[msg.sender] += amount_;
        treasuryTokens -= amount_;

        // Don't care if this fails (needs testing)
        HederaTokenService.associateToken(address(this), tokenAddress);

        int response = HederaTokenService.transferToken(tokenAddress, address(this), msg.sender, amount_);

        if (response != HederaResponseCodes.SUCCESS) {
            revert ("Transfer Failed");
        }
    }

    /**
    * Stake tokens to a given project
    **/
    function stakeTokensToProject(string memory dnft_id_, int64 amount_) external hasProject(dnft_id_) {

        // Update token state for different projects
        projects[dnft_id_].balance += amount_;
        sentTokens[dnft_id_][msg.sender] += amount_;

        // This sends tokens into the Treasury, however we could have a separate account.
        int response = HederaTokenService.transferToken(tokenAddress, msg.sender, address(this), amount_);

        if (response != HederaResponseCodes.SUCCESS) {
            revert ("Transfer Failed, do you have enough balance to pay?");
        }
    }

    function unstakeTokensFromProject(string memory dnft_id_, int64 amount_) external hasProject(dnft_id_) {
        require(sentTokens[dnft_id_][msg.sender] >= amount_, 'Unable to unstake that amount of tokens from project');

        // Update token state for different projects
        projects[dnft_id_].balance -= amount_;
        sentTokens[dnft_id_][msg.sender] -= amount_;

        // Send tokens back to user
        int response = HederaTokenService.transferToken(tokenAddress, address(this), msg.sender, amount_);

        if (response != HederaResponseCodes.SUCCESS) {
            revert ("Transfer failed to unstake tokens");
        }
    }

    /** View Methods for reading state**/

    function getTreasuryBalance() external view returns (int64) {
        return treasuryTokens;
    }

    function getTotalTokensClaimed() external view returns (int64) {
        return totalClaimedTokensByUser[msg.sender];
    }

    function getVerifiedCarbonForProject(string memory dnft_id_) external view hasProject(dnft_id_) returns (int64)  {
        return projects[dnft_id_].verified_kgs;
    }

    /**
        @notice work in progress (need to figure out the best way to handle this)
            - For now just expect that the division will happen on the dapp.

        (Note) this for division (balance / kgs):
            - Value is less then 1, there is 100% risk for liquidation
            - Value is more then 1, there less then 100% risk for liquidation

        @param dnft_id_ the token id of the hedera asset
        @return tuple(
            - current staked balance of pool
            - current kgs of verified carbon
        )
    **/
    function getCollateralRisk(string memory dnft_id_) external view hasProject(dnft_id_) returns (int64, int64)  {
        Project memory _project = projects[dnft_id_];

        return (_project.balance, _project.verified_kgs);
    }

    function numberOfTokensStakedToProject(string memory dnft_id_) external view hasProject(dnft_id_) returns (int64)  {
        return projects[dnft_id_].balance;
    }

    function getUserTokensStakedToProject(string memory dnft_id_) external view hasProject(dnft_id_) returns (int64) {
        return sentTokens[dnft_id_][msg.sender];
    }
}
