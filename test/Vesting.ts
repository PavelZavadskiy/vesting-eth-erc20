const truffleAssert = require('truffle-assertions');
import { assert, web3, artifacts } from 'hardhat';
import { time, constants } from '@openzeppelin/test-helpers';
import { BN } from 'bn.js';

const Vesting = artifacts.require('Vesting');
const Token = artifacts.require('MockToken');

const bn1e18 = web3.utils.toBN(1e18);
const bn1e17 = web3.utils.toBN(1e17);
const bn0 = web3.utils.toBN(0);

describe('Exchange', () => {
  let accounts: string[];
  let owner: any;
  let account1: any;
  let recipient: any;
  let contract: any;
  let token: any;

  // Create plan from account1 with tacken and eth
  let createPlan_1 = async (
    from: any,
    to: any,
    start: any,
    finish: any,
    tokenAddr: any,
    amountToken: any,
    amountEth: any
  ) => {
    await token.approve(contract.address, bn1e18, { from: from });
    let result = await contract.createPlan(to, start, finish, tokenAddr, amountToken, { from: from, value: amountEth });
    truffleAssert.eventEmitted(result, 'CreatePlan', (ev: any) => {
      assert.equal(ev.from, from);
      assert.equal(ev.to, to);
      assert.equal(true, ev.start.eq(start));
      assert.equal(true, ev.finish.eq(finish));
      assert.equal(ev.token, tokenAddr);
      assert.equal(true, ev.amountToken.eq(amountToken));
      assert.equal(true, ev.amountEth.eq(amountEth));
      return true;
    });
  };

  beforeEach(async function () {
    accounts = await web3.eth.getAccounts();
    owner = accounts[0];
    account1 = accounts[1];
    recipient = accounts[2];
    contract = await Vesting.new();
    token = await Token.new();
    await token.mint(account1, bn1e18.mul(new BN(10)));
  });

  describe('getBalance', function () {
    it('Should return balance 0', async () => {
      const result = await contract.getBalance();
      assert.equal(true, result.eq(bn0));
    });

    it('Should return balance', async () => {
      await web3.eth.sendTransaction({
        from: account1,
        to: contract.address,
        value: bn1e17,
      });

      const result = await contract.getBalance();
      assert.equal(true, result.eq(bn1e17));
    });
  });

  describe('createPlan', function () {
    it('Should create plan with token', async () => {
      const currentBlock = await time.latestBlock();
      const finishBlock = currentBlock.add(web3.utils.toBN(10));
      await token.approve(contract.address, bn1e18, { from: account1 });
      const balanceAccount1 = new BN(await web3.eth.getBalance(account1));
      const balanceAccount1Token = await token.balanceOf(account1);
      const result = await contract.createPlan(recipient, currentBlock, finishBlock, token.address, bn1e18, {
        from: account1,
      });
      truffleAssert.eventEmitted(result, 'CreatePlan', (ev: any) => {
        assert.equal(ev.from, account1);
        assert.equal(ev.to, recipient);
        assert.equal(true, ev.start.eq(currentBlock));
        assert.equal(true, ev.finish.eq(finishBlock));
        assert.equal(ev.token, token.address);
        assert.equal(true, ev.amountToken.eq(bn1e18));
        assert.equal(true, ev.amountEth.eq(bn0));
        return true;
      });
      const transaction = await web3.eth.getTransaction(result.tx);
      const used_gas = web3.utils.toBN(result.receipt.gasUsed);
      const gas_price = web3.utils.toBN(transaction.gasPrice);
      assert.equal(true, new BN(await web3.eth.getBalance(account1)).eq(balanceAccount1.sub(used_gas.mul(gas_price))));
      assert.equal(true, (await token.balanceOf(account1)).eq(balanceAccount1Token.sub(bn1e18)));
      assert.equal(true, (await contract.getBalance()).eq(bn0));
      assert.equal(true, (await token.balanceOf(contract.address)).eq(bn1e18));
    });

    it('Should create plan with eth', async () => {
      const currentBlock = await time.latestBlock();
      const finishBlock = currentBlock.add(web3.utils.toBN(10));
      const balanceAccount1 = new BN(await web3.eth.getBalance(account1));
      const result = await contract.createPlan(recipient, currentBlock, finishBlock, constants.ZERO_ADDRESS, bn0, {
        from: account1,
        value: bn1e17,
      });
      truffleAssert.eventEmitted(result, 'CreatePlan', (ev: any) => {
        assert.equal(ev.from, account1);
        assert.equal(ev.to, recipient);
        assert.equal(true, ev.start.eq(currentBlock));
        assert.equal(true, ev.finish.eq(finishBlock));
        assert.equal(ev.token, constants.ZERO_ADDRESS);
        assert.equal(true, ev.amountToken.eq(bn0));
        assert.equal(true, ev.amountEth.eq(bn1e17));
        return true;
      });
      const transaction = await web3.eth.getTransaction(result.tx);
      const used_gas = web3.utils.toBN(result.receipt.gasUsed);
      const gas_price = web3.utils.toBN(transaction.gasPrice);
      assert.equal(
        true,
        new BN(await web3.eth.getBalance(account1)).eq(balanceAccount1.sub(bn1e17).sub(used_gas.mul(gas_price)))
      );
      assert.equal(true, (await contract.getBalance()).eq(bn1e17));
      assert.equal(true, (await token.balanceOf(contract.address)).eq(bn0));
    });

    it('Should create plan with eth and token', async () => {
      const currentBlock = await time.latestBlock();
      const finishBlock = currentBlock.add(web3.utils.toBN(10));
      await token.approve(contract.address, bn1e18, { from: account1 });
      const balanceAccount1 = new BN(await web3.eth.getBalance(account1));
      const balanceAccount1Token = await token.balanceOf(account1);
      const result = await contract.createPlan(recipient, currentBlock, finishBlock, token.address, bn1e18, {
        from: account1,
        value: bn1e17,
      });
      truffleAssert.eventEmitted(result, 'CreatePlan', (ev: any) => {
        assert.equal(ev.from, account1);
        assert.equal(ev.to, recipient);
        assert.equal(true, ev.start.eq(currentBlock));
        assert.equal(true, ev.finish.eq(finishBlock));
        assert.equal(ev.token, token.address);
        assert.equal(true, ev.amountToken.eq(bn1e18));
        assert.equal(true, ev.amountEth.eq(bn1e17));
        return true;
      });
      const transaction = await web3.eth.getTransaction(result.tx);
      const used_gas = web3.utils.toBN(result.receipt.gasUsed);
      const gas_price = web3.utils.toBN(transaction.gasPrice);
      assert.equal(
        true,
        new BN(await web3.eth.getBalance(account1)).eq(balanceAccount1.sub(bn1e17).sub(used_gas.mul(gas_price)))
      );
      assert.equal(true, (await token.balanceOf(account1)).eq(balanceAccount1Token.sub(bn1e18)));
      assert.equal(true, (await contract.getBalance()).eq(bn1e17));
      assert.equal(true, (await token.balanceOf(contract.address)).eq(bn1e18));
    });

    it('Should not create plan. Recipient with null address', async () => {
      const currentBlock = await time.latestBlock();
      const finishBlock = currentBlock.add(web3.utils.toBN(10));
      await truffleAssert.reverts(
        contract.createPlan(constants.ZERO_ADDRESS, currentBlock, finishBlock, token.address, bn1e18, {
          from: account1,
          value: bn1e17,
        }),
        'createPlan: recipient with null addres'
      );
    });

    it('Should not create plan. Start should be smaller than finish', async () => {
      const currentBlock = await time.latestBlock();
      const finishBlock = currentBlock.add(web3.utils.toBN(10));
      await truffleAssert.reverts(
        contract.createPlan(recipient, finishBlock, currentBlock, token.address, bn1e18, {
          from: account1,
          value: bn1e17,
        }),
        'createPlan: start should be smaller than finish'
      );
    });

    it('Should not create plan. No specified amounts', async () => {
      const currentBlock = await time.latestBlock();
      const finishBlock = currentBlock.add(web3.utils.toBN(10));
      await truffleAssert.reverts(
        contract.createPlan(recipient, currentBlock, finishBlock, token.address, bn0, { from: account1, value: bn0 }),
        'createPlan: no specified amounts'
      );
    });

    it('Should not create plan. No token address', async () => {
      const currentBlock = await time.latestBlock();
      const finishBlock = currentBlock.add(web3.utils.toBN(10));
      await truffleAssert.reverts(
        contract.createPlan(recipient, currentBlock, finishBlock, constants.ZERO_ADDRESS, bn1e18, {
          from: account1,
          value: bn1e17,
        }),
        'createPlan: no token address'
      );
    });
  });

  describe('claimPayment', function () {
    it('Should claim full payment with token', async () => {
      const currentBlock = await time.latestBlock();
      const finishBlock = currentBlock.add(web3.utils.toBN(10));
      await createPlan_1(account1, recipient, currentBlock, finishBlock, token.address, bn1e18, bn0);

      assert.equal(true, (await token.balanceOf(contract.address)).eq(bn1e18));
      const balanceRecipient = await token.balanceOf(recipient);
      await time.advanceBlockTo(finishBlock);
      let result = await contract.claimPayment(bn0, { from: recipient });
      assert.equal(true, (await token.balanceOf(contract.address)).eq(bn0));
      truffleAssert.eventEmitted(result, 'ClaimPayment', (ev: any) => {
        assert.equal(ev.to, recipient);
        assert.equal(true, ev.currentBlock.eq(finishBlock.add(new BN(1))));
        assert.equal(ev.token, token.address);
        assert.equal(true, ev.amountToken.eq(bn1e18));
        assert.equal(true, ev.amountEth.eq(bn0));
        return true;
      });
      assert.equal(true, (await token.balanceOf(recipient)).eq(balanceRecipient.add(bn1e18)));
    });

    it('Should claim full payment with eth', async () => {
      const currentBlock = await time.latestBlock();
      const finishBlock = currentBlock.add(web3.utils.toBN(10));
      await createPlan_1(account1, recipient, currentBlock, finishBlock, constants.ZERO_ADDRESS, bn0, bn1e17);
      assert.equal(true, (await contract.getBalance()).eq(bn1e17));
      await time.advanceBlockTo(finishBlock);
      let balanceRecipient = new BN(await web3.eth.getBalance(recipient));
      let result = await contract.claimPayment(bn0, { from: recipient });
      truffleAssert.eventEmitted(result, 'ClaimPayment', (ev: any) => {
        assert.equal(ev.to, recipient);
        assert.equal(true, ev.currentBlock.eq(finishBlock.add(new BN(1))));
        assert.equal(ev.token, constants.ZERO_ADDRESS);
        assert.equal(true, ev.amountToken.eq(bn0));
        assert.equal(true, ev.amountEth.eq(bn1e17));
        return true;
      });
      const transaction = await web3.eth.getTransaction(result.tx);
      const used_gas = web3.utils.toBN(result.receipt.gasUsed);
      const gas_price = web3.utils.toBN(transaction.gasPrice);
      assert.equal(true, (await contract.getBalance()).eq(bn0));
      assert.equal(
        true,
        new BN(await web3.eth.getBalance(recipient)).eq(balanceRecipient.add(bn1e17).sub(used_gas.mul(gas_price)))
      );
    });

    it('Should claim full payment with eth and token', async () => {
      const currentBlock = await time.latestBlock();
      const finishBlock = currentBlock.add(web3.utils.toBN(10));
      await createPlan_1(account1, recipient, currentBlock, finishBlock, token.address, bn1e18, bn1e17);
      assert.equal(true, (await contract.getBalance()).eq(bn1e17));
      assert.equal(true, (await token.balanceOf(contract.address)).eq(bn1e18));
      await time.advanceBlockTo(finishBlock);
      const balanceRecipientEth = new BN(await web3.eth.getBalance(recipient));
      const balanceRecipientToken = await token.balanceOf(recipient);
      let result = await contract.claimPayment(bn0, { from: recipient });
      truffleAssert.eventEmitted(result, 'ClaimPayment', (ev: any) => {
        assert.equal(ev.to, recipient);
        assert.equal(true, ev.currentBlock.eq(finishBlock.add(new BN(1))));
        assert.equal(ev.token, token.address);
        assert.equal(true, ev.amountToken.eq(bn1e18));
        assert.equal(true, ev.amountEth.eq(bn1e17));
        return true;
      });
      const transaction = await web3.eth.getTransaction(result.tx);
      const used_gas = web3.utils.toBN(result.receipt.gasUsed);
      const gas_price = web3.utils.toBN(transaction.gasPrice);
      assert.equal(true, (await contract.getBalance()).eq(bn0));
      assert.equal(
        true,
        new BN(await web3.eth.getBalance(recipient)).eq(balanceRecipientEth.add(bn1e17).sub(used_gas.mul(gas_price)))
      );
      assert.equal(true, (await token.balanceOf(recipient)).eq(balanceRecipientToken.add(bn1e18)));
    });

    // ------------------------------------------------------------------------------------------

    it('Should claim partial payment with token', async () => {
      const currentBlock = await time.latestBlock();
      const finishBlock = currentBlock.add(web3.utils.toBN(10));
      const partialBlock = currentBlock.add(web3.utils.toBN(5));
      const amountPartial = bn1e18
        .mul(partialBlock.add(new BN(1)).sub(currentBlock))
        .div(finishBlock.sub(currentBlock));
      await createPlan_1(account1, recipient, currentBlock, finishBlock, token.address, bn1e18, bn0);
      assert.equal(true, (await token.balanceOf(contract.address)).eq(bn1e18));
      const balanceRecipient = await token.balanceOf(recipient);
      await time.advanceBlockTo(partialBlock);
      let result = await contract.claimPayment(bn0, { from: recipient });
      assert.equal(true, (await token.balanceOf(contract.address)).eq(bn1e18.sub(amountPartial)));
      truffleAssert.eventEmitted(result, 'ClaimPayment', (ev: any) => {
        assert.equal(ev.to, recipient);
        assert.equal(true, ev.currentBlock.eq(partialBlock.add(new BN(1))));
        assert.equal(ev.token, token.address);
        assert.equal(true, ev.amountToken.eq(amountPartial));
        assert.equal(true, ev.amountEth.eq(bn0));
        return true;
      });
      assert.equal(true, (await token.balanceOf(recipient)).eq(balanceRecipient.add(amountPartial)));
    });

    it('Should claim partial payment with eth', async () => {
      const currentBlock = await time.latestBlock();
      const finishBlock = currentBlock.add(web3.utils.toBN(10));
      const partialBlock = currentBlock.add(web3.utils.toBN(5));
      const amountPartial = bn1e17
        .mul(partialBlock.add(new BN(1)).sub(currentBlock))
        .div(finishBlock.sub(currentBlock));
      await createPlan_1(account1, recipient, currentBlock, finishBlock, constants.ZERO_ADDRESS, bn0, bn1e17);
      assert.equal(true, (await contract.getBalance()).eq(bn1e17));
      await time.advanceBlockTo(partialBlock);
      let balanceRecipient = new BN(await web3.eth.getBalance(recipient));
      let result = await contract.claimPayment(bn0, { from: recipient });
      truffleAssert.eventEmitted(result, 'ClaimPayment', (ev: any) => {
        assert.equal(ev.to, recipient);
        assert.equal(true, ev.currentBlock.eq(partialBlock.add(new BN(1))));
        assert.equal(ev.token, constants.ZERO_ADDRESS);
        assert.equal(true, ev.amountToken.eq(bn0));
        assert.equal(true, ev.amountEth.eq(amountPartial));
        return true;
      });
      const transaction = await web3.eth.getTransaction(result.tx);
      const used_gas = web3.utils.toBN(result.receipt.gasUsed);
      const gas_price = web3.utils.toBN(transaction.gasPrice);
      assert.equal(true, (await contract.getBalance()).eq(bn1e17.sub(amountPartial)));
      assert.equal(
        true,
        new BN(await web3.eth.getBalance(recipient)).eq(
          balanceRecipient.add(amountPartial).sub(used_gas.mul(gas_price))
        )
      );
    });

    it('Should claim partial payment with eth and token', async () => {
      const currentBlock = await time.latestBlock();
      const finishBlock = currentBlock.add(web3.utils.toBN(10));
      const partialBlock = currentBlock.add(web3.utils.toBN(5));
      const amountPartialToken = bn1e18
        .mul(partialBlock.add(new BN(1)).sub(currentBlock))
        .div(finishBlock.sub(currentBlock));
      const amountPartialEth = bn1e17
        .mul(partialBlock.add(new BN(1)).sub(currentBlock))
        .div(finishBlock.sub(currentBlock));
      await createPlan_1(account1, recipient, currentBlock, finishBlock, token.address, bn1e18, bn1e17);
      assert.equal(true, (await contract.getBalance()).eq(bn1e17));
      assert.equal(true, (await token.balanceOf(contract.address)).eq(bn1e18));
      await time.advanceBlockTo(partialBlock);
      const balanceRecipientEth = new BN(await web3.eth.getBalance(recipient));
      const balanceRecipientToken = await token.balanceOf(recipient);
      let result = await contract.claimPayment(bn0, { from: recipient });
      truffleAssert.eventEmitted(result, 'ClaimPayment', (ev: any) => {
        assert.equal(ev.to, recipient);
        assert.equal(true, ev.currentBlock.eq(partialBlock.add(new BN(1))));
        assert.equal(ev.token, token.address);
        assert.equal(true, ev.amountToken.eq(amountPartialToken));
        assert.equal(true, ev.amountEth.eq(amountPartialEth));
        return true;
      });
      const transaction = await web3.eth.getTransaction(result.tx);
      const used_gas = web3.utils.toBN(result.receipt.gasUsed);
      const gas_price = web3.utils.toBN(transaction.gasPrice);
      assert.equal(true, (await contract.getBalance()).eq(bn1e17.sub(amountPartialEth)));
      assert.equal(
        true,
        new BN(await web3.eth.getBalance(recipient)).eq(
          balanceRecipientEth.add(amountPartialEth).sub(used_gas.mul(gas_price))
        )
      );
      assert.equal(true, (await token.balanceOf(contract.address)).eq(bn1e18.sub(amountPartialToken)));
      assert.equal(true, (await token.balanceOf(recipient)).eq(balanceRecipientToken.add(amountPartialToken)));
    });

    it('Should not claim. There is no such index', async () => {
      await truffleAssert.reverts(
        contract.claimPayment(bn0, { from: recipient }),
        'claimPayment: there is no such index'
      );
    });

    it('Should not claim. Did not reach the starting block', async () => {
      const currentBlock = await time.latestBlock();
      const finishBlock = currentBlock.add(web3.utils.toBN(10));
      await createPlan_1(account1, recipient, currentBlock.add(new BN(5)), finishBlock, token.address, bn1e18, bn1e17);
      assert.equal(true, (await contract.getBalance()).eq(bn1e17));
      assert.equal(true, (await token.balanceOf(contract.address)).eq(bn1e18));
      await truffleAssert.reverts(
        contract.claimPayment(bn0, { from: recipient }),
        'claimPayment: currently no payouts'
      );
    });

    it('Should not claim. Repeat request after claimed', async () => {
      const currentBlock = await time.latestBlock();
      const finishBlock = currentBlock.add(web3.utils.toBN(10));
      await createPlan_1(account1, recipient, currentBlock, finishBlock, token.address, bn1e18, bn1e17);
      assert.equal(true, (await contract.getBalance()).eq(bn1e17));
      assert.equal(true, (await token.balanceOf(contract.address)).eq(bn1e18));
      await time.advanceBlockTo(finishBlock);
      let result = await contract.claimPayment(bn0, { from: recipient });
      truffleAssert.eventEmitted(result, 'ClaimPayment', (ev: any) => {
        assert.equal(ev.to, recipient);
        assert.equal(true, ev.currentBlock.eq(finishBlock.add(new BN(1))));
        assert.equal(ev.token, token.address);
        assert.equal(true, ev.amountToken.eq(bn1e18));
        assert.equal(true, ev.amountEth.eq(bn1e17));
        return true;
      });
      await truffleAssert.reverts(
        contract.claimPayment(bn0, { from: recipient }),
        'claimPayment: there is no payout amount'
      );
    });
  });

  describe('getNumberPlans', function () {
    it('Should return number plans', async () => {
      const currentBlock = await time.latestBlock();
      const finishBlock = currentBlock.add(web3.utils.toBN(10));
      await createPlan_1(account1, recipient, currentBlock, finishBlock, token.address, bn1e18, bn0);
      await createPlan_1(account1, recipient, currentBlock, finishBlock, constants.ZERO_ADDRESS, bn0, bn1e17);
      assert.equal(true, (await contract.getNumberPlans(recipient)).eq(new BN(2)));
    });

    it('Should return none plans (0)', async () => {
      assert.equal(true, (await contract.getNumberPlans(recipient)).eq(new BN(0)));
    });

    it('Should not get number plans. Get plans with zero address', async () => {
      await truffleAssert.reverts(
        contract.getNumberPlans(constants.ZERO_ADDRESS),
        'getNumberPlans: recipient with null address'
      );
    });
  });

  describe('getPlan', function () {
    it('Should return plan', async () => {
      const currentBlock = await time.latestBlock();
      const finishBlock = currentBlock.add(web3.utils.toBN(10));
      await createPlan_1(account1, recipient, currentBlock, finishBlock, token.address, bn1e18, bn0);
      const plan = await contract.getPlan(recipient, bn0);
      assert.equal(plan._startBlock, currentBlock.toString());
      assert.equal(plan._finishBlock, finishBlock.toString());
      assert.equal(plan._token, token.address);
      assert.equal(plan._amountToken, bn1e18.toString());
      assert.equal(plan._amountEth, bn0.toString());
    });

    it('Should not return plan. Get plan with zero address', async () => {
      const currentBlock = await time.latestBlock();
      const finishBlock = currentBlock.add(web3.utils.toBN(10));
      await createPlan_1(account1, recipient, currentBlock, finishBlock, token.address, bn1e18, bn0);
      await truffleAssert.reverts(
        contract.getPlan(constants.ZERO_ADDRESS, bn0),
        'getPlan: recipient with null address'
      );
    });

    it('Should not return plan. There is no plan with this index', async () => {
      const currentBlock = await time.latestBlock();
      const finishBlock = currentBlock.add(web3.utils.toBN(10));
      await createPlan_1(account1, recipient, currentBlock, finishBlock, token.address, bn1e18, bn0);
      await truffleAssert.reverts(contract.getPlan(recipient, new BN(1)), 'getPlan: there is no such index');
    });
  });

  describe('getPaymentAmount', function () {
    it('Should return 0, 0. There is no plan with this index', async () => {
      const result = await contract.getPaymentAmount(bn0, { from: recipient });
      const waiting: {
        '0': any;
        '1': any;
      } = {
        '0': bn0,
        '1': bn0,
      };
      assert.deepEqual(result, waiting);
    });

    it('Should return 0, 0. Did not reach the starting block', async () => {
      const currentBlock = await time.latestBlock();
      const finishBlock = currentBlock.add(web3.utils.toBN(10));
      await createPlan_1(account1, recipient, currentBlock.add(new BN(5)), finishBlock, token.address, bn1e18, bn1e17);
      const result = await contract.getPaymentAmount(bn0, { from: recipient });
      const waiting: {
        '0': any;
        '1': any;
      } = {
        '0': bn0,
        '1': bn0,
      };
      assert.deepEqual(result, waiting);
    });

    it('Should return 0, 0. Request after claimed', async () => {
      const currentBlock = await time.latestBlock();
      const finishBlock = currentBlock.add(web3.utils.toBN(10));
      await createPlan_1(account1, recipient, currentBlock, finishBlock, token.address, bn1e18, bn1e17);
      await time.advanceBlockTo(finishBlock);
      let result = await contract.claimPayment(bn0, { from: recipient });
      truffleAssert.eventEmitted(result, 'ClaimPayment', (ev: any) => {
        assert.equal(ev.to, recipient);
        assert.equal(true, ev.currentBlock.eq(finishBlock.add(new BN(1))));
        assert.equal(ev.token, token.address);
        assert.equal(true, ev.amountToken.eq(bn1e18));
        assert.equal(true, ev.amountEth.eq(bn1e17));
        return true;
      });
      const result_1 = await contract.getPaymentAmount(bn0, { from: recipient });
      const waiting: {
        '0': any;
        '1': any;
      } = {
        '0': bn0,
        '1': bn0,
      };
      assert.deepEqual(result_1, waiting);
    });

    it('Should return full payment with eth and token', async () => {
      const currentBlock = await time.latestBlock();
      const finishBlock = currentBlock.add(web3.utils.toBN(10));
      await createPlan_1(account1, recipient, currentBlock, finishBlock, token.address, bn1e18, bn1e17);
      await time.advanceBlockTo(finishBlock);
      const result = await contract.getPaymentAmount(bn0, { from: recipient });
      const waiting: {
        '0': any;
        '1': any;
      } = {
        '0': bn1e18,
        '1': bn1e17,
      };
      assert.deepEqual(result, waiting);
    });

    it('Should claim partial payment with eth and token', async () => {
      const currentBlock = await time.latestBlock();
      const finishBlock = currentBlock.add(web3.utils.toBN(10));
      const partialBlock = currentBlock.add(web3.utils.toBN(5));
      const amountPartialToken = bn1e18.mul(partialBlock.sub(currentBlock)).div(finishBlock.sub(currentBlock));
      const amountPartialEth = bn1e17.mul(partialBlock.sub(currentBlock)).div(finishBlock.sub(currentBlock));
      await createPlan_1(account1, recipient, currentBlock, finishBlock, token.address, bn1e18, bn1e17);
      await time.advanceBlockTo(partialBlock);
      const result = await contract.getPaymentAmount(bn0, { from: recipient });
      assert.equal(true, amountPartialToken.eq(result[0]));
      assert.equal(true, amountPartialEth.eq(result[1]));
    });
  });

  const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
  describe('Role', function () {
    it('Should set the right roles to deployer', async () => {
      const isAdmin = await contract.hasRole(DEFAULT_ADMIN_ROLE, owner);
      assert.equal(true, isAdmin);
    });
  });

  describe('pause/unpause', function () {
    it('Should fail: not admin', async function () {
      await truffleAssert.reverts(
        contract.pause({ from: account1 }),
        `AccessControl: account ${account1.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
      );
    });

    it('Should pause/unpause', async function () {
      const currentBlock = await time.latestBlock();
      const finishBlock = currentBlock.add(web3.utils.toBN(10));
      await createPlan_1(account1, recipient, currentBlock, finishBlock, token.address, bn1e18, bn1e17);
      await contract.pause({ from: owner });
      await truffleAssert.reverts(
        createPlan_1(account1, recipient, currentBlock, finishBlock, token.address, bn1e18, bn1e17),
        'Pausable: paused'
      );
      await contract.unpause({ from: owner });
      await createPlan_1(account1, recipient, currentBlock, finishBlock, token.address, bn1e18, bn1e17);
    });
  });
});
