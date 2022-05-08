const { expect } = require("chai");

const {
  Network,
  Config,
  Hashgraph,
  SDK: { ContractFunctionParameters, AccountId },
} = require("hashgraph-support");

describe("Testing a contract", function () {
  const destinationNetwork = Config.network;
  const client = Network.getNodeNetworkClient(destinationNetwork);
  const hashgraph = Hashgraph(client);

  const contractId = process.env.REPLACEME_CONTRACT_ID;

  if (!contractId) {
    throw Error(
      "REPLACEME_CONTRACT_ID: NOT FOUND IN ENV, deploy with 'make deploy-test CONTRACT=\"ContractName\"' to generate in ENV"
    );
  }

  it("A contract will run a test", async () => {
    // Will run if a contract is Ownable
    const response = await hashgraph.contract.query({
      contractId: contractId,
      method: "owner",
    });

    const accountId = AccountId.fromSolidityAddress(response.getAddress(0));

    expect(accountId.toString()).to.equal(process.env.HEDERA_ACCOUNT_ID);
  });

  // it("A contract can call a contract with params ", async () => {
  //
  //   const response = await hashgraph.contract.call({
  //     contractId: contractId,
  //     method: "a method",
  //     params: new ContractFunctionParameters()
  //       .addInt64(2)
  //   })
  //
  //   expect(response).to.be.true;
  // })
});
