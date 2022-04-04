const { expect } = require("chai");

const {
  Network,
  Config,
  Hashgraph,
  SDK: {
    ContractFunctionParameters
  }
} = require("hashgraph-support")

describe("HTS contract can assoc tokens", function () {

  const destinationNetwork = Config.network
  const client = Network.getNodeNetworkClient(destinationNetwork)
  const hashgraph = Hashgraph(client);

  // Swap out for contract
  const contractId = '0.0.34117227';

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

  it("A contract can send back tokens", async () => {

    const response = await hashgraph.contract.call({
      contractId: contractId,
      method: "tokenSendBack",
    })

    expect(response).to.be.true;
  })

  it("A contract can dissociate a token", async () => {

    const response = await hashgraph.contract.call({
      contractId: contractId,
      method: "tokenDissociate",
    })

    expect(response).to.be.true;
  })
});
