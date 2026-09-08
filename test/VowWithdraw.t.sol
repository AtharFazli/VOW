// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../src/Vow.sol";

interface Vm {
    function deal(address who, uint256 newBalance) external;
    function prank(address who) external;
    function warp(uint256 newTimestamp) external;
    function expectRevert(bytes calldata revertData) external;
    function expectEmit(bool checkTopic1, bool checkTopic2, bool checkTopic3, bool checkData) external;
}

contract VowWithdrawGateTest {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    address constant CREATOR = address(0xA11CE);
    address constant PARTNER = address(0xB0B);
    address constant OTHER = address(0xD0D);
    address constant FAILURE_SINK = address(0xFEE1);

    uint256 constant STAKE = 1 ether;
    uint256 constant BIG_STAKE = 2 ether;

    event Withdrawal(address indexed account, uint256 amount);

    function _newVow() internal returns (Vow) {
        return new Vow(FAILURE_SINK);
    }

    function _createAccepted(
        Vow vow,
        address partner,
        uint256 stake,
        uint64 acceptDeadline,
        uint64 deliveryDeadline,
        uint64 reviewDeadline,
        uint64 disputeDeadline
    ) internal returns (uint256 vowId) {
        vm.deal(CREATOR, stake);
        vm.prank(CREATOR);
        vowId = vow.createVow{value: stake}(
            partner,
            address(0),
            "Ship frontend",
            "Deploy contract",
            acceptDeadline,
            deliveryDeadline,
            reviewDeadline,
            disputeDeadline
        );
        vm.deal(partner, stake);
        vm.prank(partner);
        vow.acceptVow{value: stake}(vowId);
    }

    function _submit(Vow vow, address sender, uint256 vowId, string memory proofURI) internal {
        vm.prank(sender);
        vow.submitProof(vowId, proofURI, keccak256(bytes(proofURI)));
    }

    function _review(Vow vow, address sender, uint256 vowId, address participant, bool approved, string memory reason)
        internal
    {
        vm.prank(sender);
        vow.reviewProof(vowId, participant, approved, reason);
    }

    function _stateBytes(Vow vow, uint256 vowId) internal view returns (bytes memory data) {
        (bool ok, bytes memory ret) = address(vow).staticcall(abi.encodeWithSignature("vows(uint256)", vowId));
        require(ok, "vow");
        return ret;
    }

    function _settleSuccessSuccess(
        Vow vow,
        address partner,
        uint64 acceptDeadline,
        uint64 deliveryDeadline,
        uint64 reviewDeadline,
        uint64 disputeDeadline
    ) internal returns (uint256 vowId) {
        vowId = _createAccepted(vow, partner, STAKE, acceptDeadline, deliveryDeadline, reviewDeadline, disputeDeadline);
        _submit(vow, CREATOR, vowId, "https://example.com/creator-proof");
        _submit(vow, partner, vowId, "https://example.com/partner-proof");
        _review(vow, partner, vowId, CREATOR, true, "");
        _review(vow, CREATOR, vowId, partner, true, "");
        vm.warp(reviewDeadline + 1);
        vm.prank(OTHER);
        vow.finalizeVow(vowId);
    }

    function _settleFailedFailed(
        Vow vow,
        uint256 stake,
        uint64 acceptDeadline,
        uint64 deliveryDeadline,
        uint64 reviewDeadline,
        uint64 disputeDeadline
    ) internal returns (uint256 vowId) {
        vowId = _createAccepted(vow, PARTNER, stake, acceptDeadline, deliveryDeadline, reviewDeadline, disputeDeadline);
        vm.warp(deliveryDeadline + 1);
        vm.prank(OTHER);
        vow.finalizeVow(vowId);
    }

    function test_WithdrawRevertsZeroClaimable() public {
        Vow vow = _newVow();

        vm.expectRevert(abi.encodeWithSelector(Vow.NothingToWithdraw.selector));
        vm.prank(CREATOR);
        vow.withdraw();
    }

    function test_WithdrawTransfersExactAmountAndZerosClaimable() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        uint256 vowId = _settleSuccessSuccess(vow, PARTNER, 1_010, 1_020, 1_030, 1_040);
        bytes memory beforeState = _stateBytes(vow, vowId);
        uint256 creatorEthBefore = CREATOR.balance;
        uint256 contractBefore = address(vow).balance;

        vm.expectEmit(true, false, false, true);
        emit Withdrawal(CREATOR, STAKE);
        vm.prank(CREATOR);
        vow.withdraw();

        require(vow.claimable(CREATOR) == 0, "creator claimable");
        require(vow.claimable(PARTNER) == STAKE, "partner claimable");
        require(address(vow).balance == contractBefore - STAKE, "contract balance");
        require(CREATOR.balance == creatorEthBefore + STAKE, "creator balance");
        require(keccak256(beforeState) == keccak256(_stateBytes(vow, vowId)), "state");

        vm.expectRevert(abi.encodeWithSelector(Vow.NothingToWithdraw.selector));
        vm.prank(CREATOR);
        vow.withdraw();
    }

    function test_WithdrawUsesClaimableNotRawBalance() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        _settleSuccessSuccess(vow, PARTNER, 1_010, 1_020, 1_030, 1_040);
        uint256 claimable = vow.claimable(CREATOR);
        uint256 extra = 7 ether;
        uint256 contractBefore = address(vow).balance + extra;
        vm.deal(address(vow), contractBefore);
        uint256 creatorEthBefore = CREATOR.balance;

        vm.prank(CREATOR);
        vow.withdraw();

        require(vow.claimable(CREATOR) == 0, "creator claimable");
        require(address(vow).balance == contractBefore - claimable, "contract balance");
        require(CREATOR.balance == creatorEthBefore + claimable, "creator balance");
        require(address(vow).balance == extra + STAKE, "extra remains");
    }

    function test_WithdrawRejectingReceiverRevertsAndRestoresClaimable() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        RejectingReceiver receiver = new RejectingReceiver(vow);
        _createAccepted(vow, address(receiver), STAKE, 1_010, 1_020, 1_030, 1_040);
        _submit(vow, CREATOR, 0, "https://example.com/creator-proof");
        _submit(vow, address(receiver), 0, "https://example.com/receiver-proof");
        _review(vow, CREATOR, 0, address(receiver), true, "");
        vm.warp(1_031);
        vm.prank(OTHER);
        vow.finalizeVow(0);

        uint256 claimableBefore = vow.claimable(address(receiver));
        uint256 balanceBefore = address(vow).balance;
        uint256 receiverEthBefore = address(receiver).balance;

        vm.expectRevert(abi.encodeWithSelector(Vow.NativeTransferFailed.selector));
        receiver.withdraw();

        require(vow.claimable(address(receiver)) == claimableBefore, "claimable");
        require(address(vow).balance == balanceBefore, "contract balance");
        require(address(receiver).balance == receiverEthBefore, "receiver balance");
    }

    function test_WithdrawBlocksReentrancyAttack() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        ReentrantReceiver receiver = new ReentrantReceiver(vow);
        _createAccepted(vow, address(receiver), STAKE, 1_010, 1_020, 1_030, 1_040);
        _submit(vow, CREATOR, 0, "https://example.com/creator-proof");
        _submit(vow, address(receiver), 0, "https://example.com/receiver-proof");
        _review(vow, CREATOR, 0, address(receiver), true, "");
        vm.warp(1_031);
        vm.prank(OTHER);
        vow.finalizeVow(0);

        uint256 contractBefore = address(vow).balance;
        receiver.withdraw();

        require(receiver.attemptedReentry(), "reentry");
        require(receiver.received() == STAKE, "received");
        require(vow.claimable(address(receiver)) == 0, "claimable");
        require(address(vow).balance == contractBefore - STAKE, "contract balance");

        vm.expectRevert(abi.encodeWithSelector(Vow.NothingToWithdraw.selector));
        receiver.withdraw();
    }

    function test_MultipleClaimableCreditsAccumulateAcrossVows() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        uint256 first = _settleSuccessSuccess(vow, PARTNER, 1_010, 1_020, 1_030, 1_040);
        uint256 second = _settleSuccessSuccess(vow, PARTNER, 1_050, 1_060, 1_070, 1_080);
        require(first == 0 && second == 1, "ids");
        require(vow.claimable(CREATOR) == STAKE * 2, "accumulated");

        uint256 creatorEthBefore = CREATOR.balance;
        vm.prank(CREATOR);
        vow.withdraw();

        require(vow.claimable(CREATOR) == 0, "claimable");
        require(CREATOR.balance == creatorEthBefore + 2 * STAKE, "payout");
    }

    function test_CrossUserIsolationAndFailureSinkWithdraw() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        _settleSuccessSuccess(vow, PARTNER, 1_010, 1_020, 1_030, 1_040);
        _settleFailedFailed(vow, BIG_STAKE, 1_050, 1_060, 1_070, 1_080);

        require(vow.claimable(CREATOR) == STAKE, "creator");
        require(vow.claimable(PARTNER) == STAKE, "partner");
        require(vow.claimable(FAILURE_SINK) == 2 * BIG_STAKE, "sink");

        uint256 creatorEthBefore = CREATOR.balance;
        uint256 partnerEthBefore = PARTNER.balance;
        uint256 sinkEthBefore = FAILURE_SINK.balance;

        vm.prank(CREATOR);
        vow.withdraw();
        require(vow.claimable(CREATOR) == 0, "creator zero");
        require(vow.claimable(PARTNER) == STAKE, "partner untouched");
        require(vow.claimable(FAILURE_SINK) == 2 * BIG_STAKE, "sink untouched");
        require(CREATOR.balance == creatorEthBefore + STAKE, "creator payout");

        vm.prank(PARTNER);
        vow.withdraw();
        require(vow.claimable(PARTNER) == 0, "partner zero");
        require(vow.claimable(FAILURE_SINK) == 2 * BIG_STAKE, "sink still untouched");
        require(PARTNER.balance == partnerEthBefore + STAKE, "partner payout");

        vm.prank(FAILURE_SINK);
        vow.withdraw();
        require(vow.claimable(FAILURE_SINK) == 0, "sink zero");
        require(FAILURE_SINK.balance == sinkEthBefore + 2 * BIG_STAKE, "sink payout");
    }
}

contract WithdrawHarness {
    Vow public immutable vow;

    constructor(Vow vow_) {
        vow = vow_;
    }

    function withdraw() external {
        vow.withdraw();
    }
}

contract RejectingReceiver is WithdrawHarness {
    constructor(Vow vow_) WithdrawHarness(vow_) {}

    receive() external payable {
        revert();
    }
}

contract ReentrantReceiver is WithdrawHarness {
    bool private reentered;
    uint256 private got;

    constructor(Vow vow_) WithdrawHarness(vow_) {}

    function attemptedReentry() external view returns (bool) {
        return reentered;
    }

    function received() external view returns (uint256) {
        return got;
    }

    receive() external payable {
        got += msg.value;
        if (!reentered) {
            reentered = true;
            try vow.withdraw() {} catch {}
        }
    }
}
