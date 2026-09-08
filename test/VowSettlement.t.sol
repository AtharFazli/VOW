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

contract VowSettlementGateTest {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    address constant CREATOR = address(0xA11CE);
    address constant PARTNER = address(0xB0B);
    address constant OTHER = address(0xD0D);
    address constant FAILURE_SINK = address(0xFEE1);
    address constant ARBITER = address(0xC0DE);

    uint256 constant STAKE = 1 ether;
    uint256 constant BIG_STAKE = 2 ether;

    event VowSettled(uint256 indexed vowId, Vow.ParticipantStatus creatorOutcome, Vow.ParticipantStatus partnerOutcome);

    function _newVow() internal returns (Vow) {
        return new Vow(FAILURE_SINK);
    }

    function _createProposed(Vow vow, uint256 stake) internal returns (uint256 vowId) {
        vm.deal(CREATOR, stake);
        vm.prank(CREATOR);
        vowId = vow.createVow{value: stake}(
            PARTNER, ARBITER, "Ship frontend", "Deploy contract", 1_010, 1_020, 1_030, 1_040
        );
    }

    function _createAccepted(Vow vow, uint256 stake) internal returns (uint256 vowId) {
        vowId = _createAcceptedWithDeadlines(vow, stake, 1_010, 1_020, 1_030, 1_040);
    }

    function _createAcceptedWithDeadlines(
        Vow vow,
        uint256 stake,
        uint64 acceptDeadline,
        uint64 deliveryDeadline,
        uint64 reviewDeadline,
        uint64 disputeDeadline
    ) internal returns (uint256 vowId) {
        vm.deal(CREATOR, stake);
        vm.prank(CREATOR);
        vowId = vow.createVow{value: stake}(
            PARTNER,
            ARBITER,
            "Ship frontend",
            "Deploy contract",
            acceptDeadline,
            deliveryDeadline,
            reviewDeadline,
            disputeDeadline
        );
        vm.deal(PARTNER, stake);
        vm.prank(PARTNER);
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

    function _data(Vow vow, uint256 vowId) internal view returns (bytes memory data) {
        (bool ok, bytes memory ret) = address(vow).staticcall(abi.encodeWithSignature("vows(uint256)", vowId));
        require(ok, "vow");
        return ret;
    }

    function _word(bytes memory data, uint256 index) internal pure returns (bytes32 value) {
        assembly {
            value := mload(add(add(data, 0x20), mul(index, 0x20)))
        }
    }

    function _addr(bytes memory data, uint256 index) internal pure returns (address value) {
        value = address(uint160(uint256(_word(data, index))));
    }

    function _u64(bytes memory data, uint256 index) internal pure returns (uint64 value) {
        value = uint64(uint256(_word(data, index)));
    }

    function _status(bytes memory data, uint256 index) internal pure returns (Vow.VowStatus value) {
        value = Vow.VowStatus(uint8(uint256(_word(data, index))));
    }

    function _participantStatus(bytes memory data, uint256 index) internal pure returns (Vow.ParticipantStatus value) {
        value = Vow.ParticipantStatus(uint8(uint256(_word(data, index))));
    }

    function _string(bytes memory data, uint256 index) internal pure returns (string memory value) {
        uint256 offset = uint256(_word(data, index));
        uint256 len;
        assembly {
            len := mload(add(add(data, 0x20), offset))
        }
        value = new string(len);
        assembly {
            let src := add(add(data, 0x40), offset)
            let dst := add(value, 0x20)
            for { let i := 0 } lt(i, len) { i := add(i, 0x20) } {
                mstore(add(dst, i), mload(add(src, i)))
            }
        }
    }

    function _assertStatic(Vow vow, uint256 vowId, uint256 stake) internal view {
        bytes memory data = _data(vow, vowId);
        require(_addr(data, 0) == CREATOR, "creator");
        require(_addr(data, 1) == PARTNER, "partner");
        require(_addr(data, 2) == ARBITER, "arbiter");
        require(_word(data, 3) == bytes32(stake), "stake");
        require(_u64(data, 4) == 1_010, "accept");
        require(_u64(data, 5) == 1_020, "delivery");
        require(_u64(data, 6) == 1_030, "review");
        require(_u64(data, 7) == 1_040, "dispute");
        require(keccak256(bytes(_string(data, 8))) == keccak256(bytes("Ship frontend")), "creatorPromise");
        require(keccak256(bytes(_string(data, 9))) == keccak256(bytes("Deploy contract")), "partnerPromise");
    }

    function _assertPayload(
        Vow vow,
        uint256 vowId,
        string memory creatorProofURI,
        string memory partnerProofURI,
        bytes32 creatorProofHash,
        bytes32 partnerProofHash,
        string memory creatorDisputeReason,
        string memory partnerDisputeReason
    ) internal view {
        bytes memory data = _data(vow, vowId);
        require(keccak256(bytes(_string(data, 10))) == keccak256(bytes(creatorProofURI)), "creatorProofURI");
        require(keccak256(bytes(_string(data, 11))) == keccak256(bytes(partnerProofURI)), "partnerProofURI");
        require(_word(data, 12) == creatorProofHash, "creatorProofHash");
        require(_word(data, 13) == partnerProofHash, "partnerProofHash");
        require(keccak256(bytes(_string(data, 14))) == keccak256(bytes(creatorDisputeReason)), "creatorReason");
        require(keccak256(bytes(_string(data, 15))) == keccak256(bytes(partnerDisputeReason)), "partnerReason");
    }

    function _assertStates(
        Vow vow,
        uint256 vowId,
        Vow.ParticipantStatus creatorStatus,
        Vow.ParticipantStatus partnerStatus,
        Vow.VowStatus status
    ) internal view {
        bytes memory data = _data(vow, vowId);
        require(_participantStatus(data, 16) == creatorStatus, "creatorStatus");
        require(_participantStatus(data, 17) == partnerStatus, "partnerStatus");
        require(_status(data, 18) == status, "status");
    }

    function _assertClaimables(Vow vow, uint256 creator, uint256 partner, uint256 sink, uint256 balance) internal view {
        require(vow.claimable(CREATOR) == creator, "creatorClaimable");
        require(vow.claimable(PARTNER) == partner, "partnerClaimable");
        require(vow.claimable(FAILURE_SINK) == sink, "sinkClaimable");
        require(address(vow).balance == balance, "balance");
    }

    function _assertNoDoubleFinalize(
        Vow vow,
        uint256 vowId,
        bytes memory revertData,
        uint256 creator,
        uint256 partner,
        uint256 sink,
        uint256 balance
    ) internal {
        vm.expectRevert(revertData);
        vm.prank(OTHER);
        vow.finalizeVow(vowId);
        _assertClaimables(vow, creator, partner, sink, balance);
    }

    function _finalizeAndAssert(
        Vow vow,
        uint256 vowId,
        address caller,
        uint256 beforeCreator,
        uint256 beforePartner,
        uint256 beforeSink,
        uint256 expectedCreatorDelta,
        uint256 expectedPartnerDelta,
        uint256 expectedSinkDelta,
        Vow.ParticipantStatus expectedCreatorStatus,
        Vow.ParticipantStatus expectedPartnerStatus,
        Vow.VowStatus expectedStatus,
        uint256 stake,
        string memory creatorProofURI,
        string memory partnerProofURI,
        bytes32 creatorProofHash,
        bytes32 partnerProofHash,
        string memory creatorReason,
        string memory partnerReason
    ) internal {
        uint256 balance = address(vow).balance;
        vm.expectEmit(true, false, false, true);
        emit VowSettled(vowId, expectedCreatorStatus, expectedPartnerStatus);
        vm.prank(caller);
        vow.finalizeVow(vowId);

        _assertClaimables(
            vow,
            beforeCreator + expectedCreatorDelta,
            beforePartner + expectedPartnerDelta,
            beforeSink + expectedSinkDelta,
            balance
        );
        _assertStatic(vow, vowId, stake);
        _assertPayload(
            vow,
            vowId,
            creatorProofURI,
            partnerProofURI,
            creatorProofHash,
            partnerProofHash,
            creatorReason,
            partnerReason
        );
        _assertStates(vow, vowId, expectedCreatorStatus, expectedPartnerStatus, expectedStatus);
        _assertNoDoubleFinalize(
            vow,
            vowId,
            abi.encodeWithSelector(Vow.InvalidVowStatus.selector),
            beforeCreator + expectedCreatorDelta,
            beforePartner + expectedPartnerDelta,
            beforeSink + expectedSinkDelta,
            balance
        );
    }

    function test_ProposedExpiryRefundsCreatorOnlyOnce() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        uint256 vowId = _createProposed(vow, STAKE);
        uint256 balance = address(vow).balance;

        vm.expectEmit(true, false, false, true);
        emit VowSettled(vowId, Vow.ParticipantStatus.PENDING, Vow.ParticipantStatus.PENDING);
        vm.warp(1_011);
        vm.prank(OTHER);
        vow.finalizeVow(vowId);

        _assertClaimables(vow, STAKE, 0, 0, balance);
        _assertStatic(vow, vowId, STAKE);
        _assertPayload(vow, vowId, "", "", bytes32(0), bytes32(0), "", "");
        _assertStates(vow, vowId, Vow.ParticipantStatus.PENDING, Vow.ParticipantStatus.PENDING, Vow.VowStatus.SETTLED);
        _assertNoDoubleFinalize(vow, vowId, abi.encodeWithSelector(Vow.InvalidVowStatus.selector), STAKE, 0, 0, balance);
    }

    function test_SettlementSuccessSuccess() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        uint256 vowId = _createAccepted(vow, STAKE);
        _submit(vow, CREATOR, vowId, "https://example.com/creator-proof");
        _submit(vow, PARTNER, vowId, "https://example.com/partner-proof");
        _review(vow, PARTNER, vowId, CREATOR, true, "");
        _review(vow, CREATOR, vowId, PARTNER, true, "");
        _finalizeAndAssert(
            vow,
            vowId,
            OTHER,
            0,
            0,
            0,
            STAKE,
            STAKE,
            0,
            Vow.ParticipantStatus.SUCCESS,
            Vow.ParticipantStatus.SUCCESS,
            Vow.VowStatus.SETTLED,
            STAKE,
            "https://example.com/creator-proof",
            "https://example.com/partner-proof",
            keccak256(bytes("https://example.com/creator-proof")),
            keccak256(bytes("https://example.com/partner-proof")),
            "",
            ""
        );
    }

    function test_SettlementSuccessFailed() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        uint256 vowId = _createAccepted(vow, STAKE);
        _submit(vow, CREATOR, vowId, "https://example.com/creator-proof");
        _review(vow, PARTNER, vowId, CREATOR, true, "");
        vm.warp(1_021);
        _finalizeAndAssert(
            vow,
            vowId,
            OTHER,
            0,
            0,
            0,
            2 * STAKE,
            0,
            0,
            Vow.ParticipantStatus.SUCCESS,
            Vow.ParticipantStatus.FAILED,
            Vow.VowStatus.SETTLED,
            STAKE,
            "https://example.com/creator-proof",
            "",
            keccak256(bytes("https://example.com/creator-proof")),
            bytes32(0),
            "",
            ""
        );
    }

    function test_SettlementFailedSuccess() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        uint256 vowId = _createAccepted(vow, STAKE);
        _submit(vow, PARTNER, vowId, "https://example.com/partner-proof");
        _review(vow, CREATOR, vowId, PARTNER, true, "");
        vm.warp(1_021);
        _finalizeAndAssert(
            vow,
            vowId,
            OTHER,
            0,
            0,
            0,
            0,
            2 * STAKE,
            0,
            Vow.ParticipantStatus.FAILED,
            Vow.ParticipantStatus.SUCCESS,
            Vow.VowStatus.SETTLED,
            STAKE,
            "",
            "https://example.com/partner-proof",
            bytes32(0),
            keccak256(bytes("https://example.com/partner-proof")),
            "",
            ""
        );
    }

    function test_SettlementFailedFailed() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        uint256 vowId = _createAccepted(vow, STAKE);
        vm.warp(1_021);
        _finalizeAndAssert(
            vow,
            vowId,
            OTHER,
            0,
            0,
            0,
            0,
            0,
            2 * STAKE,
            Vow.ParticipantStatus.FAILED,
            Vow.ParticipantStatus.FAILED,
            Vow.VowStatus.SETTLED,
            STAKE,
            "",
            "",
            bytes32(0),
            bytes32(0),
            "",
            ""
        );
    }

    function test_SettlementSuccessUnresolved() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        uint256 vowId = _createAccepted(vow, STAKE);
        _submit(vow, CREATOR, vowId, "https://example.com/creator-proof");
        _submit(vow, PARTNER, vowId, "https://example.com/partner-proof");
        _review(vow, PARTNER, vowId, CREATOR, true, "");
        _review(vow, CREATOR, vowId, PARTNER, false, "late delivery");
        vm.warp(1_041);
        _finalizeAndAssert(
            vow,
            vowId,
            OTHER,
            0,
            0,
            0,
            STAKE,
            STAKE,
            0,
            Vow.ParticipantStatus.SUCCESS,
            Vow.ParticipantStatus.UNRESOLVED,
            Vow.VowStatus.SETTLED,
            STAKE,
            "https://example.com/creator-proof",
            "https://example.com/partner-proof",
            keccak256(bytes("https://example.com/creator-proof")),
            keccak256(bytes("https://example.com/partner-proof")),
            "",
            "late delivery"
        );
    }

    function test_SettlementUnresolvedSuccess() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        uint256 vowId = _createAccepted(vow, STAKE);
        _submit(vow, CREATOR, vowId, "https://example.com/creator-proof");
        _submit(vow, PARTNER, vowId, "https://example.com/partner-proof");
        _review(vow, PARTNER, vowId, CREATOR, false, "bad proof");
        _review(vow, CREATOR, vowId, PARTNER, true, "");
        vm.warp(1_041);
        _finalizeAndAssert(
            vow,
            vowId,
            OTHER,
            0,
            0,
            0,
            STAKE,
            STAKE,
            0,
            Vow.ParticipantStatus.UNRESOLVED,
            Vow.ParticipantStatus.SUCCESS,
            Vow.VowStatus.SETTLED,
            STAKE,
            "https://example.com/creator-proof",
            "https://example.com/partner-proof",
            keccak256(bytes("https://example.com/creator-proof")),
            keccak256(bytes("https://example.com/partner-proof")),
            "bad proof",
            ""
        );
    }

    function test_SettlementFailedUnresolved() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        uint256 vowId = _createAccepted(vow, STAKE);
        _submit(vow, PARTNER, vowId, "https://example.com/partner-proof");
        _review(vow, CREATOR, vowId, PARTNER, false, "bad proof");
        vm.warp(1_041);
        _finalizeAndAssert(
            vow,
            vowId,
            OTHER,
            0,
            0,
            0,
            0,
            STAKE,
            STAKE,
            Vow.ParticipantStatus.FAILED,
            Vow.ParticipantStatus.UNRESOLVED,
            Vow.VowStatus.SETTLED,
            STAKE,
            "",
            "https://example.com/partner-proof",
            bytes32(0),
            keccak256(bytes("https://example.com/partner-proof")),
            "",
            "bad proof"
        );
    }

    function test_SettlementUnresolvedFailed() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        uint256 vowId = _createAccepted(vow, STAKE);
        _submit(vow, CREATOR, vowId, "https://example.com/creator-proof");
        _review(vow, PARTNER, vowId, CREATOR, false, "bad proof");
        vm.warp(1_041);
        _finalizeAndAssert(
            vow,
            vowId,
            OTHER,
            0,
            0,
            0,
            STAKE,
            0,
            STAKE,
            Vow.ParticipantStatus.UNRESOLVED,
            Vow.ParticipantStatus.FAILED,
            Vow.VowStatus.SETTLED,
            STAKE,
            "https://example.com/creator-proof",
            "",
            keccak256(bytes("https://example.com/creator-proof")),
            bytes32(0),
            "bad proof",
            ""
        );
    }

    function test_SettlementUnresolvedUnresolved() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        uint256 vowId = _createAccepted(vow, STAKE);
        _submit(vow, CREATOR, vowId, "https://example.com/creator-proof");
        _submit(vow, PARTNER, vowId, "https://example.com/partner-proof");
        _review(vow, PARTNER, vowId, CREATOR, false, "bad proof");
        _review(vow, CREATOR, vowId, PARTNER, false, "bad proof");
        vm.warp(1_041);
        _finalizeAndAssert(
            vow,
            vowId,
            OTHER,
            0,
            0,
            0,
            STAKE,
            STAKE,
            0,
            Vow.ParticipantStatus.UNRESOLVED,
            Vow.ParticipantStatus.UNRESOLVED,
            Vow.VowStatus.SETTLED,
            STAKE,
            "https://example.com/creator-proof",
            "https://example.com/partner-proof",
            keccak256(bytes("https://example.com/creator-proof")),
            keccak256(bytes("https://example.com/partner-proof")),
            "bad proof",
            "bad proof"
        );
    }

    function test_FinalizeConsumesPendingTimeoutAfterDelivery() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        uint256 vowId = _createAccepted(vow, STAKE);
        vm.warp(1_021);
        uint256 balance = address(vow).balance;
        vm.prank(OTHER);
        vow.finalizeVow(vowId);
        _assertClaimables(vow, 0, 0, 2 * STAKE, balance);
        _assertStates(vow, vowId, Vow.ParticipantStatus.FAILED, Vow.ParticipantStatus.FAILED, Vow.VowStatus.SETTLED);
    }

    function test_FinalizeConsumesProofSubmittedTimeoutAfterReview() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        uint256 vowId = _createAccepted(vow, STAKE);
        _submit(vow, CREATOR, vowId, "https://example.com/creator-proof");
        _submit(vow, PARTNER, vowId, "https://example.com/partner-proof");
        _review(vow, PARTNER, vowId, CREATOR, true, "");
        vm.warp(1_031);
        uint256 balance = address(vow).balance;
        vm.prank(OTHER);
        vow.finalizeVow(vowId);
        _assertClaimables(vow, STAKE, STAKE, 0, balance);
        _assertStates(vow, vowId, Vow.ParticipantStatus.SUCCESS, Vow.ParticipantStatus.SUCCESS, Vow.VowStatus.SETTLED);
    }

    function test_FinalizeConsumesDisputedTimeoutAfterDispute() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        uint256 vowId = _createAccepted(vow, STAKE);
        _submit(vow, CREATOR, vowId, "https://example.com/creator-proof");
        _review(vow, PARTNER, vowId, CREATOR, false, "bad proof");
        vm.warp(1_041);
        uint256 balance = address(vow).balance;
        vm.prank(OTHER);
        vow.finalizeVow(vowId);
        _assertClaimables(vow, STAKE, 0, STAKE, balance);
        _assertStates(vow, vowId, Vow.ParticipantStatus.UNRESOLVED, Vow.ParticipantStatus.FAILED, Vow.VowStatus.SETTLED);
    }

    function test_FinalizeRevertsWhenVowMissing() public {
        Vow vow = _newVow();
        vm.expectRevert(abi.encodeWithSelector(Vow.InvalidVow.selector));
        vm.prank(OTHER);
        vow.finalizeVow(999);
    }

    function test_FinalizeRevertsWhenAlreadySettled() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        uint256 vowId = _createAccepted(vow, STAKE);
        vm.warp(1_021);
        vm.prank(OTHER);
        vow.finalizeVow(vowId);
        uint256 c = vow.claimable(CREATOR);
        uint256 p = vow.claimable(PARTNER);
        uint256 s = vow.claimable(FAILURE_SINK);
        uint256 balance = address(vow).balance;
        vm.expectRevert(abi.encodeWithSelector(Vow.InvalidVowStatus.selector));
        vm.prank(OTHER);
        vow.finalizeVow(vowId);
        _assertClaimables(vow, c, p, s, balance);
    }

    function test_FinalizeRevertsBeforeDeliveryTimeout() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        uint256 vowId = _createAccepted(vow, STAKE);
        vm.warp(1_019);
        uint256 c = vow.claimable(CREATOR);
        uint256 p = vow.claimable(PARTNER);
        uint256 s = vow.claimable(FAILURE_SINK);
        uint256 balance = address(vow).balance;
        vm.expectRevert(abi.encodeWithSelector(Vow.VowNotReadyForSettlement.selector));
        vm.prank(OTHER);
        vow.finalizeVow(vowId);
        _assertClaimables(vow, c, p, s, balance);
        _assertStates(vow, vowId, Vow.ParticipantStatus.PENDING, Vow.ParticipantStatus.PENDING, Vow.VowStatus.ACTIVE);
    }

    function test_FinalizeRevertsBeforeReviewTimeout() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        uint256 vowId = _createAccepted(vow, STAKE);
        _submit(vow, CREATOR, vowId, "https://example.com/creator-proof");
        vm.warp(1_029);
        uint256 c = vow.claimable(CREATOR);
        uint256 p = vow.claimable(PARTNER);
        uint256 s = vow.claimable(FAILURE_SINK);
        uint256 balance = address(vow).balance;
        vm.expectRevert(abi.encodeWithSelector(Vow.VowNotReadyForSettlement.selector));
        vm.prank(OTHER);
        vow.finalizeVow(vowId);
        _assertClaimables(vow, c, p, s, balance);
        _assertStates(
            vow, vowId, Vow.ParticipantStatus.PROOF_SUBMITTED, Vow.ParticipantStatus.PENDING, Vow.VowStatus.ACTIVE
        );
    }

    function test_FinalizeRevertsBeforeDisputeTimeout() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        uint256 vowId = _createAccepted(vow, STAKE);
        _submit(vow, CREATOR, vowId, "https://example.com/creator-proof");
        _review(vow, PARTNER, vowId, CREATOR, false, "bad proof");
        vm.warp(1_039);
        uint256 c = vow.claimable(CREATOR);
        uint256 p = vow.claimable(PARTNER);
        uint256 s = vow.claimable(FAILURE_SINK);
        uint256 balance = address(vow).balance;
        vm.expectRevert(abi.encodeWithSelector(Vow.VowNotReadyForSettlement.selector));
        vm.prank(OTHER);
        vow.finalizeVow(vowId);
        _assertClaimables(vow, c, p, s, balance);
        _assertStates(vow, vowId, Vow.ParticipantStatus.DISPUTED, Vow.ParticipantStatus.PENDING, Vow.VowStatus.ACTIVE);
    }

    function test_FinalizePermissionlessCallerSameSettlement() public {
        vm.warp(1_000);
        Vow vowCreator = _newVow();
        Vow vowPartner = _newVow();
        Vow vowOther = _newVow();
        uint256 idCreator = _createAccepted(vowCreator, STAKE);
        uint256 idPartner = _createAccepted(vowPartner, STAKE);
        uint256 idOther = _createAccepted(vowOther, STAKE);
        vm.warp(1_021);
        vm.prank(CREATOR);
        vowCreator.finalizeVow(idCreator);
        vm.prank(PARTNER);
        vowPartner.finalizeVow(idPartner);
        vm.prank(OTHER);
        vowOther.finalizeVow(idOther);
        _assertClaimables(vowCreator, 0, 0, 2 * STAKE, 2 * STAKE);
        _assertClaimables(vowPartner, 0, 0, 2 * STAKE, 2 * STAKE);
        _assertClaimables(vowOther, 0, 0, 2 * STAKE, 2 * STAKE);
    }

    function test_CrossVowAccountingUsesRecordedStakeNotBalance() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        uint256 vowA = _createAccepted(vow, STAKE);
        uint256 vowB = _createAcceptedWithDeadlines(vow, BIG_STAKE, 1_050, 1_060, 1_070, 1_080);
        _submit(vow, CREATOR, vowA, "https://example.com/a-creator");
        _submit(vow, PARTNER, vowA, "https://example.com/a-partner");
        _review(vow, PARTNER, vowA, CREATOR, true, "");
        _review(vow, CREATOR, vowA, PARTNER, true, "");
        vm.warp(1_021);
        vm.prank(OTHER);
        vow.finalizeVow(vowA);
        _assertClaimables(vow, STAKE, STAKE, 0, 2 * STAKE + 2 * BIG_STAKE);
        _submit(vow, CREATOR, vowB, "https://example.com/b-creator");
        _submit(vow, PARTNER, vowB, "https://example.com/b-partner");
        _review(vow, PARTNER, vowB, CREATOR, true, "");
        _review(vow, CREATOR, vowB, PARTNER, true, "");
        vm.warp(1_061);
        vm.prank(OTHER);
        vow.finalizeVow(vowB);
        _assertClaimables(vow, STAKE + BIG_STAKE, STAKE + BIG_STAKE, 0, 2 * STAKE + 2 * BIG_STAKE);
    }
}
