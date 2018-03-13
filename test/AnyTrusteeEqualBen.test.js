const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");

const { interface, bytecode } = require("../compile");
const compiledATEB = require("../build/AnyTrusteeEqualBen.json");

let web3;
let trust;
let accounts;
let provider;

describe("Any Trustee Multi Beneficiary Contract", () => {
  describe("Basics", () => {
    before(async () => {
      provider = ganache.provider();
      web3 = new Web3(provider);
      accounts = await web3.eth.getAccounts();

      trust = await new web3.eth.Contract(JSON.parse(compiledATEB.interface))
        .deploy({
          data: compiledATEB.bytecode,
          arguments: ["Test Trust"]
        })
        .send({ from: accounts[0], gas: "5000000" });

      trust.setProvider(provider);
    });

    it("deploys a contract", () => {
      assert.ok(trust.options.address);
    });

    it("owner registered as trustee", async () => {
      assert.ok(await trust.methods.trustees(accounts[0]).call());
    });

    it("add trustee", async () => {
      await trust.methods.registerTrustee(accounts[1]).send({
        from: accounts[0]
      });

      assert.ok(await trust.methods.trustees(accounts[1]).call());
    });

    it("add beneficiary", async () => {
      await trust.methods.registerBeneficiary(accounts[9]).send({
        from: accounts[0]
      });

      assert.equal(await trust.methods.beneficiaries(0).call(), accounts[9]);
    });

    it("deposit funds", async () => {
      const initialBalance = await web3.eth.getBalance(trust.options.address);
      const etherToSend = 0.02;

      // var depositEvent = trust.event.EventDeposit();
      // depositEvent.watch(function(error, result){
      //   if (!error)
      //      {
      //        console.log ('Deposit from', result.args._from);
      //        console.log ('Deposit amount', result.args._value);
      //      } else {
      //        console.log(error);
      //      }
      //    });

      await trust.methods.deposit().send({
        from: accounts[0],
        value: web3.utils.toWei(String(etherToSend), "ether")
      });

      const threshold = web3.utils.toWei(String(etherToSend), "ether") * 0.999;

      const newBalance = await web3.eth.getBalance(trust.options.address);
      assert(newBalance > threshold);
    });
  });

  describe("Advanced", () => {
    const etherToSend = 4;
    const threshold = 0.99999;
    const withdrawalPercent = 100;
    let beforeBalance6, beforeBalance7, beforeBalance8, beforeBalance9, numBens;

    beforeEach(async () => {
      // 1- create instance of contract
      // 2- deposit some ether
      // 3- register four beneficiaries

      // 1- create instance of contract
      provider = ganache.provider();
      web3 = new Web3(provider);
      accounts = await web3.eth.getAccounts();

      trust = await new web3.eth.Contract(JSON.parse(compiledATEB.interface))
        .deploy({
          data: compiledATEB.bytecode,
          arguments: ["Test Trust"]
        })
        .send({ from: accounts[0], gas: "5000000" });

      //console.log ('Advanced: beforeEach: new instance of contract: ' + trust.options.address);
      trust.setProvider(provider);
      numBens = 0;

      // 2- deposit some ether
      await trust.methods.deposit().send({
        from: accounts[0],
        value: web3.utils.toWei(String(etherToSend), "ether")
      });

      // 3- register some beneficiaries
      await trust.methods.registerBeneficiary(accounts[6]).send({
        from: accounts[0]
      });
      numBens++;

      await trust.methods.registerBeneficiary(accounts[7]).send({
        from: accounts[0]
      });
      numBens++;

      await trust.methods.registerBeneficiary(accounts[8]).send({
        from: accounts[0]
      });
      numBens++;

      await trust.methods.registerBeneficiary(accounts[9]).send({
        from: accounts[0]
      });
      numBens++;

      beforeBalance6 = await web3.eth.getBalance(accounts[6]);
      beforeBalance7 = await web3.eth.getBalance(accounts[7]);
      beforeBalance8 = await web3.eth.getBalance(accounts[8]);
      beforeBalance9 = await web3.eth.getBalance(accounts[9]);
    });

    it("Beneficiaries receive correct amounts", async () => {
      // 1- issue withdrawal
      // 2- calculate payout
      // 3- compare expected payout to actual payout

      await trust.methods.withdraw(String(withdrawalPercent)).send({
        from: accounts[0]
      });

      payoutPerBen = parseInt(
        web3.utils.toWei(String(etherToSend / numBens), "ether") *
          withdrawalPercent /
          100
      );

      const afterBalance6 = await web3.eth.getBalance(accounts[6]);
      const afterBalance7 = await web3.eth.getBalance(accounts[7]);
      const afterBalance8 = await web3.eth.getBalance(accounts[8]);
      const afterBalance9 = await web3.eth.getBalance(accounts[9]);

      const expectedBalance6 = parseInt(beforeBalance6) + payoutPerBen;
      const expectedBalance7 = parseInt(beforeBalance7) + payoutPerBen;
      const expectedBalance8 = parseInt(beforeBalance8) + payoutPerBen;
      const expectedBalance9 = parseInt(beforeBalance9) + payoutPerBen;

      assert(
        afterBalance6 > expectedBalance6 * threshold &&
          afterBalance6 <= expectedBalance6
      );
      assert(
        afterBalance7 > expectedBalance7 * threshold &&
          afterBalance7 <= expectedBalance7
      );
      assert(
        afterBalance8 > expectedBalance8 * threshold &&
          afterBalance8 <= expectedBalance8
      );
      assert(
        afterBalance9 > expectedBalance9 * threshold &&
          afterBalance9 <= expectedBalance9
      );
    });

    it("Unregister account as beneficiary", async () => {
      // 1- unregister beneficiary
      // 2- get list of registered beneficiaries
      // 3- ensure unregistered beneficiary does not exist in list

      await trust.methods.unregisterBeneficiary(accounts[9]).send({
        from: accounts[0]
      });
      numBens--;

      const beneficiaries = await trust.methods.getBeneficiaries().call();

      for (var i = 0; i < beneficiaries.length; i++) {
        assert(beneficiaries[i] != accounts[9]);
      }
    });

    it("Unregister beneficiary and trigger withdrawal", async () => {
      // 1- unregister beneficiary
      // 2- issue withdrawal
      // 3- calculate payout
      // 4- compare expected payout to actual payout

      // 1- unregister beneficiary
      await trust.methods.unregisterBeneficiary(accounts[9]).send({
        from: accounts[0]
      });
      numBens--;

      // 2- issue withdrawal
      await trust.methods.withdraw(String(withdrawalPercent)).send({
        from: accounts[0]
      });

      // 3- calculation payout
      payoutPerBen = parseInt(
        web3.utils.toWei(String(etherToSend / numBens), "ether") *
          withdrawalPercent /
          100
      );

      // 4- compare expected payout to actual payout
      const afterBalance6 = await web3.eth.getBalance(accounts[6]);
      const afterBalance7 = await web3.eth.getBalance(accounts[7]);
      const afterBalance8 = await web3.eth.getBalance(accounts[8]);

      const expectedBalance6 = parseInt(beforeBalance6) + payoutPerBen;
      const expectedBalance7 = parseInt(beforeBalance7) + payoutPerBen;
      const expectedBalance8 = parseInt(beforeBalance8) + payoutPerBen;

      // console.log (numBens);
      // console.log (afterBalance6);
      // console.log (expectedBalance6);
      // console.log (expectedBalance6 * threshold);

      assert(
        afterBalance6 > expectedBalance6 * threshold &&
          afterBalance6 <= expectedBalance6
      );
      assert(
        afterBalance7 > expectedBalance7 * threshold &&
          afterBalance7 <= expectedBalance7
      );
      assert(
        afterBalance8 > expectedBalance8 * threshold &&
          afterBalance8 <= expectedBalance8
      );
    });

    it("Attempt withdrawal from unregistered trustee", async () => {
      try {
        // 1- issue withdrawal
        await trust.methods.withdraw(String(withdrawalPercent)).send({
          from: accounts[5]
        });
        assert(false);
      } catch (err) {
        assert(err);
      }
    });

    it("Register new trustee and attempt withdrawal", async () => {
      // 1- register trustee
      await trust.methods.registerTrustee(accounts[5]).send({
        from: accounts[0]
      });

      // 2- issue withdrawal
      await trust.methods.withdraw(String(withdrawalPercent)).send({
        from: accounts[5]
      });

      // 3- calculation payout
      payoutPerBen = parseInt(
        web3.utils.toWei(String(etherToSend / numBens), "ether") *
          withdrawalPercent /
          100
      );

      // 4- compare expected payout to actual payout
      const afterBalance6 = await web3.eth.getBalance(accounts[6]);
      const afterBalance7 = await web3.eth.getBalance(accounts[7]);
      const afterBalance8 = await web3.eth.getBalance(accounts[8]);

      const expectedBalance6 = parseInt(beforeBalance6) + payoutPerBen;
      const expectedBalance7 = parseInt(beforeBalance7) + payoutPerBen;
      const expectedBalance8 = parseInt(beforeBalance8) + payoutPerBen;

      assert(
        afterBalance6 > expectedBalance6 * threshold &&
          afterBalance6 <= expectedBalance6
      );
      assert(
        afterBalance7 > expectedBalance7 * threshold &&
          afterBalance7 <= expectedBalance7
      );
      assert(
        afterBalance8 > expectedBalance8 * threshold &&
          afterBalance8 <= expectedBalance8
      );
    });

    it("Register and unregister trustee, then attempt withdrawal", async () => {
      // 1- register trustee
      await trust.methods.registerTrustee(accounts[5]).send({
        from: accounts[0]
      });

      // 2- register trustee
      await trust.methods.unregisterTrustee(accounts[5]).send({
        from: accounts[0]
      });

      try {
        // 3- issue withdrawal
        await trust.methods.withdraw(String(withdrawalPercent)).send({
          from: accounts[5]
        });
        assert(false);
      } catch (err) {
        assert(err);
      }
    });
  });
});
