// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../src/Vow.sol";

contract VowSkeletonTest {
    function test_FailureSinkStoredCorrectly() public {
        address sink = address(0xBEEF);
        Vow vow = new Vow(sink);
        require(vow.failureSink() == sink, "failureSink");
        require(vow.nextVowId() == 0, "nextVowId");
    }

    function test_ZeroFailureSinkRejected() public {
        bool reverted;
        try this.deployZeroFailureSink() returns (address) {}
        catch {
            reverted = true;
        }
        require(reverted, "zero failureSink");
    }

    function test_InitialNextVowIdZero() public {
        Vow vow = new Vow(address(0xBEEF));
        require(vow.nextVowId() == 0, "nextVowId");
    }

    function deployZeroFailureSink() external returns (address) {
        Vow vow = new Vow(address(0));
        return address(vow);
    }
}
