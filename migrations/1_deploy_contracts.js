require('dotenv').config();

let Vesting = artifacts.require('./Vesting.sol');

module.exports = async function (deployer) {
  await deployer.deploy(Vesting);
};
