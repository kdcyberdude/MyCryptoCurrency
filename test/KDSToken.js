var KDSToken = artifacts.require("KDSToken");

contract("KDSToken",function(accounts){
  var tokenInstance;
  it('sets the total supply upon deployment', function(){
    return KDSToken.deployed().then(function(instance){
      tokenInstance = instance;
      return tokenInstance.totalSupply();
    }).then(function(totalSupply){
      assert(totalSupply.toNumber(),1000000,'sets the total supply to 1,000,000');
      return tokenInstance.balanceOf(accounts[0]);
      }).then(function(balance){
        assert.equal(balance.toNumber(),1000000,'Initialy created tokens 1000000...balance');
        console.log('balance is :' + balance);
    });
  });

  it('transfers token ownership', function() {
    return KDSToken.deployed().then(function(instance) {
      tokenInstance = instance;
      // Test `require` statement first by transferring something larger than the sender's balance
      return tokenInstance.transfer.call(accounts[2], 999999999, {from: accounts[0]});
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0 , error.message + ' error message must contain revert');
      return tokenInstance.transfer.call(accounts[2], 250000, { from: accounts[0] });
    }).then(function(success) {
      assert.equal(success, true, 'it returns true');
      return tokenInstance.transfer(accounts[2], 250000, { from: accounts[0] });
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, 'triggers one event');
      assert.equal(receipt.logs[0].event, 'Transfer', 'should be the "Transfer" event');
      assert.equal(receipt.logs[0].args._from, accounts[0], 'logs the account the tokens are transferred from');
      assert.equal(receipt.logs[0].args._to, accounts[2], 'logs the account the tokens are transferred to');
      assert.equal(receipt.logs[0].args._value, 250000, 'logs the transfer amount');
      return tokenInstance.balanceOf(accounts[2]);
    }).then(function(balance) {
      assert.equal(balance.toNumber(), 250000, 'adds the amount to the receiving account');
      return tokenInstance.balanceOf(accounts[0]);
    }).then(function(balance) {
      assert.equal(balance.toNumber(), 750000, 'deducts the amount from the sending account');
    });
  });

  it('approve takens for Delegated transfer',function(){
    return KDSToken.deployed().then(function(instance){
      tokenInstance = instance;
      return tokenInstance.approve.call(accounts[2],100);
    }).then(function(success){
      assert.equal(success,true,'it returns true');
      return tokenInstance.approve(accounts[2],100, {from: accounts[0]});
    }).then(function(receipt){
      assert.equal(receipt.logs.length, 1, 'triggers one event');
      assert.equal(receipt.logs[0].event, 'Approval', 'should be the "Approval" event');
      assert.equal(receipt.logs[0].args._owner, accounts[0], 'logs the account the tokens are authorized by');
      assert.equal(receipt.logs[0].args._spender, accounts[2], 'logs the account the tokens are authorized to');
      assert.equal(receipt.logs[0].args._value, 100, 'logs the transfer amount');
      return tokenInstance.allowance(accounts[0],accounts[2]);
    }).then(function(allowance){
      assert.equal(allowance,100,'stores the allowance for delegated transfer');
    });
  });

  it('handles delegate transfer',function(){
    return KDSToken.deployed().then(function(instance){
      tokenInstance = instance;
      fromAccount = accounts[5];
      toAccount = accounts[6];
      spendingAccount = accounts[7];
      //Transfer some tokens to from accounts
      return tokenInstance.transfer(fromAccount, 100, { from: accounts[0] });
    }).then(function(receipt) {
      // Approve spendingAccount to spend 10 tokens form fromAccount
      return tokenInstance.approve(spendingAccount, 10, { from: fromAccount });
    }).then(function(receipt) {
      // Try transferring something larger than the sender's balance
      return tokenInstance.transferFrom(fromAccount, toAccount, 9999, { from: spendingAccount });
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, 'cannot transfer value larger than balance');
      // Try transferring something larger than the approved amount
      return tokenInstance.transferFrom(fromAccount, toAccount, 20, { from: spendingAccount });
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, 'cannot transfer value larger than approved amount');
      return tokenInstance.transferFrom.call(fromAccount, toAccount, 10, { from: spendingAccount });
    }).then(function(success) {
      assert.equal(success, true);
      return tokenInstance.transferFrom(fromAccount, toAccount, 10, { from: spendingAccount });
    }).then(function(receipt){
      assert.equal(receipt.logs.length, 1, 'triggers one event');
      assert.equal(receipt.logs[0].event, 'Transfer', 'should be the "Transfer" event');
      assert.equal(receipt.logs[0].args._from, fromAccount, 'logs the account the tokens are transferred from');
      assert.equal(receipt.logs[0].args._to, toAccount, 'logs the account the tokens are transferred to');
      assert.equal(receipt.logs[0].args._value, 10, 'logs the transfer amount');
      return tokenInstance.balanceOf(fromAccount);
    }).then(function(balance) {
      assert.equal(balance.toNumber(), 90, 'deducts the amount from the sending account');
      return tokenInstance.balanceOf(toAccount);
    }).then(function(balance) {
      assert.equal(balance.toNumber(), 10, 'adds the amount from the receiving account');
      return tokenInstance.allowance(fromAccount, spendingAccount);
    }).then(function(allowance){
      assert.equal(allowance,0,'deducts the amount from the allowance');
    });
  });
});
