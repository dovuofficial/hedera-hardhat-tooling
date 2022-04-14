// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
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

    // When a user has staked to a project.
    event StakeComplete(address indexed sender, string projectRef, int64 amount);

    // When a user has unstaked.
    event Unstaked(address indexed sender, string projectRef, int64 amount);

    // When the staking pool has been updated with tokens (fees, penalties, etc)
    event TreasuryDeposit(address indexed sender, int64 amount);



    // Initially this will be a mapping of projects to a balance
    // TODO: Later have a struct
    mapping (string => address) projectRefs;
    mapping (address => int64) projectBalances;

    // This is the token address for a demo token
    address tokenAddress;

    // This is the quantity of tokens that different users to specific projects
    mapping (address => mapping (address => int64)) sentTokens;

    // Total claimed tokens by user
    mapping (address => int64) totalClaimedTokensByUser;

    // This is the quantity of demo tokens in the contract treasury
    int64 treasuryTokens = 0;

    // This is the amount of claimable tokens that a user can test with
    int64 maximumClaimableTokens = 10;


    /** Modifier Methods **/

    modifier hasTokensInTreasury() {
        require(treasuryTokens >= maximumClaimableTokens, "Token Treasury does not have enough value");
        _;
    }

    modifier hasProjectRef(string memory ref_) {
        require(projectRefs[ref_] != address(0), "Project reference cannot be found");
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
        emit TreasuryDeposit(msg.sender, tokenAmount_);
    }

    function addProject(
        string memory name_
        , address projectAddress_
    ) external onlyOwner {
        require(projectRefs[name_] == address(0), "This project name reference has already been used.");
        require(projectBalances[projectAddress_] == 0); // Ensure that every address is unique

        projectRefs[name_] = projectAddress_;
    }

    // This is a facet for claiming tokens
    function claimDemoTokensForStaking(int64 amount_) external hasTokensInTreasury {
        require(totalClaimedTokensByUser[msg.sender] + amount_ <= maximumClaimableTokens);

        totalClaimedTokensByUser[msg.sender] += amount_;
        treasuryTokens -= amount_;

        // Don't care if this fails
        HederaTokenService.associateToken(address(this), tokenAddress);

        int response = HederaTokenService.transferToken(tokenAddress, address(this), msg.sender, amount_);

        if (response != HederaResponseCodes.SUCCESS) {
            revert ("Transfer Failed");
        }
    }

    /**
    * Stake tokens to a given project
    **/
    function stakeTokensToProject(string memory ref_, int64 amount_) external hasProjectRef(ref_) {

        // Update token state for different projects
        projectBalances[projectRefs[ref_]] += amount_;
        sentTokens[projectRefs[ref_]][msg.sender] += amount_;

        // This sends tokens into the Treasury, however we could have a separate account.
        int response = HederaTokenService.transferToken(tokenAddress, msg.sender, address(this), amount_);

        if (response != HederaResponseCodes.SUCCESS) {
            revert ("Transfer Failed, do you have enough balance to pay?");
        }
        emit StakeComplete(msg.sender, ref_, amount_);
    }

    function unstakeTokensFromProject(string memory ref_, int64 amount_) external hasProjectRef(ref_) {
        require(sentTokens[projectRefs[ref_]][msg.sender] >= amount_, 'Unable to unstake that amount of tokens from project');

        // Update token state for different projects
        projectBalances[projectRefs[ref_]] -= amount_;
        sentTokens[projectRefs[ref_]][msg.sender] -= amount_;

        // Send tokens back to user
        int response = HederaTokenService.transferToken(tokenAddress, address(this), msg.sender, amount_);

        if (response != HederaResponseCodes.SUCCESS) {
            revert ("Transfer failed to unstake tokens");
        }
        emit Unstaked(msg.sender, ref_, amount_);
    }

    /** View Methods for reading state**/

    function getTreasuryBalance() external view returns (int64) {
        return treasuryTokens;
    }

    function getTotalTokensClaimed() external view returns (int64) {
        return totalClaimedTokensByUser[msg.sender];
    }

    function getAddressForProjectRef(string memory ref_) external view hasProjectRef(ref_) returns (address)  {
        return projectRefs[ref_];
    }

    function numberOfTokensStakedToProject(string memory ref_) external view hasProjectRef(ref_) returns (int64)  {
        return projectBalances[projectRefs[ref_]];
    }

    function getUserTokensStakedToProject(string memory ref_) external view hasProjectRef(ref_) returns (int64) {
        return sentTokens[projectRefs[ref_]][msg.sender];
    }
}
