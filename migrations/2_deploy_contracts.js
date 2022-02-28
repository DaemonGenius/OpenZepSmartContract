const Steinnegen = artifacts.require("@DaemonGenius/ico/ico-steinnegen-coin/contracts/Steinnegen.sol");
const SteinnegenSale = artifacts.require("./SteinnegenSale.sol");

module.exports = async (deployer) => {
  let tokenPrice = 1000000000000000;

  await deployer.deploy(Steinnegen);
  await deployer.deploy(SteinnegenSale, Steinnegen.address, tokenPrice);
}; 



