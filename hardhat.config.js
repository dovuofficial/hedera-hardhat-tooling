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
        .addAddress(new TokenId(0,0, 34185686).toSolidityAddress())
        //.addAddress(new TokenId(0,0, 34111069).toSolidityAddress())
    }

    const contractId = await Hashgraph(client).contract.create(contractInitialisation)

    // Check that contract test exist
    shell.exec(`bin/check-for-contract-test ${args.contract.toUpperCase()}`)

    // Inject the latest deployed contract ID into the env
    shell.exec(`bin/update-contract-id ${args.contract.toUpperCase()} ${contractId.toString()}`)

    console.log('Contract id: ' + contractId.toString());
  });

/**
 * This task deploys some sensible defaults projects to the StakableProject Contract
 *
 * Run this once for a new StakableProject Contract
 *
 * WARN: This will only work once
 */
task("add-demo-projects", "Add initial demo projects to StakableProject ")
  .setAction(async (args) => {

    const destinationNetwork = args.destination || Config.network
    const client = Network.getNodeNetworkClient(destinationNetwork)
    const hashgraph = Hashgraph(client);
    const contractId = process.env.STAKABLEPROJECT_CONTRACT_ID;

    const addProject = async (projectName, address) => {
      await hashgraph.contract.call({
        contractId: contractId,
        method: "addProject",
        params: new ContractFunctionParameters()
          .addString(projectName)
          .addAddress(address)
      })
    }

    try {
      // TODO: In the future the project name and address will refer to the actual project and the token ID
      await addProject('farm-one', TokenId.fromString('0.0.1').toSolidityAddress())
      await addProject('farm-two', TokenId.fromString('0.0.2').toSolidityAddress())
      await addProject('farm-three', TokenId.fromString('0.0.3').toSolidityAddress())
    } catch (e) {
      console.warn('If you are seeing this these projects have already been deployed onto the contract');
    }
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
