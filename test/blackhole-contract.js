const {
  TokenId,
  AccountAllowanceApproveTransaction,
  PrivateKey,
  Status,
  NftId,
} = require("@hashgraph/sdk");

const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-as-promised"));

const {
  Network,
  Config,
  Hashgraph,
  SDK: { ContractFunctionParameters },
} = require("hashgraph-support");

describe("Black Hole Contract", function () {
  const destinationNetwork = Config.network;
  const client = Network.getNodeNetworkClient(destinationNetwork);
  const hashgraph = Hashgraph(client);

  const contractId = process.env.BLACKHOLE_CONTRACT_ID;
  const tokenId = process.env.STAKABLE_TOKEN_ID;
  const ownerId = process.env.HEDERA_ACCOUNT_ID;
  const tokenToTransferId = process.env.BLACKHOLE_TOKEN_TO_TRANSFER_ID;
  const serialNumberToTransferId = process.env.BLACKHOLE_SERIAL_TO_TRANSFER_ID;
  const ownerAccountKey = process.env.HEDERA_PRIVATE_KEY;

  const spenderId = contractId;

  const tokenSolidityAddress = TokenId.fromString(tokenId).toSolidityAddress();
  const tokenToTransferSolidityAddress =
    TokenId.fromString(tokenToTransferId).toSolidityAddress();

  if (!contractId) {
    throw Error(
      "BLACKHOLE_CONTRACT_ID: NOT FOUND IN ENV, deploy with 'make deploy-test CONTRACT=\"ContractName\"' to generate in ENV"
    );
  }

  it("can get the gas token used to power the black hole", async () => {
    const response = await hashgraph.contract.query({
      contractId: contractId,
      method: "getBlackHoleGasAddress",
    });

    expect(response.getAddress(0)).to.equal(tokenSolidityAddress);
  });

  it("can't transfer a token until it is approved", async () => {
    async function castTokenIntoBlackHole() {
      console.log(
        `tokenToTransferSolidityAddress: ${tokenToTransferSolidityAddress}`
      );
      await hashgraph.contract.call({
        contractId: contractId,
        method: "castIntoBlackHole",
        params: new ContractFunctionParameters()
          .addAddress(tokenToTransferSolidityAddress)
          .addInt64(serialNumberToTransferId),
      });
    }

    await expect(castTokenIntoBlackHole()).to.eventually.be.rejectedWith(
      /^receipt for transaction\s.+?contained error status CONTRACT_REVERT_EXECUTED$/
    );
  });

  it("can transfer a token once approved", async () => {
    // Create the token allowance transaction.
    // This will let the contract spend the amount of token on our behalf.
    // The client operator must be the owner of the token.

    const nftID = new NftId(
      TokenId.fromString(tokenToTransferId),
      serialNumberToTransferId
    );

    const transaction = new AccountAllowanceApproveTransaction()
      .approveTokenNftAllowance(nftID, ownerId, spenderId)
      .freezeWith(client);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    expect(receipt.status).to.equal(Status.Success);

    const response = await hashgraph.contract.call({
      contractId: contractId,
      method: "castIntoBlackHole",
      params: new ContractFunctionParameters()
        .addAddress(tokenToTransferSolidityAddress)
        .addInt64(serialNumberToTransferId),
    });

    expect(response).to.be.true;
  });

  it("can check the black hole mass", async () => {
    const response = await hashgraph.contract.query({
      contractId,
      method: "getMassOfBlackHole",
    });

    expect(response.getUint64(0).toNumber()).to.be.greaterThan(0);
  });
});
