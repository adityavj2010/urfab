// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract SafeMath {
    function safeAdd(uint a, uint b) public pure returns (uint c) {
        c = a + b;
        require(c >= a,'safeAdd');
    }
    function safeSub(uint a, uint b) public pure returns (uint c) {
        require(b <= a,'Balance issue');
        c = a - b;
    }
    function safeMul(uint a, uint b) public pure returns (uint c) {
        c = a * b;
        require(a == 0 || c / a == b,'safeMul');
    }
    function safeDiv(uint a, uint b) public pure returns (uint c) {
        require(b > 0,'safeDiv');
        c = a / b;
    }
}