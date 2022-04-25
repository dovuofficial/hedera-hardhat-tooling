# Hedera Smart Contract deployments and testing 

This is some simple tooling that you can utilise to start to work with Hedera Smart contracts, in particular:

- All of the Hedera Services HTS contracts within the repository.
- A method to deploy contracts to testnet.
- Example tests of simple smart contracts.
- Basic scaffold of interacting and creating contracts for Hedera.
- Example flow for reducing feedback loop for deployment/testing contracts

Generally for users that are new to smart contracts having to deal with loop of compiling contracts then injecting them into the methods in order for them to be deployed onto the network can be a bit mysterious and challenging.

# Understand the create, deploy, and test flow

For newcomers of smart contracts it can be a challenge, the aim of these tools is to reduce the deploy/test loop of smart contracts to a single command.

You can see all the commands in the Makefile, but this is effectively what happens.

## Deploy

This command deploys a smart contract to Hedera Testnet, it compiles the contract, then deploys.

```
make deploy CONTRACT=HTS
```

You can switch out the **CONTRACT** parameter to the name of whatever contract you are working on, after the automatic compile step it will attempt to intelligently seek the bytecode that was previously generated then deploy.

In addition, in your **.env** a value will be injected that references the recently deployed contract, for **HTS** it would be **HTS_CONTRACT_ID**.

## Test Contract

This command allows you to test a given contract based on a given file format in your `/tests` directory, the file name must be in the lowercase form of the Contract's name.

```
make test-contract CONTRACT=HTS
```

If your contract is named **HTS.sol**, your test file is named **hts-contract.js**, inside of tests.

The test file should use a reference to the contract ID that has been generated, so in the case of the **HTS** contract you can see being dynamically referenced.

```javascript
const contractId = process.env.HTS_CONTRACT_ID;
```

## Deploy and immediately test contract

This final command combines the actions above so that you may created and deploy a contract, then straight after run tests against it.

```
make deploy-test CONTRACT=HTS
```

This command is going to be useful for Github actions and CI/CD pipelines as well as saving time.

Furthermore, when running these command a number of interesting things will happen:

- A test js file will be generated for you automatically based on an example stub, if you haven't created it already.
  - The stub includes a test that will always pass if your smart contract inherits the [Ownable](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol) class.
- Newly generated contract ids will be injected into your .env and related test classes.

*tl;dr, create a new smart contract and run this command and the system will generate sensible and intelligent defaults.*

# Stakeable Basic Contract

This is the deployed stakable project for owner `0.01156`, that you may reference as a user.

See the Demo Projects that have been added in the `add-demo-projects` hardhat command to get started claiming and staking/unstaking.

I would implore you to read the JS tests for interacting with the contract, at use that as the basis for the frontend.

```
STAKABLEPROJECT_CONTRACT_ID=0.0.34168439
```

However, once you have configured your environment with your Hedera Creds you may deploy the contract run the tests and ensure that all the demo projects are in place, so that a fresh contract is owned by your credentials/account keys.

This is a one step command to get everything started for you.

```
make deploy-test-stakable-base-contract
```

## Other contracts with tests, to use as inspiration

### Timelock example

As part of our staking contract We are aiming to add time lock capabilities for modifying longtime locks for the ability for users to undertake their value from a given project. This is a temporary measure for the basis of the hackathon.

```
make deploy-test-timelock
```

## Notes

This is early in development there isn't method binding to elegantly call methods in a fluent manner, But it's nice to have little pipeline to compile, deploy, and test.

Currently, our contract deploy functionality is based off of a constructor so if you are targeting different constructors you'll need to modify the deploy script.

# How to use setup your env + Hardhat commands:

Set up your `.env` from `.env.example` with your testnet credentials.

`cp .env.example .env`

## Run Tests

These tests will compile your contracts and deploy them.

`npx hardhat test`

## Compile Contracts

If you try to deploy contracts but they fail try compiling them, this will automatically update the contracts directory at the root of the project.

`npx hardhat compile`

## Deploying contracts to Hedera

Use this commands to deploy contracts to the testnet, Later on will add support for production/preview releases. The hardhat system generates compiled bytecode that can be picked up through the Native Hedera libs without manual intervention.
s
`hardhat deploy --contract HelloWorld`

## Hardhat Help

You just come in below to interrogates what methods are available for hardhat, it is mainly an EVM To however this project is just modifying and enhancing for basic contract integration and deployment. 

```
npx hardhat help
```
