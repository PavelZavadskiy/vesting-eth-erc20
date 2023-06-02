// SPDX-License-Identifier: MIT

// Author: Pavlo Zavadskiy
// Email: pavelzavadsky@gmail.com
// GitHub: https://github.com/PavelZavadskiy

pragma solidity 0.8.20;

import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

contract Vesting is AccessControl, Pausable {
  struct Plan {
    uint256 _startBlock;
    uint256 _finishBlock;
    address _token;
    uint256 _amountToken;
    uint256 _amountEth;
  }

  mapping(address => Plan[]) private usersPlans;

  event CreatePlan(
    address indexed from,
    address indexed to,
    uint256 start,
    uint256 finish,
    address token,
    uint256 amountToken,
    uint256 amountEth
  );

  event ClaimPayment(address indexed to, uint256 currentBlock, address token, uint256 amountToken, uint256 amountEth);

  constructor() {
    _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
  }

  function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
    _pause();
  }

  function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
    _unpause();
  }

  receive() external payable {}

  fallback() external payable {}

  function getBalance() public view returns (uint) {
    return address(this).balance;
  }

  function createPlan(
    address recipient,
    uint256 startBlock,
    uint256 finishBlock,
    address token,
    uint256 amountToken
  ) public payable whenNotPaused {
    require(recipient != address(0), 'createPlan: recipient with null address');
    require(startBlock < finishBlock, 'createPlan: start should be smaller than finish');
    require(!(amountToken == 0 && msg.value == 0), 'createPlan: no specified amounts');
    if (amountToken > 0) {
      require(token != address(0), 'createPlan: no token address');
      IERC20(token).transferFrom(msg.sender, address(this), amountToken);
    }
    usersPlans[recipient].push(Plan(startBlock, finishBlock, token, amountToken, msg.value));
    emit CreatePlan(msg.sender, recipient, startBlock, finishBlock, token, amountToken, msg.value);
  }

  function _currentPaymentToken(Plan storage plan, uint256 currentBlock) private view returns (uint256) {
    if (currentBlock <= plan._startBlock) return 0;
    if (currentBlock >= plan._finishBlock) return plan._amountToken;
    else return (plan._amountToken * (currentBlock - plan._startBlock)) / (plan._finishBlock - plan._startBlock);
  }

  function _currentPaymentEth(Plan storage userPlan, uint256 currentBlock) private view returns (uint256) {
    if (currentBlock <= userPlan._startBlock) return 0;
    if (currentBlock >= userPlan._finishBlock) return userPlan._amountEth;
    else
      return
        (userPlan._amountEth * (currentBlock - userPlan._startBlock)) / (userPlan._finishBlock - userPlan._startBlock);
  }

  function claimPayment(uint256 idx) public payable {
    address msgSender = msg.sender;
    require(idx < usersPlans[msgSender].length, 'claimPayment: there is no such index');

    Plan storage userPlan = usersPlans[msgSender][idx];

    require(!(userPlan._amountToken == 0 && userPlan._amountEth == 0), 'claimPayment: there is no payout amount');

    uint256 currentBlock = block.number;
    uint256 amountToken = _currentPaymentToken(userPlan, currentBlock);
    uint256 amountEth = _currentPaymentEth(userPlan, currentBlock);

    require(!(amountToken == 0 && amountEth == 0), 'claimPayment: currently no payouts');

    address token = userPlan._token;
    userPlan._amountToken -= amountToken;
    userPlan._amountEth -= amountEth;
    userPlan._startBlock = currentBlock;

    if (amountToken > 0) {
      IERC20(token).transfer(msgSender, amountToken);
    }
    if (amountEth > 0) {
      payable(msgSender).transfer(amountEth);
    }

    emit ClaimPayment(msgSender, currentBlock, token, amountToken, amountEth);
  }

  function getNumberPlans(address recipient) public view returns (uint256) {
    require(address(recipient) != address(0), 'getNumberPlans: recipient with null address');
    return usersPlans[recipient].length;
  }

  function getPlan(address recipient, uint256 idx) public view returns (Plan memory) {
    require(address(recipient) != address(0), 'getPlan: recipient with null address');
    require(idx < usersPlans[recipient].length, 'getPlan: there is no such index');

    return usersPlans[recipient][idx];
  }

  function getPaymentAmount(uint256 idx) public view returns (uint, uint) {
    if (idx >= usersPlans[msg.sender].length) return (0, 0);
    Plan storage userPlan = usersPlans[msg.sender][idx];
    uint256 currentBlock = block.number;
    uint256 amountToken = _currentPaymentToken(userPlan, currentBlock);
    uint256 amountEth = _currentPaymentEth(userPlan, currentBlock);
    return (amountToken, amountEth);
  }
}
