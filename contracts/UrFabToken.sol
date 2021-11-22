// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./ERC20.sol";
import "./Owned.sol";
import "./SafeMath.sol";

contract MiscFunctionalities is SafeMath, Owned {
    enum Roles{Inactive, Active}
    enum productState{Neutral, Requested, Sold}

    struct participant {
        uint256 userCodeName;
        address participantAddress;
        uint256 participantId;
        Roles role;
        bool isRegistered;
    }

    uint256 participantCounter = 0;

    mapping(address => participant) public participants;
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
        uint256 productId;
    }

    // ProductId_ReviewNumber to Reviews mapping
    // mapping(uint256 => productReview) public productReviews;
    
    // ProductId to ReviewNumber to Reviews mapping
    mapping(uint256 => mapping(uint256 => productReview)) public productReviews;

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
    }
    
    mapping(uint256 => product) public products;

    function createProduct(
        uint256 productCode,
        uint256 productCost,
        uint256 productCount
        
    ) public onlyRegisteredParticipant() returns (uint256) {
        productCounter++;
        uint256 productId = productCounter;
        products[productId].productCost = productCost;
        products[productId].productCode = productCode;
        products[productId].manufacturer = msg.sender;
        products[productId].productCount = productCount;
        products[productId].currentOwner = msg.sender;
        products[productId].status = productState.Neutral;
        address participantAddress = msg.sender;
        participants[participantAddress].role = Roles.Active;

        emit ProductCreated(msg.sender, productCost, productCode, productCount, productId);

        return (productId);
    }

    function updateProduct(uint256 productId, uint256 productCount, uint256 productCost, uint256 productCode)
        public onlyRegisteredParticipant()
        returns (bool)
    {
        require(products[productId].currentOwner == msg.sender);
        products[productId].productCount = safeAdd(products[productId].productCount,productCount);
        products[productId].productCost = safeAdd(products[productId].productCost,productCost);
        emit ProductUpdated(msg.sender, productCost, productCount, productId);
        return (true);
    }

    function getProduct(uint256 productId) public view onlyRegisteredParticipant() returns (uint256 ,uint256,address,address,uint256, productState, address) {
        return (
            products[productId].productCode,            
            products[productId].productCost,
            products[productId].manufacturer,
            products[productId].currentOwner,
            products[productId].productCount,
            products[productId].status,
            products[productId].buyer
        );
    }

    function registerParticipant(uint256 userCodeName, Roles role) public returns (uint256) {
        participantCounter++;
        uint256 participantId = participantCounter;
        address participantAddress = msg.sender;
        participants[participantAddress].userCodeName = userCodeName;
        participants[participantAddress].participantAddress = msg.sender;
        participants[participantAddress].participantId = participantId;
        participants[participantAddress].role = role;
        participants[participantAddress].isRegistered = true;
        membership[msg.sender] = 1;
        return (participantId);
    }

    function request( uint256 productId, uint256 hash) onlyRegisteredParticipant public{
        products[productId].status=productState.Requested;
        products[productId].buyer=msg.sender;
        products[productId].hashOfDetails = hash; 
        address participantAddress = msg.sender;
        participants[participantAddress].role = Roles.Active;
    }


    function response(uint256 productId, productState state, uint256 hash, uint256 productCount, uint256 productCost, uint256 productCode) onlyRegisteredParticipant public payable{
        require(products[productId].currentOwner == msg.sender);
        if (products[productId].hashOfDetails == hash){
            products[productId].status=state;
            
            if (state == productState.Sold){
                transferFrom(products[productId].buyer, products[productId].currentOwner, products[productId].productCost);
            }
            
            products[productId].currentOwner=products[productId].buyer;
            emit ProductSold(products[productId].buyer, productCost, productCount, productId, hash, state);
        }
        else{
            revert();
        }
    }

    function addProductReview(uint256 productId, uint256 parameter_1_rating, uint256 parameter_2_rating, uint256 parameter_3_rating, uint256 overallRating, uint256 productCount, uint256 productCost, uint256 productCode) onlyRegisteredParticipant public{
        require(products[productId].currentOwner == msg.sender);
        productReviewCounter++;
        productReviews[productId][productReviewCounter].reviewer = msg.sender;
        productReviews[productId][productReviewCounter].parameter_1_rating = parameter_1_rating;
        productReviews[productId][productReviewCounter].parameter_2_rating = parameter_2_rating;
        productReviews[productId][productReviewCounter].parameter_3_rating = parameter_3_rating;
        productReviews[productId][productReviewCounter].overallRating = overallRating;
        productReviews[productId][productReviewCounter].productReviewNumber = productReviewCounter;
        productReviews[productId][productReviewCounter].productId = productId;
        emit ProductReviewUpdated(msg.sender, parameter_1_rating, parameter_2_rating, parameter_3_rating, overallRating, productReviewCounter, productId);
        // emit ProductReviewUpdated(msg.sender, parameter_1_rating, parameter_2_rating, parameter_3_rating, overallRating, productReviewCounter, productCost, productCount, productCode, productId);
    }
    
    
    event ProductCreated(address owner, uint256 productCost, uint256 productCode, uint256 productCount, uint256 productId);
    event ProductUpdated(address currentOwner, uint256 productCost, uint256 productCount, uint256 productId);
    event ProductSold(address currentOwner, uint256 productCost, uint256 productCount, uint256 productId, uint256 hashOfDetails, productState productStatus);
    event ProductReviewUpdated(address productReviewer, uint256 parameter_1_rating, uint256 parameter_2_rating, uint256 parameter_3_rating, uint256 overallRating, uint256 productReviewCounter, uint256 productId);


    // event ProductCreated(address owner, uint256 productCost, uint256 productCode, uint256 productCount, uint256 productId);
    // event ProductUpdated(address currentOwner, uint256 productCost, uint256 productCount, uint256 productCode, uint256 productId);
    // event ProductSold(address currentOwner, uint256 productCost, uint256 productCount, uint256 productCode, uint256 productId, uint256 hashOfDetails, productState productStatus);
    // event ProductReviewUpdated(address productReviewer, uint256 parameter_1_rating, uint256 parameter_2_rating, uint256 parameter_3_rating, uint256 overallRating, uint256 productReviewCounter, uint256 productCost, uint256 productCount, uint256 productCode, uint256 productId);

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
