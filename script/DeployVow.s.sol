// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/Vow.sol";

contract DeployVow is Script {
    // ponytail: hardcoded testnet failure sink — immutable after deploy
    address constant FAILURE_SINK = 0xF4436Ae58d3Cc4F35dc5D38F56DBBa959230285B;

    function run() external {
        require(block.chainid == 968, "Wrong chain");
        require(FAILURE_SINK != address(0), "Zero failure sink");

        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);
        Vow vow = new Vow(FAILURE_SINK);
        vm.stopBroadcast();

        console.log("Vow deployed at:", address(vow));
        console.log("Failure sink:", FAILURE_SINK);
    }
}
