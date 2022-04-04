const {
  FileCreateTransaction,
  ContractCreateTransaction,
  ContractExecuteTransaction,
  ContractCallQuery,
  Hbar,
} = require("@hashgraph/sdk");

/**
 * Base values for constants
 */
const GAS_CONTRACT = 3000000;

const getCompiledContractJson = (contract) => {

  try {
    return require(`${process.cwd()}/artifacts/contracts/${contract}.sol/${contract}.json`);
  } catch (e) {
    throw "Unable to find compiled contract for '" + contract + "', has it been compiled with 'hardhat compile' or is the name correct?"
  }
}

const createContractFile = async (client, contractName) => {
  const compiled = getCompiledContractJson(contractName)
  const bytecode = compiled.bytecode;
  const fileCreateTx = new FileCreateTransaction().setContents(bytecode);
  const submitTx = await fileCreateTx.execute(client);
  const fileReceipt = await submitTx.getReceipt(client);

  return fileReceipt.fileId
}

const CreateSmartContract = async (client, {
  contractName,
  constructorParams,
  enableAdmin
}) => {
  const bytecodeFileId = await createContractFile(client, contractName)
  const contractTx = new ContractCreateTransaction()
    .setBytecodeFileId(bytecodeFileId)
    .setGas(GAS_CONTRACT)

  if (enableAdmin) {
    contractTx.setAdminKey(client.operatorPublicKey)
  }

  if (constructorParams) {
    contractTx.setConstructorParameters(constructorParams)
  }

  const contractResponse = await contractTx.execute(client);
  const contractReceipt = await contractResponse.getReceipt(client);

  return contractReceipt.contractId;
}

const QueryContract = async (client, {
  contractId,
  method
}) => {
  const contractCallResult = await new ContractCallQuery()
    .setContractId(contractId)
    .setGas(GAS_CONTRACT)
    .setQueryPayment(new Hbar(10))
    .setFunction(method)
    .execute(client)

  if (contractCallResult.errorMessage) {
      throw `error calling contract: ${contractCallResult.errorMessage}`
  }

  return contractCallResult
}

const CallContract = async (client, {
  contractId,
  method,
  params = null
}) => {

  const contractTransaction = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(GAS_CONTRACT)
    .setFunction(method, params)
    .freezeWith(client)

  const contractTransactionResponse = await contractTransaction.execute(client)

  const contractReceipt = await contractTransactionResponse.getReceipt(
    client
  );

  // Idk feels shit
  return contractReceipt.status.toString() === 'SUCCESS'
}

// Curry Hashgraph client function... nom nom nom
const Hashgraph = (client) => ({
  contract: {
    create: (initialisation) => CreateSmartContract(client, initialisation),
    call: (params) => CallContract(client, params),
    query: (params) => QueryContract(client, params)
  }
})

module.exports = Hashgraph
