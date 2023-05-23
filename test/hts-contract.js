const {
  TokenId,
  AccountAllowanceApproveTransaction,
  PrivateKey,
  Status,
} = require("@hashgraph/sdk");
const { expect } = require("chai");

const {
  Network,
  Config,
  Hashgraph,
  SDK: { ContractFunctionParameters },
} = require("hashgraph-support");

describe("A contract can associate and be sent tokens", function () {
  const destinationNetwork = Config.network;
  const client = Network.getNodeNetworkClient(destinationNetwork);
  const hashgraph = Hashgraph(client);

  const contractId = process.env.HTS_CONTRACT_ID;
  const tokenId = process.env.STAKABLE_TOKEN_ID;
  const ownerId = process.env.HEDERA_ACCOUNT_ID;
  const ownerAccountKey = process.env.HEDERA_PRIVATE_KEY;

  const spenderId = contractId;

  const tokenSolidityAddress = TokenId.fromString(tokenId).toSolidityAddress();

  if (!contractId) {
    throw Error(
      "HTS_CONTRACT_ID: NOT FOUND IN ENV, deploy with 'make deploy-test CONTRACT=\"ContractName\"' to generate in ENV"
    );
  }

  it("A contract can get the token id", async () => {
    const response = await hashgraph.contract.query({
      contractId: contractId,
      method: "getTokenId",
    });

    expect(response.getAddress(0)).to.equal(tokenSolidityAddress);
  });

  it("A contract can associate a token", async () => {
    const response = await hashgraph.contract.call({
      contractId: contractId,
      method: "tokenAssociate",
    });

    expect(response).to.be.true;
  });

  it("A contract can transfer a token once associated", async () => {
    const amountToTransfer = 2;

    // Create the token allowance transaction.
    // This will let the contract spend the amount of token on our behalf.
    // The client operator must be the owner of the token.
    const transaction = new AccountAllowanceApproveTransaction()
      .approveTokenAllowance(tokenId, ownerId, spenderId, amountToTransfer)
      .freezeWith(client);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    expect(receipt.status).to.equal(Status.Success);

    const response = await hashgraph.contract.call({
      contractId: contractId,
      method: "tokenTransfer",
      params: new ContractFunctionParameters().addInt64(amountToTransfer),
    });

    expect(response).to.be.true;
  });

  it("A user can check their balance in the contract", async () => {
    const response = await hashgraph.contract.query({
      contractId,
      method: "getTokensForAddress",
    });

    expect(response.getUint64(0).toNumber()).to.equal(2);
  });

  it("A contract can send back tokens", async () => {
    const response = await hashgraph.contract.call({
      contractId: contractId,
      method: "tokenSendBack",
    });

    expect(response).to.be.true;
  });

  it("After removal a user's balance is 0", async () => {
    const response = await hashgraph.contract.query({
      contractId,
      method: "getTokensForAddress",
    });

    expect(response.getUint64(0).toNumber()).to.equal(0);
  });

  it("A contract can dissociate a token", async () => {
    const response = await hashgraph.contract.call({
      contractId: contractId,
      method: "tokenDissociate",
    });

    expect(response).to.be.true;
  });
});
