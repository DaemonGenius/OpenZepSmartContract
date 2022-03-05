var SteinnegenSale = artifacts.require("./SteinnegenSale.sol");
var Steinnegen = artifacts.require("@DaemonGenius/ico/ico-steinnegen-coin/contracts/Steinnegen.sol");

contract("SteinnegenSale", async function (accounts) {
  let steinnegenSale;
  let steinnegen;
  let buyer = accounts[1];
  let admin = accounts[0];
  let tokenPrice = 1000000000000000; //wei
  let tokensAvailable = 750000; //wei

  // before tells our tests to run this first before anything else
  before(async () => {
    steinnegenSale = await SteinnegenSale.deployed();
  });
  // before tells our tests to run this first before anything else
  before(async () => {
    steinnegen = await Steinnegen.deployed();
  });

  it("Initializes the contract with the correct Values", async () => {
    let address = await steinnegenSale.address;
    assert.notEqual(address, 0x0, "Has the correct address");

    let tokenContract = await steinnegenSale.tokenContract();

    assert.notEqual(tokenContract, 0x0, "Has a token correct address");

    let price = await steinnegenSale.tokenPrice();

    assert.equal(price, tokenPrice, "Token price is correct");
  });


  

  it("Facilitates token buying", async () => {
    let numberOfTokens = 10;

    let tokenSaleAllocation = steinnegen.transfer(steinnegenSale.address, tokensAvailable, {
      from: admin,
    });

    let receipt = await steinnegenSale.buyTokens(numberOfTokens, {
      from: buyer,
      value: numberOfTokens * tokenPrice,
    });

    console.log(receipt.logs[0].args);
    console.log(receipt.logs[0].args._buyer);

    assert.equal(receipt.logs.length, 1, "triggers one event");
    assert.equal(receipt.logs[0].event, "Sell", 'Should be the "Sell" event');
    assert.equal(
      receipt.logs[0].args._buyer,
      buyer,
      "logs the account that purchased tokens"
    );
    assert.equal(
      receipt.logs[0].args._amount,
      numberOfTokens,
      "logs the number of tokens purchased"
    );

    let tokensSold = await steinnegenSale.tokensSold();

    assert.equal(
      tokensSold.toNumber(),
      numberOfTokens,
      "Number of tokens sold is correct"
    );

    try {
      await steinnegenSale.buyTokens(numberOfTokens, { from: buyer, value: 1 });
      assert(false);
    } catch (error) {
      assert(error.message.indexOf("revert") >= 0, error.message);
    }

    try {
      await steinnegenSale.buyTokens(800000, {
        from: buyer,
        value: numberOfTokens * tokenPrice,
      });
      assert(false);
    } catch (error) {
      assert(error.message.indexOf("revert") >= 0, error.message);
      console.log(error.message);
    }

    let balance = await steinnegen.balanceOf(steinnegenSale.address);

    assert.equal(balance.toNumber(), tokensAvailable - numberOfTokens);
  });

  it("ends token sale", async () => {
    try {
      await steinnegenSale.endSale({
        from: admin,
      });
    } catch (error) {
      assert(error.message.indexOf("revert") >= 0, "Must be an admin");
      console.log(error.message);
    }

    let balance = await steinnegen.balanceOf(admin);

    assert.equal(balance.toNumber(), 99999990, 'retruns all unsold dapp tokens to admin');



    let balance2 = await steinnegen.balanceOf(steinnegenSale.address);

    assert.equal(balance2.toNumber(), 0);

   
  });

  it("Stops Token sale", async () => {
    try {
      await steinnegenSale.finalize();
    } catch (error) {
      assert(error.message.indexOf("revert") >= 0, "Must be an admin");
      console.log(error.message);
    }

    let balance = await steinnegen.balanceOf(admin);
    assert.equal(balance.toNumber(), 99999990, 'retruns all unsold dapp tokens to admin');

    let balance2 = await steinnegen.balanceOf(steinnegenSale.address);
    assert.equal(balance2.toNumber(), 0);

    try {
      await steinnegenSale.buyTokens(numberOfTokens, { from: buyer, value: 1 });
      assert(false);
    } catch (error) {
      assert(error.message.indexOf("revert") >= 0, error.message);
    }
  });
});
