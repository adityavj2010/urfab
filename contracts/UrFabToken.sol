// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
import "./ERC20.sol";
import "./Owned.sol";
import "./SafeMath.sol";

contract MiscFunctionalities is SafeMath, Owned {
    uint256 productCounter = 1;

    struct review {
        address addr;
        string comment;
        uint256 rating;
    }

    struct product {
        uint256 uniqueRegNumer;
        uint256 productCost;
        string productName;
        uint256 productCount;
        address manufacturer;
        review[] reviews;
    }
    mapping(uint256 => product) public products;

    function createProduct(
        string memory productName,
        uint256 productCost,
        uint256 productCount
    ) public returns (uint256) {
        productCounter++;
        uint256 productId = productCounter;
        products[productId].productCost = productCost;
        products[productId].productName = productName;
        products[productId].manufacturer = msg.sender;
        products[productId].productCount = productCount;
        return productId;
    }

    function updateProductCount(uint256 productId, uint256 productCount)
        public
        returns (bool)
    {
        require(products[productId].manufacturer == msg.sender);
        products[productId].productCount = safeAdd(products[productId].productCount,productCount);
        return true;
    }

    function getProduct(uint256 productId) public view returns (string memory,uint256,address,uint256) {
        return (
            products[productId].productName,            
            products[productId].productCost,
            products[productId].manufacturer,
            products[productId].productCount
        );
    }

    struct participant {
        string userName;
        address addr;
        uint256 role;
    }

    mapping(uint256 => participant) public participants;
    event ProductCreated(address indexed from, address indexed to, uint tokens);
    event ProductUpdated(address indexed tokenOwner, address indexed spender, uint tokens);

}

contract UrFabToken is ERC20, MiscFunctionalities {
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
        _totalSupply = 100000000;
        owner = msg.sender;
        balances[owner] = _totalSupply;
        emit Transfer(address(0), owner, _totalSupply);
    }

    function totalSupply() public view override returns (uint256) {
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

    function transferFrom(
        address from,
        address to,
        uint256 tokens
    ) public virtual override returns (bool success) {
        balances[from] = safeSub(balances[from], tokens);
        allowed[from][msg.sender] = safeSub(allowed[from][msg.sender], tokens);
        balances[to] = safeAdd(balances[to], tokens);
        emit Transfer(from, to, tokens);
        success = true;
    }
}
