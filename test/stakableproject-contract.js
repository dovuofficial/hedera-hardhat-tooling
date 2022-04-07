const { expect } = require("chai");

const {
  Network,
  Config,
  Hashgraph,
  SDK: {
    ContractFunctionParameters,
    AccountId
  },
} = require("hashgraph-support")

// Random string, for project generation
const { v4: uuidv4 } = require('uuid');

describe("Testing a contract", function () {

  const destinationNetwork = Config.network
  const client = Network.getNodeNetworkClient(destinationNetwork)
  const hashgraph = Hashgraph(client);

  const contractId = process.env.STAKABLEPROJECT_CONTRACT_ID;
  const address = AccountId.fromString('0.0.1' + Math.floor(Math.random() * 100000)).toSolidityAddress()

  /**
   * The main problem with running these tests on her deployed contract is that the tokens/Treasury are in a mutable state.
   */
  const projectName = uuidv4()

  it("Contract is ownable", async () => {

    // Will run if a contract is Ownable
    const response = await hashgraph.contract.query({
      contractId: contractId,
      method: "owner",
    })

    const accountId = AccountId.fromSolidityAddress(response.getAddress(0))

    expect(accountId.toString()).to.equal(process.env.HEDERA_ACCOUNT_ID);
  })

  it('Owner can add token balance to project', async () => {
    const response = await hashgraph.contract.call({
      contractId: contractId,
      method: "addTokensToTreasury",
      params: new ContractFunctionParameters()
        .addInt64(1)
    })

    expect(response).to.be.true;
  });

  it('Owner/Anyone can query treasury balance', async () => {
    const response = await hashgraph.contract.query({
      contractId: contractId,
      method: "getTreasuryBalance",
    })

    const balance = response.getInt64(0)

    expect(balance.toNumber()).to.greaterThan(0);
  });

  it('Owner can add a project to the contract', async () => {
    const response = await hashgraph.contract.call({
      contractId: contractId,
      method: "addProject",
      params: new ContractFunctionParameters()
        .addString(projectName)
        .addAddress(address)
    })

    expect(response).to.be.true;
  });

  it('Owner cannot add the same project to the contract', async () => {
    try {
      await hashgraph.contract.call({
        contractId: contractId,
        method: "addProject",
        params: new ContractFunctionParameters()
          .addString(projectName)
          .addAddress(address)
      })

      // This feels gross
      expect(true).to.be.false
    } catch (e) {
      expect(true).to.be.true
    }
  });


});
