const Config = require("./config");
const Environment = require("./constants/environment");
const { Client, Hbar } = require("@hashgraph/sdk");

const { TESTNET, PREVIEWNET, MAINNET } = Environment;

// TODO: Are you just using the default network nodes, if nodes fail they'd need to be over written.
const networkForEnvironment = {
  [TESTNET]: {
    name: TESTNET,
    nodes: Client.forTestnet(),
  },
  [PREVIEWNET]: {
    name: PREVIEWNET,
    nodes: Client.forPreviewnet(),
  },
  [MAINNET]: {
    name: MAINNET,
    nodes: Client.forMainnet(),
  },
};

// Remove memory leak of creating a new network client
let hederaNetworkClient = null;

const getNodeNetworkClient = (networkEnv = TESTNET) => {
  const network = networkForEnvironment[networkEnv];

  if (!network || !network.nodes) {
    throw `Network from environment ${Config.network} could not match for any hedera network. Change your "HEDERA_NETWORK" environment variable to either: "testnet", "previewnet" or "mainnet"`;
  }

  if (Config.accountId == null || Config.privateKey == null) {
    throw new Error(
      "Environment variables 'HEDERA_ACCOUNT_ID' and 'HEDERA_PRIVATE_KEY' must be present"
    );
  }

  if (hederaNetworkClient === null) {
    hederaNetworkClient = new Client({
      network: network.nodes.network,
    })
      .setOperator(Config.accountId, Config.privateKey)
      .setMaxTransactionFee(new Hbar(10));
  }

  return hederaNetworkClient;
};

module.exports = {
  networkForEnvironment,
  getNodeNetworkClient,
};
