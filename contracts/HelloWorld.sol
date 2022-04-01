pragma solidity ^0.6.12;

contract HelloWorld {

    string public message;

    constructor(string memory initMessage) public {
        message = initMessage;
    }

    function update(string memory newMessage) public {
        message = newMessage;
    }

    function getMessage() public view returns(string memory) {
        return message;
    }
}
