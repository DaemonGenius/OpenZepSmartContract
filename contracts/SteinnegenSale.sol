// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "openzeppelin-solidity/contracts/utils/math/SafeMath.sol";
import "@DaemonGenius/ico/ico-steinnegen-coin/contracts/Steinnegen.sol";

contract SteinnegenSale {
    address payable private admin;
    Steinnegen public tokenContract;
    uint256 public tokenPrice;
    uint256 public tokensSold;

    event Sell(address _buyer, uint256 _amount);

    constructor(Steinnegen _tokenContract, uint256 _tokenPrice) {
        admin = payable(msg.sender);
        tokenContract = _tokenContract;
        tokenPrice = _tokenPrice;
    }

    function buyTokens(uint256 _numberOfTokens) public payable {

        require(msg.value == SafeMath.mul(_numberOfTokens, tokenPrice));
        
        require(tokenContract.balanceOf(address(this)) >= _numberOfTokens);

        require(tokenContract.transfer(msg.sender, _numberOfTokens));
        
        tokensSold += _numberOfTokens;
        emit Sell(msg.sender, _numberOfTokens);
    }

    function endSale() public {
        require(msg.sender == admin);

        require(tokenContract.transfer(admin, tokenContract.balanceOf(address(this))));

        admin.transfer(address(this).balance);

    }
}
