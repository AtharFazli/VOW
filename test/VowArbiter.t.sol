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

contract VowArbiterGateTest {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    address constant CREATOR = address(0xA11CE);
    address constant PARTNER = address(0xB0B);
    address constant ARBITER = address(0xC0DE);
    address constant OTHER = address(0xD0D);
    address constant FAILURE_SINK = address(0xFEE1);
    uint256 constant STAKE = 1 ether;

    event DisputeResolved(uint256 indexed vowId, address indexed participant, bool proofValid);

    function _newVow() internal returns (Vow) {
        return new Vow(FAILURE_SINK);
    }

    function _activeVow(uint64 disputeDeadline) internal returns (Vow vow, uint256 vowId) {
        vow = _newVow();
        vm.warp(10_000);
        vm.deal(CREATOR, 2 * STAKE);
        vm.prank(CREATOR);
        vowId = vow.createVow{value: STAKE}(
            PARTNER, ARBITER, "Ship frontend", "Deploy contract", 10_010, 10_020, 10_030, disputeDeadline
        );
        vm.deal(PARTNER, STAKE);
        vm.prank(PARTNER);
        vow.acceptVow{value: STAKE}(vowId);
    }

    function _submitCreatorProof(Vow vow, uint256 vowId) internal returns (string memory uri, bytes32 hash) {
        uri = "https://example.com/creator-proof";
        hash = keccak256(bytes(uri));
        vm.prank(CREATOR);
        vow.submitProof(vowId, uri, hash);
    }

    function _submitPartnerProof(Vow vow, uint256 vowId) internal returns (string memory uri, bytes32 hash) {
        uri = "https://example.com/partner-proof";
        hash = keccak256(bytes(uri));
        vm.prank(PARTNER);
        vow.submitProof(vowId, uri, hash);
    }

    function _disputeCreator(Vow vow, uint256 vowId, string memory reason) internal {
        vm.prank(PARTNER);
        vow.reviewProof(vowId, CREATOR, false, reason);
    }

    function _disputePartner(Vow vow, uint256 vowId, string memory reason) internal {
        vm.prank(CREATOR);
        vow.reviewProof(vowId, PARTNER, false, reason);
    }

    function _approveCreator(Vow vow, uint256 vowId) internal {
        vm.prank(PARTNER);
        vow.reviewProof(vowId, CREATOR, true, "");
    }

    function _approvePartner(Vow vow, uint256 vowId) internal {
        vm.prank(CREATOR);
        vow.reviewProof(vowId, PARTNER, true, "");
    }

    function _resolve(Vow vow, address sender, uint256 vowId, address participant, bool proofValid) internal {
        vm.prank(sender);
        vow.resolveDispute(vowId, participant, proofValid);
    }

    function _vowData(Vow vow, uint256 vowId) internal view returns (bytes memory data) {
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

    function _assertFrozenMeta(Vow vow, uint256 vowId) internal view {
        bytes memory data = _vowData(vow, vowId);
        require(_addr(data, 0) == CREATOR, "creator");
        require(_addr(data, 1) == PARTNER, "partner");
        require(_addr(data, 2) == ARBITER, "arbiter");
        require(_word(data, 3) == bytes32(STAKE), "stake");
        require(_u64(data, 4) == 10_010, "acceptDeadline");
        require(_u64(data, 5) == 10_020, "deliveryDeadline");
        require(_u64(data, 6) == 10_030, "reviewDeadline");
        require(_u64(data, 7) == 10_040, "disputeDeadline");
        require(keccak256(bytes(_string(data, 8))) == keccak256(bytes("Ship frontend")), "creatorPromise");
        require(keccak256(bytes(_string(data, 9))) == keccak256(bytes("Deploy contract")), "partnerPromise");
    }

    function _assertDisputeAccounting(Vow vow) internal view {
        require(address(vow).balance == 2 * STAKE, "balance");
        require(vow.claimable(CREATOR) == 0, "creator claimable");
        require(vow.claimable(PARTNER) == 0, "partner claimable");
    }

    function _assertState(
        Vow vow,
        uint256 vowId,
        Vow.ParticipantStatus creatorStatus,
        Vow.ParticipantStatus partnerStatus,
        Vow.VowStatus status,
        string memory creatorProofURI,
        string memory partnerProofURI,
        bytes32 creatorProofHash,
        bytes32 partnerProofHash,
        string memory creatorDisputeReason,
        string memory partnerDisputeReason
    ) internal view {
        bytes memory data = _vowData(vow, vowId);
        require(keccak256(bytes(_string(data, 10))) == keccak256(bytes(creatorProofURI)), "creatorProofURI");
        require(keccak256(bytes(_string(data, 11))) == keccak256(bytes(partnerProofURI)), "partnerProofURI");
        require(_word(data, 12) == creatorProofHash, "creatorProofHash");
        require(_word(data, 13) == partnerProofHash, "partnerProofHash");
        require(keccak256(bytes(_string(data, 14))) == keccak256(bytes(creatorDisputeReason)), "creatorReason");
        require(keccak256(bytes(_string(data, 15))) == keccak256(bytes(partnerDisputeReason)), "partnerReason");
        require(_participantStatus(data, 16) == creatorStatus, "creatorStatus");
        require(_participantStatus(data, 17) == partnerStatus, "partnerStatus");
        require(_status(data, 18) == status, "status");
    }

    function test_NonexistentVowFails() public {
        Vow vow = _newVow();
        vm.expectRevert(abi.encodeWithSelector(Vow.InvalidVow.selector));
        vm.prank(ARBITER);
        vow.resolveDispute(0, CREATOR, true);
    }

    function test_ProposedVowFails() public {
        Vow vow = _newVow();
        vm.warp(10_000);
        vm.deal(CREATOR, STAKE);
        vm.prank(CREATOR);
        uint256 vowId = vow.createVow{value: STAKE}(
            PARTNER, ARBITER, "Ship frontend", "Deploy contract", 10_010, 10_020, 10_030, 10_040
        );
        vm.expectRevert(abi.encodeWithSelector(Vow.InvalidVowStatus.selector));
        vm.prank(ARBITER);
        vow.resolveDispute(vowId, CREATOR, true);
    }

    function test_TargetPendingFails() public {
        (Vow vow, uint256 vowId) = _activeVow(10_040);
        vm.expectRevert(abi.encodeWithSelector(Vow.NotDisputed.selector));
        vm.prank(ARBITER);
        vow.resolveDispute(vowId, CREATOR, true);
    }

    function test_TargetProofSubmittedFails() public {
        (Vow vow, uint256 vowId) = _activeVow(10_040);
        _submitCreatorProof(vow, vowId);
        vm.expectRevert(abi.encodeWithSelector(Vow.NotDisputed.selector));
        vm.prank(ARBITER);
        vow.resolveDispute(vowId, CREATOR, true);
    }

    function test_TargetSuccessFails() public {
        (Vow vow, uint256 vowId) = _activeVow(10_040);
        _submitCreatorProof(vow, vowId);
        _approveCreator(vow, vowId);
        vm.expectRevert(abi.encodeWithSelector(Vow.NotDisputed.selector));
        vm.prank(ARBITER);
        vow.resolveDispute(vowId, CREATOR, true);
    }

    function test_OnlyDisputedSucceeds() public {
        (Vow vow, uint256 vowId) = _activeVow(10_040);
        _submitCreatorProof(vow, vowId);
        _disputeCreator(vow, vowId, "bad evidence");
        vm.expectEmit(true, true, false, true);
        emit DisputeResolved(vowId, CREATOR, true);
        _resolve(vow, ARBITER, vowId, CREATOR, true);
        _assertFrozenMeta(vow, vowId);
        _assertState(
            vow,
            vowId,
            Vow.ParticipantStatus.SUCCESS,
            Vow.ParticipantStatus.PENDING,
            Vow.VowStatus.ACTIVE,
            "https://example.com/creator-proof",
            "",
            keccak256(bytes("https://example.com/creator-proof")),
            bytes32(0),
            "bad evidence",
            ""
        );
        _assertDisputeAccounting(vow);
    }

    function test_ResolvedDisputeCannotBeResolvedTwice() public {
        (Vow vow, uint256 vowId) = _activeVow(10_040);
        _submitCreatorProof(vow, vowId);
        _disputeCreator(vow, vowId, "bad evidence");
        _resolve(vow, ARBITER, vowId, CREATOR, false);
        vm.expectRevert(abi.encodeWithSelector(Vow.NotDisputed.selector));
        vm.prank(ARBITER);
        vow.resolveDispute(vowId, CREATOR, true);
    }

    function test_ArbiterCanResolveCreatorDispute() public {
        (Vow vow, uint256 vowId) = _activeVow(10_040);
        _submitCreatorProof(vow, vowId);
        _disputeCreator(vow, vowId, "bad evidence");
        _resolve(vow, ARBITER, vowId, CREATOR, true);
        _assertState(
            vow,
            vowId,
            Vow.ParticipantStatus.SUCCESS,
            Vow.ParticipantStatus.PENDING,
            Vow.VowStatus.ACTIVE,
            "https://example.com/creator-proof",
            "",
            keccak256(bytes("https://example.com/creator-proof")),
            bytes32(0),
            "bad evidence",
            ""
        );
        _assertDisputeAccounting(vow);
    }

    function test_ArbiterCanResolvePartnerDispute() public {
        (Vow vow, uint256 vowId) = _activeVow(10_040);
        _submitPartnerProof(vow, vowId);
        _disputePartner(vow, vowId, "bad evidence");
        _resolve(vow, ARBITER, vowId, PARTNER, false);
        _assertState(
            vow,
            vowId,
            Vow.ParticipantStatus.PENDING,
            Vow.ParticipantStatus.FAILED,
            Vow.VowStatus.ACTIVE,
            "",
            "https://example.com/partner-proof",
            bytes32(0),
            keccak256(bytes("https://example.com/partner-proof")),
            "",
            "bad evidence"
        );
        _assertDisputeAccounting(vow);
    }

    function test_CreatorCannotResolve() public {
        (Vow vow, uint256 vowId) = _activeVow(10_040);
        _submitCreatorProof(vow, vowId);
        _disputeCreator(vow, vowId, "bad evidence");
        vm.expectRevert(abi.encodeWithSelector(Vow.Unauthorized.selector));
        vm.prank(CREATOR);
        vow.resolveDispute(vowId, CREATOR, true);
    }

    function test_PartnerCannotResolve() public {
        (Vow vow, uint256 vowId) = _activeVow(10_040);
        _submitCreatorProof(vow, vowId);
        _disputeCreator(vow, vowId, "bad evidence");
        vm.expectRevert(abi.encodeWithSelector(Vow.Unauthorized.selector));
        vm.prank(PARTNER);
        vow.resolveDispute(vowId, CREATOR, true);
    }

    function test_UnrelatedWalletCannotResolve() public {
        (Vow vow, uint256 vowId) = _activeVow(10_040);
        _submitCreatorProof(vow, vowId);
        _disputeCreator(vow, vowId, "bad evidence");
        vm.expectRevert(abi.encodeWithSelector(Vow.Unauthorized.selector));
        vm.prank(OTHER);
        vow.resolveDispute(vowId, CREATOR, true);
    }

    function test_NoArbiterVowCannotBeResolvedByAnyone() public {
        Vow vow = _newVow();
        vm.warp(10_000);
        vm.deal(CREATOR, 2 * STAKE);
        vm.prank(CREATOR);
        uint256 vowId = vow.createVow{value: STAKE}(
            PARTNER, address(0), "Ship frontend", "Deploy contract", 10_010, 10_020, 10_030, 10_040
        );
        vm.deal(PARTNER, STAKE);
        vm.prank(PARTNER);
        vow.acceptVow{value: STAKE}(vowId);
        _submitCreatorProof(vow, vowId);
        _disputeCreator(vow, vowId, "bad evidence");
        vm.expectRevert(abi.encodeWithSelector(Vow.Unauthorized.selector));
        vm.prank(OTHER);
        vow.resolveDispute(vowId, CREATOR, true);
    }

    function test_BeforeDisputeDeadlineSucceeds() public {
        (Vow vow, uint256 vowId) = _activeVow(10_040);
        _submitCreatorProof(vow, vowId);
        _disputeCreator(vow, vowId, "bad evidence");
        vm.warp(10_039);
        _resolve(vow, ARBITER, vowId, CREATOR, true);
    }

    function test_ExactlyAtDisputeDeadlineSucceeds() public {
        (Vow vow, uint256 vowId) = _activeVow(10_040);
        _submitCreatorProof(vow, vowId);
        _disputeCreator(vow, vowId, "bad evidence");
        vm.warp(10_040);
        _resolve(vow, ARBITER, vowId, CREATOR, true);
    }

    function test_AfterDisputeDeadlineFails() public {
        (Vow vow, uint256 vowId) = _activeVow(10_040);
        _submitCreatorProof(vow, vowId);
        _disputeCreator(vow, vowId, "bad evidence");
        vm.warp(10_041);
        vm.expectRevert(abi.encodeWithSelector(Vow.DisputeDeadlinePassed.selector));
        vm.prank(ARBITER);
        vow.resolveDispute(vowId, CREATOR, true);
    }

    function test_ValidResolutionEventIsCorrect() public {
        (Vow vow, uint256 vowId) = _activeVow(10_040);
        _submitCreatorProof(vow, vowId);
        _disputeCreator(vow, vowId, "bad evidence");
        vm.expectEmit(true, true, false, true);
        emit DisputeResolved(vowId, CREATOR, true);
        _resolve(vow, ARBITER, vowId, CREATOR, true);
    }

    function test_InvalidResolutionEventIsCorrect() public {
        (Vow vow, uint256 vowId) = _activeVow(10_040);
        _submitCreatorProof(vow, vowId);
        _disputeCreator(vow, vowId, "bad evidence");
        vm.expectEmit(true, true, false, true);
        emit DisputeResolved(vowId, CREATOR, false);
        _resolve(vow, ARBITER, vowId, CREATOR, false);
    }
}
