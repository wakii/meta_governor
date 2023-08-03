import React from "react";
import { ethers } from "ethers";
import axios from 'axios';

import ForwarderABI from "../abi/MinimalForwarder.json"

const Vote = (apiEndpoint:any) => {

    const postData = async (apiEndpoint: string, request: any, signature:any) => {
        try {
            const response = axios.post(
                apiEndpoint,
                {
                  jsonrpc: '2.0',
                  method: 'eth_sendRawTransaction',
                  params: {
                    request: request,
                    signature: signature
                  },
                  id: 1,
                }
              )

            if (!response) {
                throw new Error('Network response was not ok');
            }

            const data = await response;
            return data;
        } catch (error) {
            console.error('Error posting data:', error);
        }
    
    }

    const buildTx = async (chainId: string, forwarderAddress: string, request: any) => {

        const forwardRequest = [
            { name: 'from', type: 'address' },
            { name: 'to', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'gas', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'data', type: 'bytes' },
        ]

        const domain = {
            name: process.env.REACT_APP_DOMAIN_NAME,
            version: process.env.REACT_APP_DOMAIN_VERSION,
            chainId: chainId,
            verifyingContract: forwarderAddress,
          }
  

        return {
            types : {
                forwardRequest
            },
            domain : domain,
            primaryType: "ForwardRequest",
            message: 
                request
        }
    }

    const buildRequest = (input: Object) => {
        return {
            value: 0,
            gas: 40000,
            ...input
        }
    }

    const signTx = async () => {

        const VOTE_ABI = [
            "function vote(uint256 pollId, uint256 amount, string[] calldata votedCandidates) external"
        ]
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        const account = await provider.getSigner();
        const {chainId} = await provider.getNetwork();
        
        const trustedForwarderAddress = process.env.REACT_APP_FORWARDER_ADDRESS as string;
        const trustedForwarderContract = new ethers.Contract(trustedForwarderAddress as string, ForwarderABI.abi, provider);
        const nonce = Number(await trustedForwarderContract.getNonce(account.address));
        let callData = new ethers.Interface(VOTE_ABI).encodeFunctionData("vote", [0, 100, ["1"]]);
        const input = {
            from: account.address,
            to: process.env.REACT_APP_SEPOLIA_GOVERNOR_ADDRESS,
            nonce: nonce,
            data: callData
        }

        const request = buildRequest(input);
        const tx = await buildTx(chainId.toString(), trustedForwarderAddress, request)

        const signature = await account.signTypedData(tx.domain, tx.types, tx.message);
        const expectedSignerAddress = await account.getAddress();
        const recoveredAddress = ethers.verifyTypedData(tx.domain, tx.types, tx.message, signature);
        console.log(recoveredAddress === expectedSignerAddress);

        await postData('http://localhost:30001' + apiEndpoint.apiEndpoint + "?account=" + account.address, tx, signature);
    }
    
    return (
        <div>
            <button
                onClick={signTx}
            >Sign In</button>
        </div>
    )
}

export default Vote;