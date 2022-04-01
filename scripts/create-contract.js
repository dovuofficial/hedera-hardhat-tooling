// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
// const hre = require("hardhat");

require("@nomiclabs/hardhat-web3");

task("balance", "Prints an account's balance").setAction(async () => {
  return 'hello balance'
});

module.exports = {};
