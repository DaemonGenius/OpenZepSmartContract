const Coin = artifacts.require("./Coin.sol");
const CoinSale = artifacts.require("./CoinSale.sol");

module.exports = async (deployer) => {
  let tokenPrice = 1000000000000000;

  await deployer.deploy(Coin);
  await deployer.deploy(CoinSale, Coin.address, tokenPrice);
}; 



