# Deploy a smart contract to Hedera testnet
deploy:
	hardhat compile
	hardhat deploy --contract $(CONTRACT)

# Target a specific contract based on the "test/*-contract.js" format
test-contract:
	hardhat test test/$(shell echo $(CONTRACT) | tr A-Z a-z)-contract.js

# Deploy a contract and test in one step
deploy-test:
	make deploy CONTRACT=$(CONTRACT)
	make test-contract CONTRACT=$(CONTRACT)

