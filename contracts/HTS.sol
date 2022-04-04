// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.6.12;

import "./libraries/hashgraph/HederaTokenService.sol";
import "./libraries/hashgraph/HederaResponseCodes.sol";

// TODO: This is currently suffering from TRANSACTION_OVERSIZE errors
contract HTS is HederaTokenService {

    // This is the token address for DOVU
    address tokenAddress;

    // This is the quantity of tokens that different users send
    mapping (address => int64) sentTokens;

    // This is the quantity of tokens in the contract treasury
    int64 treasuryTokens;

    constructor(address _tokenAddress) public {
        tokenAddress = _tokenAddress;
        treasuryTokens = 0;
    }

    // Contracts assocs with token
    function tokenAssociate() external {
        int response = HederaTokenService.associateToken(address(this), tokenAddress);

        if (response != HederaResponseCodes.SUCCESS) {
            revert ("Associate Failed");
        }
    }

    // Testing the sending of tokens to this.
    function tokenTransfer(int64 tokenAmount) external {

        int response = HederaTokenService.transferToken(tokenAddress, msg.sender, address(this), tokenAmount);

        if (response != HederaResponseCodes.SUCCESS) {
            revert ("Transfer Failed");
        }

        sentTokens[msg.sender] = tokenAmount;
        treasuryTokens = tokenAmount;
    }

    function tokenSendBack() external {
        require(sentTokens[msg.sender] > 1);

        int64 returnTokens = sentTokens[msg.sender] / 2;

        int response = HederaTokenService.transferToken(tokenAddress, address(this), msg.sender, returnTokens);

        if (response != HederaResponseCodes.SUCCESS) {
            revert ("Transfer Failed");
        }

        sentTokens[msg.sender] = 0;
        treasuryTokens -= returnTokens;
    }

    function tokenDissociate() external {
        require(treasuryTokens == 0, 'There must be no tokens in the Treasury'); // Else this can't be dissociated

        int response = HederaTokenService.dissociateToken(address(this), tokenAddress);

        if (response != HederaResponseCodes.SUCCESS) {
            revert ("Dissociate Failed");
        }
    }

    function getTokensForAddress() public view returns (int64) {
        return sentTokens[msg.sender];
    }

    function getTokensInTreasury() public view returns (int64) {
        return treasuryTokens;
    }

    function getTokenId() public view returns (address) {
        return tokenAddress;
    }
}
