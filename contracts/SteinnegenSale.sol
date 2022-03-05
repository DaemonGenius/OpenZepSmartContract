// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "openzeppelin-solidity/contracts/utils/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/security/Pausable.sol";
import "openzeppelin-solidity/contracts/access/Ownable.sol";
import "@DaemonGenius/ico/ico-steinnegen-coin/contracts/Steinnegen.sol";

contract SteinnegenSale is Pausable, Ownable {
    address payable private admin;
    Steinnegen public tokenContract;
    uint256 public tokenPrice;
    uint256 public tokensSold;

    uint256 public totalWeiRaised;
    uint256 public tokensMinted;
    uint256 public total_contributors;
    uint256 public decimalsMultiplier;
    uint256 public startTime;
    uint256 public endTime;
    uint256 public remainingTokens;
    uint256 public allocatedTokens;

    mapping(address => uint256) contributors;

    bool public finalized;

    bool public steinnegenTokensAllocated;

    address public steinnegenMultiSig =
        0x2190dA1687C94045FAD9b9AEeccb3c092dee8Bf9;

    address payable vaultAccount = payable(steinnegenMultiSig);

    uint256 public constant BASE_PRICE_IN_WEI = 88000000000000000;
    uint256 public constant PUBLIC_TOKENS = 1181031 * (10**18);
    uint256 public constant TOTAL_PRESALE_TOKENS = 112386712924725508802400;
    uint256 public constant TOKENS_ALLOCATED_TO_STEINNEGEN = 1181031 * (10**18);

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
    function totalSupply() public view returns (uint256) {
        return tokenContract.totalSupply();
    }

    /**
     * Returns token holder Contact Token balance
     * @param _owner {address} Token holder address
     * @return balance {uint256} Corresponding token holder balance
     */
    function balanceOf(address _owner) public view returns (uint256) {
        return tokenContract.balanceOf(_owner);
    }

    function buyTokens(address _contributor)
        public
        payable
        whenNotPaused
        whenNotFinalized
    {
        // require(msg.value == SafeMath.mul(_numberOfTokens, tokenPrice));
        // require(tokenContract.balanceOf(address(this)) >= _numberOfTokens);
        // require(tokenContract.transfer(msg.sender, _numberOfTokens));

        require(_contributor != address(0));
        require(_contributor != address(0x0));

        require(validPurchase());
        total_contributors = SafeMath.add(total_contributors, 1);
        contributors[_contributor] = msg.value;
        tokensSold += msg.value;

        emit Sell(msg.sender, msg.value);
        
        forwardFunds();
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

    /**
     * Validates the purchase (period, minimum amount, within cap)
     * @return {bool} valid
     */
    function validPurchase() internal view returns (bool) {
        uint256 current = block.timestamp;
        bool presaleStarted = (current >= startTime || started);
        bool presaleNotEnded = current <= endTime;
        bool nonZeroPurchase = msg.value != 0;
        return nonZeroPurchase && presaleStarted && presaleNotEnded;
    }

    function enableTransfers() public {
        if (block.timestamp < endTime) {
            require(msg.sender == owner());
        }
        tokenContract.enableTransfers(true);
    }

    function lockTransfers() public onlyOwner {
        require(block.timestamp < endTime);
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

    function allocateSteinnegenTokens() public onlyOwner whenNotFinalized {
        require(!steinnegenTokensAllocated);
        tokenContract.mint(steinnegenMultiSig, TOKENS_ALLOCATED_TO_STEINNEGEN);
        steinnegenTokensAllocated = true;
    }

    /**
     * Forwards funds to the tokensale wallet
     */
    function forwardFunds() internal {
        vaultAccount.transfer(msg.value);
    }

    function finalize() public onlyOwner {
        require(paused());
        require(steinnegenTokensAllocated);

        tokenContract.finishMinting();
        tokenContract.enableTransfers(true);
        emit Finalized();

        finalized = true;
    }
}
