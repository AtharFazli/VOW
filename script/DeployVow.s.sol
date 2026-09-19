// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/Vow.sol";

contract DeployVow is Script {
    // ponytail: two chains only (Bohr 968, BOT 677); widen to a set if a third appears
    uint256 constant BOHR_TESTNET = 968;
    uint256 constant BOT_MAINNET = 677;

    function run() external {
        require(block.chainid == BOHR_TESTNET || block.chainid == BOT_MAINNET, "Wrong chain");

        // failureSink is immutable after deploy: read it, never default it.
        // A fallback here would silently bake the wrong sink into a live contract.
        // Zero is rejected by Vow's constructor (ZeroAddress), so no check here.
        address failureSink = vm.envAddress("FAILURE_SINK");
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerKey);
        Vow vow = new Vow(failureSink);
        vm.stopBroadcast();

        console.log("Chain ID:", block.chainid);
        console.log("Vow deployed at:", address(vow));
        console.log("Failure sink:", failureSink);
    }
}
