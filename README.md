# Hedera Smart Contract deployments and testing 

This is some simple tooling that you can utilise to start to work with Hedera Smart contracts, in particular:

- All of the Hedera Services HTS contracts within the repository.
- A method to deploy contracts to testnet.
- Example tests of simple smart contracts.
- Basic scaffold of interacting and creating contracts for Hedera.

Generally for users that are new to smart contracts having to deal with loop of compiling contracts then injecting them into the methods in order for them to be deployed onto the network can be a bit mysterious and challenging.

## Notes

This is early in development there isn't method binding to elegantly call methods in a fluent manner, But it's nice to have little pipeline to compile, deploy, and test.

*It would be nice to be able to run tests without having to directly redeploy contracts every time.*

## How to use this:

Set up your `.env` from `.env.example` with your testnet credentials.

`cp .env.example .env`

## Run Tests

These tests will compile your contracts and deploy them.

`npx hardhat test`

## Compile Contracts

If you try to deploy contracts but they fail try compiling them, this will automatically update the contracts directory at the root of the project.

`npx hardhat compile`

## Deploying contracts to Hedera

Use this commands to deploy contracts to the testnet, Later on will add support for production/preview releases. What this does is it looks the bike code that has been generated from the previous compile command and it uses that to inject into the Hedera services JavaScript methods.

`hardhat deploy --contract HelloWorld`

## Hardhat Help

You just come in below to interrogates what methods are available for hardhat, it is mainly an EVM To however this project is just modifying and enhancing for basic contract integration and deployment. 

```
npx hardhat help
```
