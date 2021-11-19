const UrFabToken = artifacts.require("UrFabToken");
const ERC20 = artifacts.require("ERC20");
const Owned = artifacts.require("Owned");
const SafeMath = artifacts.require("SafeMath");
module.exports = function(deployer) {
  deployer.deploy(SafeMath);
//   deployer.deploy(ERC20);
  deployer.deploy(Owned);
  deployer.link(SafeMath, UrFabToken);
//   deployer.link(ERC20, UrFabToken);
  deployer.link(Owned, UrFabToken);
  deployer.deploy(UrFabToken);
};
