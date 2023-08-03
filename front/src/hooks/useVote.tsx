import { useState, useEffect, useCallback } from "react";
import { BigNumberish, ethers } from "ethers";

import ForwarderABI from "../../../artifacts/contracts/MinimalForwarder.sol/MinimalForwarder.json"


export const useVote = async (provider: any) => {

    const VOTE_ABI=[
      "function vote(uint256 pollId, uint256 amount, string[] calldata votedCandidates) external"
    ]

    const account = provider.getSigner();
    // const provider = new ethers.JsonRpcProvider(process.env.REACT_APP_SEPOLIA_RPC_URL)
    const trustedForwarderAddress = process.env.REACT_APP_FORWARDER_ADDRESS
    // const relayerEOA = new ethers.Wallet(process.env.REACT_APP_HEX_ENCODED_PRIVATE_KEY || "", provider);
    const trustedForwarderContract = new ethers.Contract(trustedForwarderAddress || "", ForwarderABI.abi, account);
  
    const nonce = Number(await trustedForwarderContract.getNonce(account));
    console.log(nonce);
    let callData = new ethers.Interface(VOTE_ABI).encodeFunctionData("vote", [0, 100, ["1"]]);
    console.log(callData);


    const {chainId} = await provider.getNetwork();
    const estimateGas = '4000000';
    const primaryType = 'Message';

    const domain = {
      name: process.env.REACT_APP_DOMAIN_NAME,
      version: process.env.REACT_APP_DOMAIN_VERSION,
      chainId: ethers.hexlify(chainId),
      verifyingContract: trustedForwarderAddress,
    }
    const types = {
      Message: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'gas', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'data', type: 'bytes' },
          { name: 'validUntilTime', type: 'uint256' },
          { name: 'ABCDEFGHIJKLMNOPQRSTGSN', type: 'bytes32'},
      ]
    };

    const preForwardData = {
      from: process.env.REACT_APP_MY_WALLET_EVM_ADDRESS,
      to: process.env.REACT_APP_FUNDRAISER_CONTRACT_ADDRESS,
      value: String('0x0'),
    //   gas: ethers.hexlify(4000000),
      //   nonce: ethers.hexlify(nonce),
      gas: 40000,
      nonce: nonce,
      data: callData,
      validUntilTime: String('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
    }
    const forwardData = {
      domain: domain,
      types : types,
      primaryType : primaryType,
        ...preForwardData,
        ABCDEFGHIJKLMNOPQRSTGSN: Buffer.from(process.env.REACT_APP_TYPE_SUFFIX_DATA||'', 'utf8')
    }
    console.log(forwardData);
    // const metamaskProvider = new ethers.providers.Web3Provider(window.ethereum);
    // const signerWallet = metamaskProvider.getSigner();
    const signature = await account._signTypedData(domain, types, forwardData);
    console.log(123)
    const expectedSignerAddress = await account.getAddress();
    const recoveredAddress = ethers.verifyTypedData(domain, types, forwardData, signature);
    console.log(recoveredAddress === expectedSignerAddress);

    const forwardRequest = {
      domain,
      types,
      primaryType,
      forwardData
    };

    const relayTx = {
      forwardRequest: forwardRequest,
      metadata: {
        signature: signature.substring(2)
      }
    };

    const hexRawTx = '0x' + Buffer.from(JSON.stringify(relayTx)).toString('hex');
    console.log(hexRawTx)

    // const response = await axios.post('/api',
    // {"jsonrpc": "2.0", "method": "eth_sendRawTransaction", "params": [hexRawTx], "id": 1}, 
    // {
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Access-Control-Allow-Origin': '*'
    //   },
    // })
    // console.log(response.data.result)
  }