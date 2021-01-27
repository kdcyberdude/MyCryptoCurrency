const KDSToken = artifacts.require("KDSToken");
const KDSTokenSale = artifacts.require("KDSTokenSale");

module.exports = function(deployer) {
  deployer.deploy(KDSToken,new web3.utils.BN(1000000)).then(function() {
    const tokenPrice = new web3.utils.BN(1000000000000000);
    const totalTokensForSale = new web3.utils.BN(750000);
    // token price is 0.001 ether
    return deployer.deploy(KDSTokenSale, KDSToken.address.toString(), tokenPrice, totalTokensForSale);
  });
};
