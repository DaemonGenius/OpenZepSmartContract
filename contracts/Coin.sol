// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract Coin is ERC20 {

  constructor() ERC20("Steinnegen", "STEIN") {
        _mint(msg.sender, 100000000);
    }

    
}
