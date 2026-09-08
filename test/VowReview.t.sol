// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../src/Vow.sol";

interface Vm2 {
    function deal(address who, uint256 newBalance) external;
    function prank(address who) external;
    function warp(uint256 newTimestamp) external;
    function expectRevert(bytes calldata revertData) external;
    function expectEmit(bool checkTopic1, bool checkTopic2, bool checkTopic3, bool checkData) external;
}

contract VowReviewGateTest {
    Vm2 constant vm = Vm2(address(uint160(uint256(keccak256("hevm cheat code")))));

    address constant CREATOR = address(0xA11CE);
    address constant PARTNER = address(0xB0B);
    address constant OTHER = address(0xD0D);
    address constant FAILURE_SINK = address(0xFEE1);
    uint256 constant STAKE = 1 ether;

    event ProofApproved(uint256 indexed vowId, address indexed participant, address indexed reviewer);
    event ProofDisputed(uint256 indexed vowId, address indexed participant, address indexed reviewer, string reason);

    function _newVow() internal returns (Vow) {
        return new Vow(FAILURE_SINK);
    }

    function _activeVow() internal returns (Vow vow, uint256 vowId) {
        vm.warp(1_000);
        vow = _newVow();
        vm.deal(CREATOR, STAKE);
        vm.prank(CREATOR);
        vowId = vow.createVow{value: STAKE}(
            PARTNER, address(0), "Ship frontend", "Deploy contract", 1_010, 1_020, 1_030, 1_040
        );
        vm.deal(PARTNER, STAKE);
        vm.prank(PARTNER);
        vow.acceptVow{value: STAKE}(vowId);
    }

    function _submit(Vow vow, address sender, uint256 vowId, string memory proofURI, bytes32 proofHash) internal {
        vm.prank(sender);
        vow.submitProof(vowId, proofURI, proofHash);
    }

    function _review(
        Vow vow,
        address sender,
        uint256 vowId,
        address participant,
        bool approved,
        string memory disputeReason
    ) internal {
        vm.prank(sender);
        vow.reviewProof(vowId, participant, approved, disputeReason);
    }

    function _expectReviewRevert(
        Vow vow,
        address sender,
        uint256 vowId,
        address participant,
        bool approved,
        string memory disputeReason,
        bytes memory revertData
    ) internal {
        vm.expectRevert(revertData);
        vm.prank(sender);
        vow.reviewProof(vowId, participant, approved, disputeReason);
    }

    function _state(Vow vow, uint256 vowId)
        internal
        view
        returns (
            address creator,
            address partner,
            address arbiter,
            uint256 stake,
            uint64 acceptDeadline,
            uint64 deliveryDeadline,
            uint64 reviewDeadline,
            uint64 disputeDeadline,
            string memory creatorPromise,
            string memory partnerPromise,
            string memory creatorProofURI,
            string memory partnerProofURI,
            bytes32 creatorProofHash,
            bytes32 partnerProofHash,
            string memory creatorDisputeReason,
            string memory partnerDisputeReason,
            Vow.ParticipantStatus creatorStatus,
            Vow.ParticipantStatus partnerStatus,
            Vow.VowStatus status
        )
    {
        return vow.vows(vowId);
    }

    function _assertCommon(Vow vow, uint256 vowId) internal view {
        (
            address creator,
            address partner,
            address arbiter,
            uint256 stake,
            uint64 acceptDeadline,
            uint64 deliveryDeadline,
            uint64 reviewDeadline,
            uint64 disputeDeadline,
            string memory creatorPromise,
            string memory partnerPromise,,,,,,,,,
            Vow.VowStatus status
        ) = _state(vow, vowId);

        require(creator == CREATOR, "creator");
        require(partner == PARTNER, "partner");
        require(arbiter == address(0), "arbiter");
        require(stake == STAKE, "stake");
        require(acceptDeadline == 1_010, "acceptDeadline");
        require(deliveryDeadline == 1_020, "deliveryDeadline");
        require(reviewDeadline == 1_030, "reviewDeadline");
        require(disputeDeadline == 1_040, "disputeDeadline");
        require(keccak256(bytes(creatorPromise)) == keccak256(bytes("Ship frontend")), "creatorPromise");
        require(keccak256(bytes(partnerPromise)) == keccak256(bytes("Deploy contract")), "partnerPromise");
        require(status == Vow.VowStatus.ACTIVE, "status");
        require(vow.claimable(CREATOR) == 0, "creatorClaimable");
        require(vow.claimable(PARTNER) == 0, "partnerClaimable");
        require(address(vow).balance == 2 * STAKE, "balance");
    }

    function _assertReviewed(
        Vow vow,
        uint256 vowId,
        bool creatorReviewed,
        Vow.ParticipantStatus expectedStatus,
        string memory proofURI,
        bytes32 proofHash,
        string memory reason
    ) internal view {
        (
            ,,,,,,,,
            string memory creatorPromise,
            string memory partnerPromise,
            string memory creatorProofURI,
            string memory partnerProofURI,
            bytes32 creatorProofHash,
            bytes32 partnerProofHash,
            string memory creatorDisputeReason,
            string memory partnerDisputeReason,
            Vow.ParticipantStatus creatorStatus,
            Vow.ParticipantStatus partnerStatus,
            Vow.VowStatus status
        ) = _state(vow, vowId);

        require(keccak256(bytes(creatorPromise)) == keccak256(bytes("Ship frontend")), "creatorPromise");
        require(keccak256(bytes(partnerPromise)) == keccak256(bytes("Deploy contract")), "partnerPromise");
        require(status == Vow.VowStatus.ACTIVE, "status");
        require(vow.claimable(CREATOR) == 0, "creatorClaimable");
        require(vow.claimable(PARTNER) == 0, "partnerClaimable");
        require(address(vow).balance == 2 * STAKE, "balance");

        if (creatorReviewed) {
            require(keccak256(bytes(creatorProofURI)) == keccak256(bytes(proofURI)), "creatorProofURI");
            require(creatorProofHash == proofHash, "creatorProofHash");
            require(creatorStatus == expectedStatus, "creatorStatus");
            require(bytes(partnerProofURI).length == 0, "partnerProofURI");
            require(partnerProofHash == bytes32(0), "partnerProofHash");
            require(bytes(partnerDisputeReason).length == 0, "partnerDisputeReason");
            require(partnerStatus == Vow.ParticipantStatus.PENDING, "partnerStatus");
            if (expectedStatus == Vow.ParticipantStatus.DISPUTED) {
                require(keccak256(bytes(creatorDisputeReason)) == keccak256(bytes(reason)), "creatorDisputeReason");
            } else {
                require(bytes(creatorDisputeReason).length == 0, "creatorDisputeReason");
            }
        } else {
            require(bytes(creatorProofURI).length == 0, "creatorProofURI");
            require(creatorProofHash == bytes32(0), "creatorProofHash");
            require(bytes(creatorDisputeReason).length == 0, "creatorDisputeReason");
            require(creatorStatus == Vow.ParticipantStatus.PENDING, "creatorStatus");
            require(keccak256(bytes(partnerProofURI)) == keccak256(bytes(proofURI)), "partnerProofURI");
            require(partnerProofHash == proofHash, "partnerProofHash");
            require(partnerStatus == expectedStatus, "partnerStatus");
            if (expectedStatus == Vow.ParticipantStatus.DISPUTED) {
                require(keccak256(bytes(partnerDisputeReason)) == keccak256(bytes(reason)), "partnerDisputeReason");
            } else {
                require(bytes(partnerDisputeReason).length == 0, "partnerDisputeReason");
            }
        }
    }

    function test_CreatorCanReviewPartnerProof() public {
        (Vow vow, uint256 vowId) = _activeVow();
        vm.warp(1_019);
        string memory proofURI = "https://example.com/partner-proof";
        bytes32 proofHash = keccak256(bytes(proofURI));
        _submit(vow, PARTNER, vowId, proofURI, proofHash);
        vm.expectEmit(true, true, true, false);
        emit ProofApproved(vowId, PARTNER, CREATOR);
        _review(vow, CREATOR, vowId, PARTNER, true, "");
        _assertReviewed(vow, vowId, false, Vow.ParticipantStatus.SUCCESS, proofURI, proofHash, "");
    }

    function test_PartnerCanReviewCreatorProof() public {
        (Vow vow, uint256 vowId) = _activeVow();
        vm.warp(1_019);
        string memory proofURI = "https://example.com/creator-proof";
        bytes32 proofHash = keccak256(bytes(proofURI));
        _submit(vow, CREATOR, vowId, proofURI, proofHash);
        vm.expectEmit(true, true, true, false);
        emit ProofApproved(vowId, CREATOR, PARTNER);
        _review(vow, PARTNER, vowId, CREATOR, true, "");
        _assertReviewed(vow, vowId, true, Vow.ParticipantStatus.SUCCESS, proofURI, proofHash, "");
    }

    function test_CreatorCannotReviewOwnProof() public {
        (Vow vow, uint256 vowId) = _activeVow();
        vm.warp(1_019);
        string memory proofURI = "https://example.com/creator-proof";
        bytes32 proofHash = keccak256(bytes(proofURI));
        _submit(vow, CREATOR, vowId, proofURI, proofHash);
        _expectReviewRevert(vow, CREATOR, vowId, CREATOR, true, "", abi.encodeWithSelector(Vow.Unauthorized.selector));
    }

    function test_PartnerCannotReviewOwnProof() public {
        (Vow vow, uint256 vowId) = _activeVow();
        vm.warp(1_019);
        string memory proofURI = "https://example.com/partner-proof";
        bytes32 proofHash = keccak256(bytes(proofURI));
        _submit(vow, PARTNER, vowId, proofURI, proofHash);
        _expectReviewRevert(vow, PARTNER, vowId, PARTNER, true, "", abi.encodeWithSelector(Vow.Unauthorized.selector));
    }

    function test_UnrelatedWalletReviewsCreatorProofFails() public {
        (Vow vow, uint256 vowId) = _activeVow();
        vm.warp(1_019);
        string memory proofURI = "https://example.com/creator-proof";
        bytes32 proofHash = keccak256(bytes(proofURI));
        _submit(vow, CREATOR, vowId, proofURI, proofHash);
        _expectReviewRevert(vow, OTHER, vowId, CREATOR, true, "", abi.encodeWithSelector(Vow.Unauthorized.selector));
    }

    function test_UnrelatedWalletReviewsPartnerProofFails() public {
        (Vow vow, uint256 vowId) = _activeVow();
        vm.warp(1_019);
        string memory proofURI = "https://example.com/partner-proof";
        bytes32 proofHash = keccak256(bytes(proofURI));
        _submit(vow, PARTNER, vowId, proofURI, proofHash);
        _expectReviewRevert(vow, OTHER, vowId, PARTNER, true, "", abi.encodeWithSelector(Vow.Unauthorized.selector));
    }

    function test_NonexistentVowFails() public {
        Vow vow = _newVow();
        _expectReviewRevert(vow, CREATOR, 999, PARTNER, true, "", abi.encodeWithSelector(Vow.InvalidVow.selector));
    }

    function test_ProposedVowFails() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        vm.deal(CREATOR, STAKE);
        vm.prank(CREATOR);
        uint256 vowId = vow.createVow{value: STAKE}(
            PARTNER, address(0), "Ship frontend", "Deploy contract", 1_010, 1_020, 1_030, 1_040
        );
        _expectReviewRevert(
            vow, PARTNER, vowId, CREATOR, true, "", abi.encodeWithSelector(Vow.InvalidVowStatus.selector)
        );
    }

    function test_TargetPendingFails() public {
        (Vow vow, uint256 vowId) = _activeVow();
        _expectReviewRevert(
            vow, CREATOR, vowId, PARTNER, true, "", abi.encodeWithSelector(Vow.ProofNotSubmitted.selector)
        );
    }

    function test_SuccessTargetCannotBeReviewedAgain() public {
        (Vow vow, uint256 vowId) = _activeVow();
        vm.warp(1_019);
        string memory proofURI = "https://example.com/partner-proof";
        bytes32 proofHash = keccak256(bytes(proofURI));
        _submit(vow, PARTNER, vowId, proofURI, proofHash);
        _review(vow, CREATOR, vowId, PARTNER, true, "");
        _expectReviewRevert(
            vow, CREATOR, vowId, PARTNER, true, "", abi.encodeWithSelector(Vow.AlreadyReviewed.selector)
        );
    }

    function test_DisputedTargetCannotBeReviewedAgain() public {
        (Vow vow, uint256 vowId) = _activeVow();
        vm.warp(1_019);
        string memory proofURI = "https://example.com/creator-proof";
        bytes32 proofHash = keccak256(bytes(proofURI));
        _submit(vow, CREATOR, vowId, proofURI, proofHash);
        _review(vow, PARTNER, vowId, CREATOR, false, "bad proof");
        _expectReviewRevert(
            vow, PARTNER, vowId, CREATOR, true, "", abi.encodeWithSelector(Vow.AlreadyReviewed.selector)
        );
    }

    function test_BeforeReviewDeadlineSucceeds() public {
        (Vow vow, uint256 vowId) = _activeVow();
        vm.warp(1_019);
        string memory proofURI = "https://example.com/creator-proof";
        bytes32 proofHash = keccak256(bytes(proofURI));
        _submit(vow, CREATOR, vowId, proofURI, proofHash);
        _review(vow, PARTNER, vowId, CREATOR, true, "");
        _assertReviewed(vow, vowId, true, Vow.ParticipantStatus.SUCCESS, proofURI, proofHash, "");
    }

    function test_ExactlyAtReviewDeadlineSucceeds() public {
        (Vow vow, uint256 vowId) = _activeVow();
        vm.warp(1_019);
        string memory proofURI = "https://example.com/partner-proof";
        bytes32 proofHash = keccak256(bytes(proofURI));
        _submit(vow, PARTNER, vowId, proofURI, proofHash);
        vm.warp(1_030);
        _review(vow, CREATOR, vowId, PARTNER, true, "");
        _assertReviewed(vow, vowId, false, Vow.ParticipantStatus.SUCCESS, proofURI, proofHash, "");
    }

    function test_AfterReviewDeadlineFails() public {
        (Vow vow, uint256 vowId) = _activeVow();
        vm.warp(1_019);
        string memory proofURI = "https://example.com/creator-proof";
        bytes32 proofHash = keccak256(bytes(proofURI));
        _submit(vow, CREATOR, vowId, proofURI, proofHash);
        vm.warp(1_031);
        _expectReviewRevert(
            vow, PARTNER, vowId, CREATOR, true, "", abi.encodeWithSelector(Vow.ReviewDeadlinePassed.selector)
        );
    }

    function test_ApproveLeavesVowActiveAndMoneyUntouched() public {
        (Vow vow, uint256 vowId) = _activeVow();
        vm.warp(1_019);
        string memory proofURI = "https://example.com/creator-proof";
        bytes32 proofHash = keccak256(bytes(proofURI));
        _submit(vow, CREATOR, vowId, proofURI, proofHash);
        _review(vow, PARTNER, vowId, CREATOR, true, "");
        _assertReviewed(vow, vowId, true, Vow.ParticipantStatus.SUCCESS, proofURI, proofHash, "");
    }

    function test_DisputeLeavesVowActiveAndMoneyUntouched() public {
        (Vow vow, uint256 vowId) = _activeVow();
        vm.warp(1_019);
        string memory proofURI = "https://example.com/partner-proof";
        bytes32 proofHash = keccak256(bytes(proofURI));
        _submit(vow, PARTNER, vowId, proofURI, proofHash);
        _review(vow, CREATOR, vowId, PARTNER, false, "late delivery");
        _assertReviewed(vow, vowId, false, Vow.ParticipantStatus.DISPUTED, proofURI, proofHash, "late delivery");
    }

    function test_EmptyDisputeReasonFails() public {
        (Vow vow, uint256 vowId) = _activeVow();
        vm.warp(1_019);
        string memory proofURI = "https://example.com/partner-proof";
        bytes32 proofHash = keccak256(bytes(proofURI));
        _submit(vow, PARTNER, vowId, proofURI, proofHash);
        _expectReviewRevert(
            vow, CREATOR, vowId, PARTNER, false, "", abi.encodeWithSelector(Vow.EmptyDisputeReason.selector)
        );
    }

    function test_CreatorDisputeEventAndReasonStored() public {
        (Vow vow, uint256 vowId) = _activeVow();
        vm.warp(1_019);
        string memory proofURI = "https://example.com/partner-proof";
        bytes32 proofHash = keccak256(bytes(proofURI));
        _submit(vow, PARTNER, vowId, proofURI, proofHash);
        string memory reason = "proof missing screenshot";
        vm.expectEmit(true, true, true, true);
        emit ProofDisputed(vowId, PARTNER, CREATOR, reason);
        _review(vow, CREATOR, vowId, PARTNER, false, reason);
        _assertReviewed(vow, vowId, false, Vow.ParticipantStatus.DISPUTED, proofURI, proofHash, reason);
    }

    function test_PartnerDisputeEventAndReasonStored() public {
        (Vow vow, uint256 vowId) = _activeVow();
        vm.warp(1_019);
        string memory proofURI = "https://example.com/creator-proof";
        bytes32 proofHash = keccak256(bytes(proofURI));
        _submit(vow, CREATOR, vowId, proofURI, proofHash);
        string memory reason = "deliverable incomplete";
        vm.expectEmit(true, true, true, true);
        emit ProofDisputed(vowId, CREATOR, PARTNER, reason);
        _review(vow, PARTNER, vowId, CREATOR, false, reason);
        _assertReviewed(vow, vowId, true, Vow.ParticipantStatus.DISPUTED, proofURI, proofHash, reason);
    }

    function test_ProofApprovedEventIsCorrect() public {
        (Vow vow, uint256 vowId) = _activeVow();
        vm.warp(1_019);
        string memory proofURI = "https://example.com/creator-proof";
        bytes32 proofHash = keccak256(bytes(proofURI));
        _submit(vow, CREATOR, vowId, proofURI, proofHash);
        vm.expectEmit(true, true, true, false);
        emit ProofApproved(vowId, CREATOR, PARTNER);
        _review(vow, PARTNER, vowId, CREATOR, true, "");
    }
}
