require('dotenv').config();
require('module-alias/register')
require("@nomiclabs/hardhat-waffle");

const {
  Network,
  Config,
  Hashgraph,
  SDK: {
    ContractFunctionParameters
  }
} = require("hashgraph-support")

/**
 * Leave this as a helper for deploying a smart contract,
 */
task("deploy", "Deploy a hedera contract")
  .addParam("contract", "Name of contract that you wish to deploy to Hedera, from your /contracts folder")
  .addOptionalParam("destination", "The network that you are deploying to. Currently supporting previewnet/testnet", "",)
  .setAction(async (args) => {

    const destinationNetwork = args.destination || Config.network
    const client = Network.getNodeNetworkClient(destinationNetwork)

    const contractInitialisation = {
      contractName: args.contract,
      // Optional, injected into the constructor, in this case for the "HelloWorld" Contract
      constructorParams: new ContractFunctionParameters()
        .addString("hello world")
    }

    const contractId = await Hashgraph(client).contract.create(contractInitialisation)

    console.log('Contract id: ' + contractId.toString());
  });

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.6.12"
};
