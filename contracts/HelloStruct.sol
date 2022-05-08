// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// We're just going add open zeppelin, ownable.
import "@openzeppelin/contracts/access/Ownable.sol";

contract HelloStruct is Ownable {
    // This can be external -> https://solidity-by-example.org/structs
    struct Hello {
        string text;
    }

    Hello public hello;

    constructor() {
        hello = Hello("hello world");
    }

    function update(string memory newHello_) public onlyOwner {
        //        hello = Hello(newHello_); // This also works
        hello.text = newHello_;
    }

    function getMessage() public view returns (string memory) {
        return hello.text;
    }
}
