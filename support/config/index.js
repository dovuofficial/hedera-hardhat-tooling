"use strict";

const {
  HEDERA_NETWORK = "testnet",
  HEDERA_ACCOUNT_ID,
  HEDERA_PRIVATE_KEY,
} = process.env;

module.exports = {
  network: HEDERA_NETWORK.toLowerCase(),
  accountId: HEDERA_ACCOUNT_ID,
  privateKey: HEDERA_PRIVATE_KEY,
};
