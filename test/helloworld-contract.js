const { expect } = require("chai");

const {
  Network,
  Config,
  Hashgraph,
  SDK: { ContractFunctionParameters, AccountId },
} = require("hashgraph-support");

describe("Testing Helloworld Ownable contracts", function () {
  const destinationNetwork = Config.network;
  const client = Network.getNodeNetworkClient(destinationNetwork);
  const hashgraph = Hashgraph(client);

  const contractId = process.env.HELLOWORLD_CONTRACT_ID;

  if (!contractId) {
    throw Error(
      "HELLOWORLD_CONTRACT_ID: NOT FOUND IN ENV, deploy with 'make deploy-test CONTRACT=\"ContractName\"' to generate in ENV"
    );
  }

  it("A contract can get owner address", async () => {
    const response = await hashgraph.contract.query({
      contractId: contractId,
      method: "owner",
    });

    const accountId = AccountId.fromSolidityAddress(response.getAddress(0));

    expect(accountId.toString()).to.equal(process.env.HEDERA_ACCOUNT_ID);
  });
});
