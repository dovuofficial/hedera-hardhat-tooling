const {
  FileCreateTransaction,
  FileAppendTransaction,
  ContractCreateTransaction,
  ContractExecuteTransaction,
  ContractCallQuery,
  Hbar,
  PrivateKey,
} = require("@hashgraph/sdk");

const { Interface, LogDescription } = require("@ethersproject/abi");

const fs = require("fs");

/**
 * Base values for constants
 */
const GAS_CONTRACT = 1000000;

/**
 * EVM can only accept bytecode up to 24kb as bytes (48kb in hex) which is the same as ethereum. The default chunk size is 2048kb.
 * @type {number}
 */
const MAX_FILE_CHUNKS = 24;

const getCompiledContractJson = (contract) => {
  try {
    return require(`${process.cwd()}/artifacts/contracts/${contract}.sol/${contract}.json`);
  } catch (e) {
    throw (
      "Unable to find compiled contract for '" +
      contract +
      "', has it been compiled with 'hardhat compile' or is the name correct?"
    );
  }
};

/**
 * This method focuses on the creation and deployment of a contract to Hedera, to ensure that the file is ready.
 *
 * 1. At first we generate a keypair for create and append functions
 * 2. Next, we create the file then append it with our HEX bytecode, so that we may maximise the EVM limit
 * 3. After the appending of the bytecode we may use the file reference to create the smart contract.
 *
 * @param client
 * @param contractName
 * @returns {Promise<*>}
 */
const createContractFile = async (client, contractName) => {
  // Generate temporary keypair to create a file and append, beyond the 6KB limit
  const privateKey = PrivateKey.generateED25519();

  const fileCreateTx = new FileCreateTransaction()
    .setKeys([privateKey.publicKey])
    .freezeWith(client);

  const signCreateTx = await fileCreateTx.sign(privateKey);
  const submitTx = await signCreateTx.execute(client);
  const fileReceipt = await submitTx.getReceipt(client);
  const fileId = fileReceipt.fileId;

  // Get bytecode for contract
  const compiled = getCompiledContractJson(contractName);
  const bytecode = compiled.bytecode;

  // Append the bytecode to n files, max **MAX_FILE_CHUNKS** EVM 48k limit
  const appendTx = new FileAppendTransaction()
    .setFileId(fileId)
    .setContents(bytecode)
    .setMaxChunks(MAX_FILE_CHUNKS)
    .freezeWith(client);

  const signTx = await appendTx.sign(privateKey);
  const txResponse = await signTx.execute(client);

  // Don't know if I need this here, I suspect that this may cause some issues without it, When creating contracts.
  await txResponse.getReceipt(client);

  return fileId;
};

const CreateSmartContract = async (
  client,
  { contractName, constructorParams, enableAdmin }
) => {
  const bytecodeFileId = await createContractFile(client, contractName);
  const contractTx = new ContractCreateTransaction()
    .setBytecodeFileId(bytecodeFileId)
    .setGas(GAS_CONTRACT);

  if (enableAdmin) {
    contractTx.setAdminKey(client.operatorPublicKey);
  }

  if (constructorParams) {
    contractTx.setConstructorParameters(constructorParams);
  }

  const contractResponse = await contractTx.execute(client);
  const contractReceipt = await contractResponse.getReceipt(client);

  return contractReceipt.contractId;
};

const QueryContract = async (
  client,
  { contractId, method, gas = GAS_CONTRACT, params }
) => {
  const contractCallResult = await new ContractCallQuery()
    .setContractId(contractId)
    .setGas(gas)
    .setQueryPayment(new Hbar(10))
    .setFunction(method, params)
    .execute(client);

  if (contractCallResult.errorMessage) {
    throw `error calling contract: ${contractCallResult.errorMessage}`;
  }

  return contractCallResult;
};

const CallContract = async (
  client,
  { contractId, method, gas = GAS_CONTRACT, params = null }
) => {
  const contractTransaction = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(gas)
    .setFunction(method, params)
    .freezeWith(client);

  const contractTransactionResponse = await contractTransaction.execute(client);

  const contractReceipt = await contractTransactionResponse.getReceipt(client);

  return contractReceipt.status.toString() === "SUCCESS";
};

/**
 *  This method focuses on triggering an event and returning the corresponding logs.
 *  This method is seperate from CallContract() for now, as not all methods have associated events.
 *
 *  1. Execute the function, provided as method param.
 *  2. Read logs returned with txn record.
 *  3. Process data & topics.
 *  4. Returns parsed data.
 *
 *  @param {client} client Hedera SDK client
 *  @param {string} contractId Hedera Smart Contract ID
 *  @param {string} contract Contract Name, i.e. StakableProjects
 *  @param {ContractFunctionParameters} params Hedera Function Parameters
 *
 *  @returns {LogDescription[]}
 */

const SubscribeToEmittedEvents = async (
  client,
  { contractId, method, contract, params = null }
) => {
  // Will look into refactoring this func. to work with call ~
  // Can check against abi to see if there is event associated with func.

  const parsedJson = getCompiledContractJson(contract);
  const abiInterface = new Interface(parsedJson.abi);

  const contractTransaction = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(GAS_CONTRACT)
    .setFunction(method, params)
    .freezeWith(client);

  const contractTransactionResponse = await contractTransaction.execute(client);
  const record = await contractTransactionResponse.getRecord(client);

  // look through logs returned with getRecord.
  const events = record.contractFunctionResult.logs.map((log) => {
    // lets make it a little more readable.
    const logStrHex = "0x".concat(Buffer.from(log.data).toString("hex"));
    const logTopics = log.topics.map((topic) => {
      return "0x".concat(Buffer.from(topic).toString("hex"));
    });
    return abiInterface.parseLog({ data: logStrHex, topics: logTopics });
  });
  // to read this: events[i].args.$param
  return events;
};

// Curry Hashgraph client function... nom nom nom
const Hashgraph = (client) => ({
  contract: {
    create: (initialisation) => CreateSmartContract(client, initialisation),
    call: (params) => CallContract(client, params),
    query: (params) => QueryContract(client, params),
    sub: (params) => SubscribeToEmittedEvents(client, params),
  },
});

module.exports = Hashgraph;
