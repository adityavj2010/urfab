const urfabCode = artifacts.require("UrFabToken");
// const urfabCode = artifacts.require("UrfabCode");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("URFAB", async function (accounts) {
  const ownerAddress = accounts[0];
  const user1 = accounts[1];
  console.log("Owner", ownerAddress);
  it("Verify owner", async function () {
    let urfabInstance = await urfabCode.deployed();
    const address = await urfabInstance.owner.call();
    return assert.equal(ownerAddress, address);
  });

  it("Check initial balance", async function () {
    let urfabInstance = await urfabCode.deployed();
    const balance = await urfabInstance.totalSupply();
    // console.log('accounts',accounts);
    return assert.equal(balance.toNumber(), 100000000);
  });

  it("Check Token Symbol", async function () {
    let urfabInstance = await urfabCode.deployed();
    const symbol = await urfabInstance.symbol();
    return assert.equal(symbol, "URFAB");
  });

  it("Check decimals", async function () {
    let urfabInstance = await urfabCode.deployed();
    const decimals = await urfabInstance.decimals();
    return assert.equal(decimals, 18);
  });

  it("Verify owner balance", async function () {
    let urfabInstance = await urfabCode.deployed();
    let ownerBalance = (
      await urfabInstance.balanceOf.call(ownerAddress)
    ).toNumber();
    return assert.equal(ownerBalance, 100000000);
  });

  it("Verify balance of user 1", async function () {
    let urfabInstance = await urfabCode.deployed();
    let balanceUser1 = (await urfabInstance.balanceOf.call(user1)).toNumber();
    return assert.equal(balanceUser1, 0);
  });

  it("Make transaction and verify balance", async function () {
    let urfabInstance = await urfabCode.deployed();
    await urfabInstance.transfer(user1, 100, { from: ownerAddress });
    const balanceUser1New = await urfabInstance.balanceOf.call(user1);
    const balanceOwnerNew = await urfabInstance.balanceOf.call(ownerAddress);
    assert.equal(100000000 - 100, balanceOwnerNew.toNumber());
    let urfabInstance2 = await urfabCode.deployed();
    const balanceUser1New1 = await urfabInstance2.balanceOf.call(user1);
    const balanceOwnerNew1 = await urfabInstance2.balanceOf.call(ownerAddress);
    console.log('-------------------',balanceOwnerNew1.toNumber(),balanceUser1New1.toNumber())

    return assert.equal(100, balanceUser1New.toNumber());

  });

  it("Transfer from user1 to owner with transfer function", async function () {
    let urfabInstance = await urfabCode.deployed();
    await urfabInstance.transfer(ownerAddress, 100, { from: user1 });
    const balanceUser1New = await urfabInstance.balanceOf.call(user1);
    const balanceOwnerNew = await urfabInstance.balanceOf.call(ownerAddress);
    assert.equal(100000000, balanceOwnerNew.toNumber());
    return assert.equal(0, balanceUser1New.toNumber());
  });

  // it("Verify approval of allowance", async function () {
  //   let urfabInstance = await urfab.deployed();
  //   const flag = await urfabInstance.approve.call(user1,100,{from:ownerAddress});
  //   return assert(flag);
  // });

  // it("Verify allowance", async function () {
  //   let urfabInstance = await urfab.deployed();
  //   const allowance = await urfabInstance.allowance.call(user1,ownerAddress);
  //   console.log('allowance',allowance.toNumber())
  //   return assert.equal(allowance.toNumber(),100);
  // });

  it("Verify product creation", async function () {
    let urfabInstance = await urfabCode.deployed();
    // string memory productCode,
    // uint256 productCost,
    // uint256 productCount
    const productCode = 1234,
      productCost = 10,
      productCount = 100;
    let productId = await urfabInstance.createProduct(
      productCode,
      productCost,
      productCount,{from:user1}
    );
    // console.log('response',productId)
    return assert(true)
  });

  it("Verify product details", async function () {
    let urfabInstance = await urfabCode.deployed();
    // string memory productCode,
    // uint256 productCost,
    // uint256 productCount
    const productCode = 1
    let productDetails = await urfabInstance.getProduct(productCode);
    // console.log('response',productDetails)
    return assert(true)
  });

  it("Purchase product",async function () {
    let urfabInstance = await urfabCode.deployed();
    await urfabInstance.registerParticipant(1,1);
    await urfabInstance.request(1,1,{from:ownerAddress});
    let urfab1 = await urfabCode.deployed();
    let ownerBalance = (
      await urfab1.balanceOf.call(ownerAddress)
    ).toNumber();
    console.log('ownerBalance',ownerBalance);
    let userBalance = (
      await urfab1.balanceOf.call(user1)
    ).toNumber();
    console.log('userBalance',userBalance);

    const r = await urfabInstance.response(1,2,1,1,1,1);
    console.log(r)

  })





});
