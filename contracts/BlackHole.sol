// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./libraries/hashgraph/HederaTokenService.sol";
import "./libraries/hashgraph/HederaResponseCodes.sol";

contract BlackHole is HederaTokenService {
    address blackHoleGasAddress;

    struct NFT {
        address tokenAddress;
        int64 serialNumber;
    }

    mapping(address => NFT[]) sentNFTs;

    int64 totalNFTs;

    constructor(address _tokenAddress) {
        blackHoleGasAddress = _tokenAddress;
        totalNFTs = 0;
    }

    function castIntoBlackHole(address _tokenAddress, int64 _serialNumber) external {
        _tokenAssociate(_tokenAddress);
        _tokenTransfer(_tokenAddress, _serialNumber);
    }

    function _tokenAssociate(address _tokenAddress) private {
        int256 response = HederaTokenService.associateToken(address(this), _tokenAddress);

        if (
            response != HederaResponseCodes.SUCCESS &&
            response != HederaResponseCodes.TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT
        ) {
            revert("Associate Failed");
        }
    }

    function _tokenTransfer(address _tokenAddress, int64 _serialNumber) private {
        sentNFTs[msg.sender].push(NFT(_tokenAddress, _serialNumber));
        totalNFTs++;

        int256 response = HederaTokenService.transferNFT(
            _tokenAddress,
            msg.sender,
            address(this),
            _serialNumber
        );

        if (response != HederaResponseCodes.SUCCESS) {
            revert("Transfer Failed");
        }
    }

    function getTokensForAddress() public view returns (NFT[] memory) {
        return sentNFTs[msg.sender];
    }

    function getMassOfBlackHole() public view returns (int64) {
        return totalNFTs;
    }

    function getBlackHoleGasAddress() public view returns (address) {
        return blackHoleGasAddress;
    }
}
