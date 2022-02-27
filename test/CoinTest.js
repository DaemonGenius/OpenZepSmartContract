var CoinToken = artifacts.require("./Coin.sol");

contract("CoinToken", async function (accounts) {
  let CoinInstance;
  // before tells our tests to run this first before anything else
  before(async () => {
    coinInstance = await CoinToken.deployed();
  });

  it("Initializes the contract with the correct Symbol", async () => {
    let symbol = await coinInstance.symbol();
    assert.equal(symbol, "STEIN", "Has the correct symbol");
  });

  it("Initializes the contract with the correct Name", async () => {
    let name = await coinInstance.name();
    assert.equal(name, "Steinnegen", "Has the correct name");
  });

  it("sets the total supply upon deployment", async () => {
    let totalSupply = await coinInstance.totalSupply();
    assert.equal(
      totalSupply.toNumber(),
      100000000,
      "sets the total supply to 1 000 000 000 000"
    );
  });

  it("BalanceOf", async () => {
    let BalanceOf = await coinInstance.balanceOf(accounts[0]);
    assert.equal(
      BalanceOf.toNumber(),
      100000000,
      "allocates the initial supply to the admin account"
    );
  });

  it("Transfers Token Ownership", async () => {
    let transferInstance = "";
    let transferAmount = 250000;

    try {
      await coinInstance.transfer.call(accounts[1], 9999999999999999999999999);
    } catch (error) {
      assert(
        error.message.indexOf("overflow") >= 0,
        "error message must contain revert"
      );
    }

    assert.equal(
      await coinInstance.transfer.call(accounts[0], transferAmount),
      true,
      "Transfer Successful"
    );

    let BalanceOfSenderPrior = await coinInstance.balanceOf(accounts[0]);
    console.log("Account 0: " + BalanceOfSenderPrior.toNumber());

    let BalanceOfAccountPrior = await coinInstance.balanceOf(accounts[1]);
    console.log("Account 1: " + BalanceOfAccountPrior.toNumber());
    let receipt = "";
    try {
      receipt = await coinInstance.transfer(accounts[1], transferAmount, {
        from: accounts[0],
      });

    } catch (error) {
      assert(error, "Transfer failure");
    }

    let BalanceOf = await coinInstance.balanceOf(accounts[1]);

    assert.equal(
      BalanceOf.toNumber(),
      BalanceOfAccountPrior.toNumber() + transferAmount,
      "adds the amount to the receiving account"
    );
    console.log("Account 1: " + BalanceOf.toNumber());

    BalanceOf = await coinInstance.balanceOf(accounts[0]);

    assert.equal(
      BalanceOf.toNumber(),
      BalanceOfSenderPrior.toNumber() - transferAmount,
      "deducts the amount to the sending account"
    );

    console.log("Account 0: " + BalanceOf.toNumber());

    assert.equal(receipt.logs.length, 1, "triggers one event");
    assert.equal(
      receipt.logs[0].args.value,
      transferAmount,
      "Logs transfer amount"
    );

    console.log("Receipt Logs: " + JSON.stringify(receipt.logs[0]));
    console.log("Receipt Logs Transfer Amount: " + receipt.logs[0].args.value);
  });

  it("approves tokens for delegated transfer", async () => {
    let approve = await coinInstance.approve.call(accounts[1], 100);
    assert.equal(approve, true, "Success");

    let receipt = await coinInstance.approve(accounts[1], 100);
    assert.equal(receipt.logs.length, 1, "triggers one event");
    assert.equal(
      receipt.logs[0].event,
      "Approval",
      'Should be the "Approval" event'
    );

    console.log(receipt);

    let allowance = await coinInstance.allowance(accounts[0], accounts[1]);

    assert.equal(
      allowance,
      100,
      "stores the allowance for the delegated transfer"
    );
  });

  it("handles delegated token transfer", async () => {
    let fromAccount = accounts[2];
    let toAccount = accounts[3];
    let spendingAccount = accounts[4];
    let transferAmount = 10;
    await coinInstance.transfer(fromAccount, 100, {
      from: accounts[0],
    });

    await coinInstance.approve(spendingAccount, transferAmount, {
      from: fromAccount,
    });

    try {
      // Try transfering somethign larget than the sender's balance

      await coinInstance.transferFrom(fromAccount, toAccount, 99999999999, {
        from: spendingAccount,
      });
    } catch (error) {
      assert(
        error.message.indexOf("revert") >= 0,
        "Cannot transfer more than current balance"
      );
    }

    try {
      // Try transfering somethign larget than the approved amount
      await coinInstance.transferFrom(fromAccount, toAccount, 20, {
        from: spendingAccount,
      });
    } catch (error) {
      assert(
        error.message.indexOf("revert") >= 0,
        "CAnnot transfer more than approved amount balance"
      );
    }

    try {
      assert.equal(
        await coinInstance.transferFrom.call(fromAccount, toAccount, 20, {
          from: spendingAccount,
        }),
        true,
        "Transfer Successful"
      );
    } catch (error) {
      assert(error.message.indexOf("revert") >= 0, error.message);
    }

    try {
      let receipt = await coinInstance.transferFrom(fromAccount, toAccount, 10, {
        from: spendingAccount,
      });
      assert.equal(receipt.logs.length, 2, "triggers one event");
      assert.equal(
        receipt.logs[1].event,
        "Transfer",
        'Should be the "Transfer" event'
      );
      assert.equal(
        receipt.logs[1].args.from,
        fromAccount,
        "logs the account the tokens are trasferred from"
      );
      assert.equal(
        receipt.logs[1].args.to,
        toAccount,
        "logs the account the tokens are trasferred to"
      );
      assert.equal(receipt.logs[1].args.value, 10, "logs the transfer amount");

      console.log(receipt);
      console.log("Receipt Logs: " + JSON.stringify(receipt.logs[1]));
      console.log(
        "Receipt Logs Transfer Amount: " + receipt.logs[1].args.value
      );
    } catch (error) {
      console.log(error);
      assert(error.message.indexOf("revert") >= 0, error.message);
    }

    BalanceOfFrom = await coinInstance.balanceOf(fromAccount);

    assert.equal(
      BalanceOfFrom.toNumber(),
      90,
      "deducts the amount to the sending account"
    );
    console.log("From Account: " + BalanceOfFrom.toNumber());

    BalanceOfTo = await coinInstance.balanceOf(toAccount);

    assert.equal(
      BalanceOfTo.toNumber(),
      10,
      "adds the amount to the receiving account"
    );
    console.log("From Account: " + BalanceOfTo.toNumber());

    allowance = await coinInstance.allowance(fromAccount, spendingAccount);

    assert.equal(allowance.toNumber(), 0, "deducts the amount form the allowance");
  });
});
