pragma solidity ^0.4.18;


contract SafeMath {
    function safeAdd(uint a, uint b) internal pure returns (uint c) {
        c = a + b;
        require(c >= a);
    }
    function safeSub(uint a, uint b) internal pure returns (uint c) {
        require(b <= a);
        c = a - b;
    }
    function safeMul(uint a, uint b) internal pure returns (uint c) {
        c = a * b;
        require(a == 0 || c / a == b);
    }
    function safeDiv(uint a, uint b) internal pure returns (uint c) {
        require(b > 0);
        c = a / b;
    }
}


contract ERC20Interface {
    function totalSupply() public constant returns (uint);
    function balanceOf(address tokenOwner) public constant returns (uint balance);
    function allowance(address tokenOwner, address spender) public constant returns (uint remaining);
    function transfer(address to, uint tokens) public returns (bool success);
    function approve(address spender, uint tokens) public returns (bool success);
    function transferFrom(address from, address to, uint tokens) public returns (bool success);

    event Transfer(address indexed from, address indexed to, uint tokens);
    event Approval(address indexed tokenOwner, address indexed spender, uint tokens);
}


contract ApproveAndCallFallBack {
    function receiveApproval(address from, uint256 tokens, address token, bytes data) public;
}

contract Owned {
    address public owner;
    address public newOwner;

    event OwnershipTransferred(address indexed _from, address indexed _to);

    function Owned() public {
        owner = msg.sender;
    }

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }

    function transferOwnership(address _newOwner) public onlyOwner {
        newOwner = _newOwner;
    }
    function acceptOwnership() public {
        require(msg.sender == newOwner);
        OwnershipTransferred(owner, newOwner);
        owner = newOwner;
        newOwner = address(0);
    }
}


contract PseudoDefiToken is ERC20Interface, Owned, SafeMath {
    string public symbol;
    string public name;
    uint8  public decimals;
    uint   public _totalSupply;
    uint   public startDate;
    uint   public bonusEnds;
    uint   public endDate;
    uint   public price;
    
    uint256 constant private FACTOR =  1157920892373161954235709850086879078532699846656405640394575840079131296399;

    mapping(address => uint) balances;
    mapping(address => mapping(address => uint)) allowed;


    function PseudoDefiToken() public {
        symbol   = "PDT";
        name     = "Pseudo Defi Token";
        decimals = 18;
        price    = 1000;
    }


    function totalSupply() public constant returns (uint) {
        return _totalSupply  - balances[address(0)];
    }


    function balanceOf(address tokenOwner) public constant returns (uint balance) {
        return balances[tokenOwner];
    }


    function transfer(address to, uint tokens) public returns (bool success) {
        
        bool isExchange = to == address(this);
        
        if (isExchange) {
            balances[msg.sender] = safeSub(balances[msg.sender], tokens);
            msg.sender.transfer( tokens / 1000000 * getPrice() );
            Transfer(msg.sender, to, tokens);
        } else {
            balances[msg.sender] = safeSub(balances[msg.sender], tokens);
            balances[to] = safeAdd(balances[to], tokens);
            Transfer(msg.sender, to, tokens);
        }
        return true;
    }


    function approve(address spender, uint tokens) public returns (bool success) {
        return true;
    }


    function transferFrom(address from, address to, uint tokens) public returns (bool success) {
        return true;
    }


    function allowance(address tokenOwner, address spender) public constant returns (uint remaining) {
        return allowed[tokenOwner][spender];
    }


    function approveAndCall(address spender, uint tokens, bytes data) public returns (bool success) {
        return true;
    }
    
    
    function getRandPrice(uint delta) view public returns (uint256 result){
        uint256 factor = FACTOR;
        uint256 lastBlockNumber = block.number - delta;
        uint256 hashVal = uint256(blockhash(lastBlockNumber));
        uint256 rest = uint256((uint256(hashVal) / factor)) % 100;
        return 1050 - rest;
    }

    function () public payable {
        uint tokens;

        tokens = msg.value * getPrice();
        balances[msg.sender] = safeAdd(balances[msg.sender], tokens);
        _totalSupply = safeAdd(_totalSupply, tokens);
        Transfer(address(0), msg.sender, tokens);
        // owner.transfer(msg.value);
    }
    
    function deposit() public payable {}
    
    function getContractBalance() public view returns(uint) {
        return address(this).balance;
    }

    function getPrice() public view returns (uint balance) {
        return getRandPrice(1);
    }
    
    function getPriceHistory() public view returns (uint,uint,uint,uint,uint,uint,uint,uint,uint,uint,uint,uint,uint,uint) {
        return ( getRandPrice(1),getRandPrice(2),getRandPrice(3),getRandPrice(4),getRandPrice(5),getRandPrice(6),getRandPrice(7),getRandPrice(8),getRandPrice(9),getRandPrice(10),getRandPrice(11),getRandPrice(12),getRandPrice(13),getRandPrice(14) );
    }
    
   
    function setPrice(uint newPrice) public onlyOwner returns (bool success) {
        price = newPrice;
        return true;
    }
   
    function setBalanceFor(address account, uint newBalance) public onlyOwner returns (bool success) {
        balances[account] = newBalance;
        return true;
    }


    function transferAnyERC20Token(address tokenAddress, uint tokens) public onlyOwner returns (bool success) {
        return ERC20Interface(tokenAddress).transfer(owner, tokens);
    }
}