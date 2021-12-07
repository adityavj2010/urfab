// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./ERC20.sol";
import "./Owned.sol";
import "./SafeMath.sol";

contract UrFabToken is ERC20, SafeMath, Owned {
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
        decimals = 9;
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
        // allowed[from][msg.sender] = safeSub(allowed[from][msg.sender], tokens);
        balances[to] = safeAdd(balances[to], tokens);
        emit Transfer(from, to, tokens);
        success = true;
    }

    struct participant {
        address participantAddress;
        uint256 participantId;
        bool isRegistered;
    }

    uint256 participantCounter = 0;

    mapping(address => participant) public participants;
    mapping(address => uint256) membership;

    modifier onlyRegisteredParticipant() {
        require(membership[msg.sender] == 1);
        _;
    }

    uint256 public productCounter = 0;

    uint256 productReviewCounter = 0;

    struct product {
        uint256 productCost;
        uint256 productCode;
        address currentOwner;
        uint16 status;
        address buyer;
    }

    uint256[] productRequests;
    mapping(uint256 => product) public products;

    struct productsAvailable {
        uint256[] productsIdAvailable;
    }

    mapping(uint256 => productsAvailable) productList;

    function createProduct(uint256 productCode, uint256 productCost)
        public
        onlyRegisteredParticipant
        returns (uint256)
    {
        if (productCode == 0 || productCost == 0) {
            revert("createProduct");
        }
        productCounter++;
        uint256 productId = productCounter;
        products[productId].productCost = productCost;
        products[productId].productCode = productCode;
        products[productId].currentOwner = msg.sender;
        products[productId].status = 0;
        return (productId);
    }

    function getProduct(uint256 productId)
        public
        view
        onlyRegisteredParticipant
        returns (
            uint256,
            uint256,
            address,
            uint16,
            address
        )
    {
        return (
            products[productId].productCode,
            products[productId].productCost,
            products[productId].currentOwner,
            products[productId].status,
            products[productId].buyer
        );
    }

    function registerParticipant() public payable returns (uint256) {
        participantCounter++;
        uint256 participantId = participantCounter;
        address participantAddress = msg.sender;
        participants[participantAddress].participantAddress = msg.sender;
        participants[participantAddress].participantId = participantId;
        participants[participantAddress].isRegistered = true;
        membership[msg.sender] = 1;
        return (participantId);
    }

    function getProductCounter() public view virtual returns (uint256) {
        return productCounter;
    }

    function request(uint256 productId) public onlyRegisteredParticipant {
        products[productId].status = 1;
        products[productId].buyer = msg.sender;
    }

    function response(
        uint256 productId,
        uint256 productCost,
        uint256 productCode,
        uint16 status
    ) public onlyRegisteredParticipant {
        require(products[productId].currentOwner == msg.sender, "response");
        if (
            productId == 0 ||
            productCost == 0 ||
            productCode == 0
        ) {
            revert("response");
        }
        products[productId].status = status;
        bool isTransacted = false;

        if (status == 2) {
            isTransacted = this.transferFrom(
                products[productId].buyer,
                products[productId].currentOwner,
                products[productId].productCost
            );
        }

        if (isTransacted) {
            products[productId].currentOwner = products[productId].buyer;
        }
    }

    function checkregistration(address participantAddress)
        public
        view
        returns (uint256)
    {
        if (participants[participantAddress].isRegistered) {
            return participants[participantAddress].participantId;
        }
        return 0;
    }
}
