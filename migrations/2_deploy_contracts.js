const UrFabToken = artifacts.require("UrFabToken");
const ERC20 = artifacts.require("ERC20");
const Owned = artifacts.require("Owned");
const SafeMath = artifacts.require("SafeMath");
const UrfabCode = artifacts.require("UrfabCode");
module.exports = function(deployer) {
  deployer.deploy(SafeMath);
//   deployer.deploy(ERC20);
  deployer.deploy(Owned);
  deployer.link(SafeMath, UrFabToken);
  deployer.link(Owned, UrFabToken);
  deployer.deploy(UrFabToken);
  deployer.link(SafeMath, UrfabCode);
  deployer.link(Owned, UrfabCode);
  deployer.deploy(UrfabCode);

};
