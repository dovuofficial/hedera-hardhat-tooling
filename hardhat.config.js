require('dotenv').config();
require('module-alias/register')
require("@nomiclabs/hardhat-waffle");

const shell = require('shelljs')
const { TokenId } = require("@hashgraph/sdk");

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
        .addAddress(new TokenId(0,0, 34111069).toSolidityAddress())
    }

    const contractId = await Hashgraph(client).contract.create(contractInitialisation)

    // Inject the latest deployed contract ID into the env
    shell.exec(`bin/update-contract-id ${args.contract} ${contractId.toString()}`)

    console.log('Contract id: ' + contractId.toString());
  });

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.0",
  // NOTE: Adding the optimiser by default, may remove later
  optimizer: {
    enabled: true,
    runs: 1000,
  },
};
