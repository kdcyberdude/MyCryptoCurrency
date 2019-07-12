pragma solidity >=0.4.21 <0.6.0;

import "./KDSToken.sol";

contract KDSTokenSale {
  address payable admin;
  KDSToken public tokenContract;
  uint public tokenPrice;
  uint public tokensSold;

  modifier onlyAdmin() {
    require(msg.sender == admin);
    _;
  }

  event Sell(address _buyer, uint _amount);

  constructor(KDSToken _tokenContract, uint _tokenPrice) public {
    admin = msg.sender;
    tokenContract = _tokenContract;
    tokenPrice = _tokenPrice;
  }

  // multiply--- internal means internal to the contract  and pure implies it does not deal with blockchain
  function multiply(uint x, uint y) internal pure returns (uint z) {
    require(y==0 || (z = x * y) / y == x);
    // takes from DSMath library available on github
  }

  // Buy Tokens
  function buyTokens(uint _numberOfTokens) public payable{
    // Require that value is equal to tokens
    require(msg.value == multiply(_numberOfTokens, tokenPrice));
    // Require that the contract has enough tokens
    require(tokenContract.balanceOf(address(this)) >= _numberOfTokens);
    // buying functionality
    require(tokenContract.transfer(msg.sender, _numberOfTokens));
    // Keep track of tokensSold
    tokensSold += _numberOfTokens;
    // Triger Sell Event
    emit Sell(msg.sender, _numberOfTokens);
  }

  function endSale() public onlyAdmin(){
        require(tokenContract.transfer(admin, tokenContract.balanceOf(address(this))));

        admin.transfer(address(this).balance);
        selfdestruct(admin);
    }
}
