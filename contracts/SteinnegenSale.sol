// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "openzeppelin-solidity/contracts/utils/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "openzeppelin-solidity/contracts/access/Ownable.sol";
import "@DaemonGenius/ico/ico-steinnegen-coin/contracts/Steinnegen.sol";

contract SteinnegenSale is ERC20Pausable, Ownable {
    address payable private admin;
    Steinnegen public tokenContract;
    uint256 public tokenPrice;
    uint256 public tokensSold;

    uint256 public totalWeiRaised;
    uint256 public tokensMinted;
    uint256 public contributors;
    uint256 public decimalsMultiplier;
    uint256 public startTime;
    uint256 public endTime;
    uint256 public remainingTokens;
    uint256 public allocatedTokens;

    bool public finalized;

    bool public proofTokensAllocated;
    address public proofMultiSig = 0x99892Ac6DA1b3851167Cb959fE945926bca89f09;

    uint256 public constant BASE_PRICE_IN_WEI = 88000000000000000;
    uint256 public constant PUBLIC_TOKENS = 1181031 * (10**18);
    uint256 public constant TOTAL_PRESALE_TOKENS = 112386712924725508802400;
    uint256 public constant TOKENS_ALLOCATED_TO_PROOF = 1181031 * (10**18);

    uint256 public tokenCap = PUBLIC_TOKENS - TOTAL_PRESALE_TOKENS;
    uint256 public cap = tokenCap / (10**18);
    uint256 public weiCap = cap * BASE_PRICE_IN_WEI;

    uint256 public firstDiscountPrice = (BASE_PRICE_IN_WEI * 85) / 100;
    uint256 public secondDiscountPrice = (BASE_PRICE_IN_WEI * 90) / 100;
    uint256 public thirdDiscountPrice = (BASE_PRICE_IN_WEI * 95) / 100;

    uint256 public firstDiscountCap = (weiCap * 5) / 100;
    uint256 public secondDiscountCap = (weiCap * 10) / 100;
    uint256 public thirdDiscountCap = (weiCap * 20) / 100;

    bool public started = false;

    event Sell(address _buyer, uint256 _amount);
    // event TokenPurchase(
    //     address indexed purchaser,
    //     address indexed beneficiary,
    //     uint256 value,
    //     uint256 amount
    // );
    event OnTransfer(address _from, address _to, uint256 _amount);
    event OnApprove(address _owner, address _spender, uint256 _amount);
    event Finalized();

    constructor(
        Steinnegen _tokenContract,
        uint256 _tokenPrice,
        uint256 _startTime,
        uint256 _endTime
    ) {
        require(_startTime > 0);
        require(_endTime > _startTime);

        startTime = _startTime;
        endTime = _endTime;

        admin = payable(msg.sender);
        tokenContract = _tokenContract;
        tokenPrice = _tokenPrice;
    }

    modifier whenNotFinalized() {
        require(!finalized);
        _;
    }

    /**
     * Returns the total Contact token supply
     * @return totalSupply {uint256} Contact Token Total Supply
     */
    function totalSupply() public override view returns (uint256) {
        return tokenContract.totalSupply();
    }

    /**
     * Returns token holder Contact Token balance
     * @param _owner {address} Token holder address
     * @return balance {uint256} Corresponding token holder balance
     */
    function balanceOf(address _owner) public override view returns (uint256) {
        return tokenContract.balanceOf(_owner);
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

        require(
            tokenContract.transfer(
                admin,
                tokenContract.balanceOf(address(this))
            )
        );

        admin.transfer(address(this).balance);
    }

    function enableTransfers() public {
        if (block.timestamp < endTime) {
            require(msg.sender == owner);
        }
        tokenContract.enableTransfers(true);
    }

    function lockTransfers() public onlyOwner {
        require(now < endTime);
        tokenContract.enableTransfers(false);
    }

    function enableMasterTransfers() public onlyOwner {
        tokenContract.enableMasterTransfers(true);
    }

    function lockMasterTransfers() public onlyOwner {
        tokenContract.enableMasterTransfers(false);
    }

    function forceStart() public onlyOwner {
        started = true;
    }

    function allocateProofTokens() public onlyOwner whenNotFinalized {
        require(!proofTokensAllocated);
        tokenContract.mint(proofMultiSig, TOKENS_ALLOCATED_TO_PROOF);
        proofTokensAllocated = true;
    }

    function finalize() public onlyOwner {
        require(paused);
        require(proofTokensAllocated);

        tokenContract.finishMinting();
        tokenContract.enableTransfers(true);
        Finalized();

        finalized = true;
    }
}
