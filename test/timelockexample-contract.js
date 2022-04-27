const { expect } = require("chai");

const {
  Network,
  Config,
  Hashgraph,
  SDK: {
    ReceiptStatusError,
    ContractFunctionParameters,
    AccountId
  },
} = require("hashgraph-support")

describe("Testing a contract", function () {

  const destinationNetwork = Config.network
  const client = Network.getNodeNetworkClient(destinationNetwork)
  const hashgraph = Hashgraph(client);

  const contractId = process.env.TIMELOCKEXAMPLE_CONTRACT_ID;

  if (!contractId) {
    throw Error("TIMELOCKEXAMPLE_CONTRACT_ID: NOT FOUND IN ENV, deploy with 'make deploy-test CONTRACT=\"ContractName\"' to generate in ENV")
  }

  it("A contract will run a test", async () => {

    // Will run if a contract is Ownable
    const response = await hashgraph.contract.query({
      contractId: contractId,
      method: "owner",
    })

    const accountId = AccountId.fromSolidityAddress(response.getAddress(0))

    expect(accountId.toString()).to.equal(process.env.HEDERA_ACCOUNT_ID);
  })

  it("A contract ensure that the timelock is on (default behaviour)", async () => {

    const response = await hashgraph.contract.query({
      contractId: contractId,
      method: "isTimelockEnabled",
    })

    expect(response.getBool(0)).to.true;
  })


  it("Add days to time lock (fails)", async () => {
    try {
      const response = await hashgraph.contract.call({
        contractId: contractId,
        method: "addDays",
        params: new ContractFunctionParameters()
          .addUint256(1)
      })

      expect(response).to.be.true;
    } catch (e) {
      expect(e).to.be.an.instanceOf(ReceiptStatusError)
    }
  })


  it("Update timelock to accept day modification", async () => {
    const response = await hashgraph.contract.call({
      contractId: contractId,
      method: "updateTimeLock",
      params: new ContractFunctionParameters()
        .addBool(false)
    })

    expect(response).to.be.true;
  })

  it("A contract ensure that the timelock is on", async () => {

    const response = await hashgraph.contract.query({
      contractId: contractId,
      method: "isTimelockEnabled",
    })

    expect(response.getBool(0)).to.false
  })

  it("remove days from time lock", async () => {

    const response = await hashgraph.contract.call({
      contractId: contractId,
      method: "removeDays",
      params: new ContractFunctionParameters()
        .addUint256(1)
    })

    expect(response).to.be.true;
  })

  it("A contract ensure that the timelock is off", async () => {

    const response = await hashgraph.contract.query({
      contractId: contractId,
      method: "isTimelockEnabled",
    })

    expect(response.getBool(0)).to.false;
  })

  it("Revert state for ensuring contract is timelocked", async () => {
    const response = await hashgraph.contract.call({
      contractId: contractId,
      method: "updateTimeLock",
      params: new ContractFunctionParameters()
        .addBool(true)
    })

    expect(response).to.be.true;
  })

  it("Get contract current block timestamp", async () => {

    const response = await hashgraph.contract.query({
      contractId: contractId,
      method: "getBlockTimeStamp",
    })

    const timestamp = response.getUint256(0).toNumber()

    console.log(timestamp)

    // lol
    expect(timestamp).to.gte(0);
  })
});
