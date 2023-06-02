// SPDX-License-Identifier: MIT

// Author: Pavlo Zavadskiy
// Email: pavelzavadsky@gmail.com
// GitHub: https://github.com/PavelZavadskiy

pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20("Mock Token", "MOT") {
    function mint(address _to, uint256 _amount) public {
        _mint(_to, _amount);
    }
}