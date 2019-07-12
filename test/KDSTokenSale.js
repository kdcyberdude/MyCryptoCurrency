var KDSTokenSale = artifacts.require('KDSTokenSale');
var KDSToken = artifacts.require('KDSToken');

contract('KDSTokenSale', function(accounts) {
  var tokenSaleInstance;
  var tokenInstance;
  var buyer = accounts[1];
  var admin = accounts[0];
  var tokensAvailable = 750000;
  var tokenPrice = 1000000000000000;
  var numberOfTokens;
  it('initializes the contract with the correct values', function(){
    return KDSTokenSale.deployed().then(function(instance){
      tokenSaleInstance = instance;
      return tokenSaleInstance.address;
    }).then(function(address) {
      assert.notEqual(address, 0x0, 'has contract address');
      return tokenSaleInstance.tokenContract();
    }).then(function(address) {
      assert.notEqual(address, 0x0, 'has token contract address');
      return tokenSaleInstance.tokenPrice();
    }).then(function(price) {
      assert.equal(price, tokenPrice, 'token price is correct')
    });
  });

  it('facilitates token buying', function(){
    return KDSToken.deployed().then(function(instance){
      // Grab token instance first
      tokenInstance = instance;
      return KDSTokenSale.deployed();
    }).then(function(instance){
      // Then grab token sale instance
      tokenSaleInstance = instance;
      // Provision 75% fo all tokens to tokenSale
      return tokenInstance.transfer(tokenSaleInstance.address, tokensAvailable, {from: admin });
    }).then(function(receipt) {
      numberOfTokens = 10;
      return tokenSaleInstance.buyTokens(numberOfTokens, {from: buyer,value: numberOfTokens * tokenPrice});
      // solidity function help us to provide meta-data as function argument as above
    }).then(function(receipt) {
      // receipt implies we are creating a transaction
      assert.equal(receipt.logs.length, 1, 'triggers one event');
      assert.equal(receipt.logs[0].event, 'Sell', 'should be the "Sell" event');
      assert.equal(receipt.logs[0].args._buyer, buyer, 'logs the account that purchased the tokens');
      assert.equal(receipt.logs[0].args._amount, numberOfTokens, 'logs the number of tokens purchased');
      return tokenSaleInstance.tokensSold();
    }).then(function(amount) {
      assert.equal(amount.toNumber(), numberOfTokens, 'increments the number of token sold');
      return tokenInstance.balanceOf(buyer);
    }).then(function(balance) {
      assert.equal(balance.toNumber(), numberOfTokens);
      return tokenInstance.balanceOf(tokenSaleInstance.address);
    }).then(function(balance) {
      assert.equal(balance.toNumber(), tokensAvailable - numberOfTokens);
     // Try to buy tokens different from the ether value
     return tokenSaleInstance.buyTokens(numberOfTokens, {from: buyer, value: 1});
   }).then(assert.fail).catch(function(error) {
     assert(error.message.indexOf('revert') >= 0,  'msg.value must equal number of tokens in wei');
     return tokenSaleInstance.buyTokens(800000, { from: buyer, value: numberOfTokens * tokenPrice});
   }).then(assert.fail).catch(function(error) {
     assert(error.message.indexOf('revert') >= 0,  'cannot purchase more tokens than available');
   });
  });

  it('ends token sale', function() {
      return KDSToken.deployed().then(function(instance) {
        // Grab token instance first
        tokenInstance = instance;
        return KDSTokenSale.deployed();
      }).then(function(instance) {
        // Then grab token sale instance
        tokenSaleInstance = instance;
        // Try to end sale from account other than the admin
        return tokenSaleInstance.endSale({ from: buyer });
      }).then(assert.fail).catch(function(error) {
        assert(error.message.indexOf('revert' >= 0, 'must be admin to end sale'));
        // End sale as admin
        return tokenSaleInstance.endSale({ from: admin });
      }).then(function(receipt) {
        return tokenInstance.balanceOf(admin);
      }).then(function(balance) {
        assert.equal(balance.toNumber(), 999990, 'returns all unsold dapp tokens to admin');
        // Check that the contract has no balance
        return tokenInstance.balanceOf(tokenSaleInstance.address);
      }).then(function(balance) {
        assert.equal(balance.toNumber(), 0);
      });
    });

});
