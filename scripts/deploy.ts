import { ethers } from "hardhat";
import fs from "fs";
import { contracts } from "../typechain-types";

const DEFAULT_NETWORK = "SEPOLIA"
const FORWARDER_ADDRESS = "0xEC68798EA1283a06178E1443cCe5088d3CB6e154"

async function main() {
  // await deployContract("MinimalForwarder");
  await deployContract("Governor", [FORWARDER_ADDRESS])
}

async function deployContract(contractName : string, ...args: any[]) {
  const contract = await ethers.deployContract(contractName, ...args);
  await contract.waitForDeployment();
  let verify = `npx hardhat verify --network ${DEFAULT_NETWORK} ${await contract.getAddress()}`

  if (args) {
    verify += ` --constructor-args scripts/arguments/${contractName}.js`
    console.log(args);
    
    fs.writeFileSync(
      `scripts/arguments/${contractName}.js`,
      "module.exports = " + JSON.stringify(args[0]) + ";"
    );
  }
  verify += ";\n";

  console.log(contractName + " : " + await contract.getAddress());
  console.log(verify)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
