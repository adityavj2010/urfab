const urfab = artifacts.require("UrFabToken");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("URFAB", async function (accounts) {
  const ownerAddress = accounts[0]
  it("Verify owner", async function () {
    let urfabInstance = await urfab.deployed();
    const address = await urfabInstance.owner.call();
    return assert.equal(ownerAddress,address)
  });

  it("Check initial balance", async function () {
    let urfabInstance = await urfab.deployed();
    const balance = await urfabInstance.totalSupply();
    // console.log('accounts',accounts); 
    return assert.equal(balance.toNumber(),100000000);
  });

  it("Check Token Symbol", async function () {
    let urfabInstance = await urfab.deployed();
    const symbol = await urfabInstance.symbol();
    return assert.equal(symbol,"URFAB");
  });

  it("Check decimals", async function () {
    let urfabInstance = await urfab.deployed();
    const decimals = await urfabInstance.decimals();
    return assert.equal(decimals,18);
  });

});
