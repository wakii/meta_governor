import * as dotenv from "dotenv";
import express, {Express, Request, Response} from "express";
import { ethers } from "ethers";
import { readFileSync } from 'fs';
import bodyParser from "body-parser";

dotenv.config();

const provider = ethers.getDefaultProvider(process.env.SEPOLIA_RPC_URL || "");

const app: Express = express();

async function getInstance(name: string, address: string):Promise<ethers.Contract> {
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY || "", provider);
    const abiPath = `./artifacts/contracts/${name}.sol/${name}.json`
    const abi = JSON.parse(readFileSync(abiPath).toString())["abi"];

    return new ethers.Contract(address, abi, signer);
}

async function signTx(params: any) {    
    const forwarder = await getInstance("MinimalForwarder", process.env.SEPOLIA_FORWARDER_ADDRESS as string)
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY as string, provider);
    const {request, signature} = params;
    try {
        const valid = await forwarder.verify(request, signature);
        if (!valid) throw new Error(`Invalid request`);
        console.log(valid);
        return await forwarder.execute(request.message, signature);
    } catch(e) {
        console.error(e);
    }
}

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", 'POST, GET,OPTIONS, DELETE');
    next()
})
app.use(bodyParser.json())


app.post("/vote", async function (req,res) {
    const txReceipt = await signTx(req.body.params);
    return txReceipt;
})

app.listen(30001, () => {
    console.log('Server is running at http://localhost:30001');
});
