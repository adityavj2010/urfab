// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
import "./ERC20.sol";
import "./Owned.sol";
import "./SafeMath.sol";

contract UrFabToken is ERC20, Owned, SafeMath {
    string public symbol;
    string public name;
    uint8 public decimals;
    uint256 public _totalSupply;

    uint256 public _p_id = 0;
    uint256 public _u_id = 0;

    mapping(address => uint256) balances;
    mapping(address => mapping(address => uint256)) allowed;

    constructor() {
        symbol = "URFAB";
        name = "URFAB";
        decimals = 18;
        _totalSupply = 1000000000000000000000000000;
        owner = msg.sender;
        balances[owner] = _totalSupply;
        emit Transfer(address(0), owner, _totalSupply);
    }

    function totalSupply() public view virtual override returns (uint256) {
        return _totalSupply - balances[address(0)];
    }

    function balanceOf(address tokenOwner)
        public
        view
        virtual
        override
        returns (uint256 balance)
    {
        balance = balances[tokenOwner];
    }

    function allowance(address tokenOwner, address spender)
        public
        view
        virtual
        override
        returns (uint256 remaining)
    {
        remaining = allowed[tokenOwner][spender];
    }

    function transfer(address to, uint256 tokens)
        public
        virtual
        override
        returns (bool success)
    {
        balances[msg.sender] = safeSub(balances[msg.sender], tokens);
        balances[to] = safeAdd(balances[to], tokens);
        emit Transfer(msg.sender, to, tokens);
        success = true;
    }

    function approve(address spender, uint256 tokens)
        public
        virtual
        override
        returns (bool success)
    {
        allowed[msg.sender][spender] = tokens;
        emit Approval(msg.sender, spender, tokens);
        success = true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokens
    ) public virtual override returns (bool success) {
        balances[from] = safeSub(balances[from], tokens);
        allowed[from][msg.sender] = safeSub(allowed[from][msg.sender], tokens); 
        balances[to] = safeAdd(balances[to], tokens);
        emit Transfer(from, to, tokens);
        success =true;
    }
}
