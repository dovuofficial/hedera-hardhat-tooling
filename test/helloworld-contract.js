const { expect } = require("chai");

const {
  Network,
  Config,
  Hashgraph,
  SDK: {
    ContractFunctionParameters
  }
} = require("hashgraph-support")

describe("A contract can be deployed, and updated", function () {

  let hederaContractId;

  const destinationNetwork = Config.network
  const client = Network.getNodeNetworkClient(destinationNetwork)
  const hashgraph = Hashgraph(client);

  it("A HelloWorld contract is deployed", async function () {

    // Expecting testnet

    const contractInitialisation = {
      contractName: 'HelloWorld',
      // Optional, injected into the constructor, in this case for the "HelloWorld" Contract
      constructorParams: new ContractFunctionParameters()
        .addString("hello world")
    }

    const contractId = await hashgraph.contract.create(contractInitialisation)

    console.log('Contract id: ' + contractId.toString());

    expect(!!contractId.toString()).true;

    hederaContractId = contractId.toString()
  });

  it("A contract has a value", async () => {

    const response = await hashgraph.contract.query({
      contractId: hederaContractId,
      method: "getMessage"
    })

    expect(response).to.equal("hello world");
  })
});
