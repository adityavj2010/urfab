const urfab = artifacts.require("UrFabToken");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("urfab", function (/* accounts */) {
  it("should assert true", async function () {
    await urfab.deployed();
    return assert.isTrue(true);
  });
});
