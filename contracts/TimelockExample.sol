/// @author Matt Smithies (DOVU Global Limited)

/// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Import Hedera-specific HTS interop contracts
import "./libraries/hashgraph/HederaTokenService.sol";
import "./libraries/hashgraph/HederaResponseCodes.sol";

/**
 * What we are trying to achieve here is to create a basic contract with a time lock mechanism that allows us to modify the time lock as well
 */
contract TimelockExample is HederaTokenService, Ownable {
    uint256 timelock;

    bool lockTimeChange = true;

    modifier canChangeTime() {
        require(!lockTimeChange);
        _;
    }

    constructor() {
        timelock = block.timestamp;
    }

    function isTimelockEnabled() public view onlyOwner returns (bool) {
        return lockTimeChange || timelock > block.timestamp;
    }

    function addDays(uint256 amount_) public canChangeTime {
        timelock += amount_ * 1 days;
    }

    function removeDays(uint256 amount_) public canChangeTime {
        timelock -= amount_ * 1 days;
    }

    function updateTimeLock(bool lockTimeChange_) public onlyOwner {
        lockTimeChange = lockTimeChange_;
    }

    function getBlockTimeStamp() public view returns (uint256) {
        return block.timestamp;
    }
}
