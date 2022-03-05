const Steinnegen = artifacts.require(
  "@DaemonGenius/ico/ico-steinnegen-coin/contracts/Steinnegen.sol"
);
const SteinnegenSale = artifacts.require("./SteinnegenSale.sol");

let wallet, gas, gasPrice;

module.exports = async (deployer) => {

  if (deployer.network == "ethereum") {
    wallet = config.addresses.ethereum.WALLET_ADDRESS;
    gas = config.constants.MAX_GAS;
    gasPrice = config.constants.DEFAULT_HIGH_GAS_PRICE;
  } else if (deployer.network == "ropsten") {
    wallet = config.addresses.ropsten.WALLET_ADDRESS;
    gas = config.constants.DEFAULT_GAS;
    gasPrice = config.constants.DEFAULT_HIGH_GAS_PRICE;
  } else if (deployer.network == "rinkeby") {
    wallet = config.addresses.rinkeby.WALLET_ADDRESS;
    gas = config.constants.MAX_GAS;
    gasPrice = config.constants.DEFAULT_GAS_PRICE;
  } else if (deployer.network == "development") {
   
  } else {
    throw new Error("Wallet not set");
  }

  let tokenPrice = 1000000000000000;

  await deployer.deploy(Steinnegen);
  await deployer.deploy(
    SteinnegenSale,
    Steinnegen.address,
    tokenPrice,
    1654452435, // November 1st 1PM GMT: 1509541200
    1659722835, // December 1st 1PM GMT: 1512133200
    { gas: gas, gasPrice: gasPrice }
  );
};
