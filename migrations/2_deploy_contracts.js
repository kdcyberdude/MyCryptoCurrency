const KDSToken = artifacts.require("KDSToken");
const KDSTokenSale = artifacts.require("KDSTokenSale");

module.exports = function(deployer) {
  deployer.deploy(KDSToken,1000000).then(function() {
    var tokenPrice = 1000000000000000;
    // token price is 0.001 ether
    return deployer.deploy(KDSTokenSale, KDSToken.address, tokenPrice);
  });
};
