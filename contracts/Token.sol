// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

contract TestToken is ERC20, ERC20Burnable, ERC20Permit {
    constructor() ERC20("TestToken", "MTK") ERC20Permit("TestToken") {}
}