// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// We're just going add open zeppelin, ownable.
import "@openzeppelin/contracts/access/Ownable.sol";

contract HelloWorld is Ownable {
    string public message;

    constructor() {
        message = "hello";
    }

    function update(string memory newMessage) public onlyOwner {
        message = newMessage;
    }

    function getMessage() public view returns (string memory) {
        return message;
    }
}
