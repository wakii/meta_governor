import { ethers } from "hardhat";
import * as doetenv from "dotenv";
doetenv.config();

async function main() {
    const governor = await ethers.getContractAt("Governor", process.env.SEPOLIA_GOVERNOR_ADDRESS as string);
    const blockNumBefore = await ethers.provider.getBlockNumber();
    const timestampBefore = (await ethers.provider.getBlock(blockNumBefore) as ethers.Block).timestamp;
    // const timestampBefore = blockBefore.timestamp;

    // Poll Setting
    await governor.createPoll("hello", ["1","2"], timestampBefore + (Number(50)), timestampBefore + (Number(1000) - 1)) ;
    await governor.activate(0);

    // Poll Voting
    await governor.vote(0, 100, ["1"]);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });