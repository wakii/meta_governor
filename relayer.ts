import * as dotenv from "dotenv";
import express, {Express, Request, Response} from "express";
import { ethers } from "ethers";
import { readFileSync } from 'fs';

dotenv.config();

const provider = ethers.getDefaultProvider(process.env.GOERLI_RPC_URL || "");

const app: Express = express();

async function getInstance(name: string, address: string):Promise<ethers.Contract> {
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY || "", provider);
    const abiPath = `./artifacts/contracts/${name}.sol/${name}.json`
    const abi = JSON.parse(readFileSync(abiPath).toString())["abi"];

    return new ethers.Contract(address, abi, signer);
}

async function signTx(account: string, functionName: string) {
    const governor = await getInstance("Governor", process.env.GOVERNOR_ADDRESS || "");
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY || "", provider);
    const data = governor.interface.encodeFunctionData(functionName, [
        account,
    ])

    return signer;
}

app.get("/vote", async function (req, res) {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");

    const signedTx = await signTx(req.query.account as string, "vote");
    res.send(signedTx);
})

app.listen(30001, () => {
    console.log('Server is running at http://localhost:30001');
});
