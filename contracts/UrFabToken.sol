// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
import "./ERC20.sol";
import "./Owned.sol";
import "./SafeMath.sol";

contract MiscFunctionalities is SafeMath, Owned {
    enum Roles {Inactive, Active}
    enum productState {Neutral, Requested, Sold}

    struct participant {
        uint256 userCodeName;
        address addr;
        Roles role;
        bool isRegistered;
    }

    uint256 participantCounter = 0;

    mapping(uint256 => participant) public participants;
    mapping (address=>uint) membership;
    
    modifier onlyRegisteredParticipant()
    { require(membership[msg.sender] == 1);
        _;
    }

    uint256 productCounter = 0;

    uint256 productReviewCounter = 0;

    struct productReview {
        address reviewer;
        uint256 parameter_1_rating;
        uint256 parameter_2_rating;
        uint256 parameter_3_rating;
        uint256 overallRating;
        uint256 productReviewNumber;
    }

    // ProductId to Reviews mapping
    mapping(uint256 => review) public productReviews;

    struct product {
        uint256 uniqueRegNumer;
        uint256 productCost;
        uint256 productCode;
        uint256 productCount;
        address manufacturer;
        address currentOwner;

        productState status;
        address buyer;
        uint256 hashOfDetails;

        review[] reviews;
    }

    function createProduct(
        uint256 memory productCode,
        uint256 productCost,
        uint256 productCount,
        uint256 participantId
        
    ) public onlyRegisteredParticipant() returns (uint256) {
        productCounter++;
        uint256 productId = productCounter;
        products[productId].productCost = productCost;
        products[productId].productCode = productCode;
        products[productId].manufacturer = msg.sender;
        products[productId].productCount = productCount;
        products[productId].currentOwner = msg.sender;
        products[productId].productState = productState.Neutral;
        participants[participantId].role = Roles.Active;

        emit ProductCreated(msg.sender, productCost, productCode, productCount, productId);

        return productId;
    }

    function updateProduct(uint256 productId, uint256 productCount, uint256 productCost, uint256 productCode)
        public onlyRegisteredParticipant()
        returns (bool)
    {
        require(products[productId].currentOwner == msg.sender);
        products[productId].productCount = safeAdd(products[productId].productCount,productCount);
        products[productId].productCost = safeAdd(products[productId].productCost,productCost);
        emit ProductUpdated(msg.sender, productCost, productCount, productCode, productId);
        return true;
    }

    function getProduct(uint256 productId) public view onlyRegisteredParticipant() returns (uint256 memory,uint256,address,uint256) {
        return (
            products[productId].productCode,            
            products[productId].productCost,
            products[productId].manufacturer,
            products[productId].currentOwner,
            products[productId].productCount
        );
    }

    function registerParticipant(uint256 memory userCodeName, Roles role) public returns (uint256) {
        participantCounter++;
        uint256 participantId = participantCounter;
        participants[participantId].userCodeName = userCodeName;
        participants[participantId].addr = msg.sender;
        participants[participantId].role = role;
        participants[participantId].isRegistered = true;
        membership[msg.sender] = 1;
        return participantId;
    }

    function request(address buyer, uint256 productId, uint256 hash, uint256 participantId) onlyRegisteredParticipant public{
        products[productId].status=productState.Requested;
        products[productId].buyer=msg.sender;
        products[productId].hashOfDetails = hash; 
        participants[participantId].role = Roles.Active;
    }


    function response(uint256 productId, productState state, uint256 hash, uint256 productCount, uint256 productCost, uint256 productCode) onlyRegisteredParticipant public{
        require(products[productId].currentOwner == msg.sender);
        if (products[productId].hashOfDetails == hash){
            products[productId].status=state;
            products[productId].currentOwner=products[productId].buyer;
            emit ProductSold(products[productId].buyer, productCost, productCount, productCode, productId, hash, state);
        }
        else{
            revert();
        }
    }

    function addProductReview(uint256 productId, uint256 parameter_1_rating, uint256 parameter_2_rating, uint256 parameter_3_rating, uint256 overallRating, uint256 productCount, uint256 productCost, uint256 productCode) onlyRegisteredParticipant public{
        require(products[productId].currentOwner == msg.sender);
        productReviewCounter++;
        productReviews[productId].reviewer = msg.sender;
        productReviews[productId].parameter_1_rating = parameter_1_rating;
        productReviews[productId].parameter_2_rating = parameter_2_rating;
        productReviews[productId].parameter_3_rating = parameter_3_rating;
        productReviews[productId].overallRating = overallRating;
        productReviews[productId].productReviewNumber = productReviewCounter;
        emit ProductReviewUpdated(msg.sender, parameter_1_rating, parameter_2_rating, parameter_3_rating, overallRating, productReviewCounter, productCost, productCount, productCode, productId);
    }


    event ProductCreated(address owner, uint256 productCost, uint256 productCode, uint256 productCount, uint256 productId);
    event ProductUpdated(address currentOwner, uint256 productCost, uint256 productCount, uint256 productCode, uint256 productId);
    event ProductSold(address currentOwner, uint256 productCost, uint256 productCount, uint256 productCode, uint256 productId, uint256 hashOfDetails, productState productStatus);
    event ProductReviewUpdated(address productReviewer, uint256 parameter_1_rating, uint256 parameter_2_rating, uint256 parameter_3_rating, uint256 overallRating, uint256 productReviewCounter, uint256 productCost, uint256 productCount, uint256 productCode, uint256 productId);

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
