// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

contract Owned {
    address public owner;
    address public newOwner;
    modifier onlyOwner {
        require(msg.sender == owner); 
        _;
    }
    event OwnershipTransferred(address indexed _from, address indexed _to); //propagate transfer of ownership

    constructor() {
        owner = msg.sender;
    }

    function transferOwnership(address _newOwner) public onlyOwner {
        newOwner = _newOwner;
    }
    function acceptOwnership() public {
        require(msg.sender == newOwner);
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
        newOwner = address(0);
    }
}
