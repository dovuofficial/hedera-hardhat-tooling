const { expect } = require("chai");

const {
  Network,
  Config,
  Hashgraph,
  SDK: {
    ContractFunctionParameters
  }
} = require("hashgraph-support")

describe("A contract can associate and be sent tokens", function () {

  const destinationNetwork = Config.network
  const client = Network.getNodeNetworkClient(destinationNetwork)
  const hashgraph = Hashgraph(client);

  const contractId = process.env.HTS_CONTRACT_ID;

  if (!contractId) {
    throw Error("HTS_CONTRACT_ID: NOT FOUND IN ENV, deploy with 'make deploy-test CONTRACT=\"ContractName\"' to generate in ENV")
  }

  it("A contract can get the token id", async () => {

    const response = await hashgraph.contract.query({
      contractId: contractId,
      method: "getTokenId",
    })

    expect(response.getAddress(0)).to.equal("0000000000000000000000000000000002087e5d");
  })

  it("A contract can associate a token", async () => {

    const response = await hashgraph.contract.call({
      contractId: contractId,
      method: "tokenAssociate",
    })

    expect(response).to.be.true;
  })


  it("A contract can be sent a token", async () => {

    const response = await hashgraph.contract.call({
      contractId: contractId,
      method: "tokenTransfer",
      params: new ContractFunctionParameters()
        .addInt64(2)
    })

    expect(response).to.be.true;
  })

  it("A user can check their balance in the contract", async () => {
    const response = await hashgraph.contract.query({
      contractId,
      method: "getTokensForAddress"
    })

    expect(response.getUint64(0).toNumber()).to.equal(2)
  })

  it("A contract can send back tokens", async () => {

    const response = await hashgraph.contract.call({
      contractId: contractId,
      method: "tokenSendBack",
    })

    expect(response).to.be.true;
  })

  it("After removal a user's balance is 0", async () => {
    const response = await hashgraph.contract.query({
      contractId,
      method: "getTokensForAddress"
    })

    expect(response.getUint64(0).toNumber()).to.equal(0)
  })

  it("A contract can dissociate a token", async () => {

    const response = await hashgraph.contract.call({
      contractId: contractId,
      method: "tokenDissociate",
    })

    expect(response).to.be.true;
  })
});
