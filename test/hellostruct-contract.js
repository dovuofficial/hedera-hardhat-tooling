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

describe("Testing HelloStruct Contract", function () {

  const destinationNetwork = Config.network
  const client = Network.getNodeNetworkClient(destinationNetwork)
  const hashgraph = Hashgraph(client);

  const contractId = process.env.HELLOSTRUCT_CONTRACT_ID;

  if (!contractId) {
    throw Error("HELLOSTRUCT_CONTRACT_ID: NOT FOUND IN ENV, deploy with 'make deploy-test CONTRACT=\"ContractName\"' to generate in ENV")
  }

  it("A contract will run a test, ownable", async () => {

    const response = await hashgraph.contract.query({
      contractId: contractId,
      method: "owner",
    })

    const accountId = AccountId.fromSolidityAddress(response.getAddress(0))

    expect(accountId.toString()).to.equal(process.env.HEDERA_ACCOUNT_ID);
  })

  it("Will read the basic hello world string", async () => {

    const response = await hashgraph.contract.query({
      contractId: contractId,
      method: "getMessage",
    })

    expect(response.getString(0)).to.equal("hello world");
  })

  it("Contract can pass a struct value", async () => {

    const response = await hashgraph.contract.call({
      contractId: contractId,
      method: "update",
      params: new ContractFunctionParameters()
        .addString('Hello Again')
    })

    expect(response).to.be.true;
  })

  it("Will read the updated string", async () => {
    const response = await hashgraph.contract.query({
      contractId: contractId,
      method: "getMessage",
    })

    expect(response.getString(0)).to.equal("Hello Again");
  })

  it("Contract will revert contract state value", async () => {

    const response = await hashgraph.contract.call({
      contractId: contractId,
      method: "update",
      params: new ContractFunctionParameters()
        .addString('hello world')
    })

    expect(response).to.be.true;
  })
});
