# Deploy a smart contract to Hedera testnet
deploy:
	hh compile
	hh deploy --contract $(CONTRACT)

# Target a specific contract based on the "test/*-contract.js" format
test-contract:
	hh test test/$(shell echo $(CONTRACT) | tr A-Z a-z)-contract.js

# Deploy a contract and test in one step
deploy-test:
	make deploy CONTRACT=$(CONTRACT)
	make test-contract CONTRACT=$(CONTRACT)

## This is the solidity contract name (example of custom commands)
CONTRACT = "StakableProject"

## Simply a utility to get the contract into a state that is completely tested and employed given a custom environment/owner, with demo projects
deploy-test-stakable-base-contract:
	make deploy CONTRACT=$(CONTRACT)
	hh add-demo-projects
	make test-contract CONTRACT=$(CONTRACT)

# Deploy timelock example contract and run tests
deploy-test-timelock:
	make deploy-test CONTRACT=TimelockExample
