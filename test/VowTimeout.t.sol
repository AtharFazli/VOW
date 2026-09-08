// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Vow as VowContract} from "../src/Vow.sol";

interface Vm {
    function deal(address who, uint256 newBalance) external;
    function prank(address who) external;
    function warp(uint256 newTimestamp) external;
}

contract VowTimeoutHarness is VowContract {
    constructor(address failureSink_) VowContract(failureSink_) {}

    function triggerTimeoutResolution(uint256 vowId) external {
        Vow storage vow = vows[vowId];
        _resolveParticipantTimeouts(vow);
    }
}

contract VowTimeoutTest {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    address private constant CREATOR = address(0x1001);
    address private constant PARTNER = address(0x1002);
    address private constant ARBITER = address(0x1003);
    address private constant FAILURE_SINK = address(0x1004);
    uint256 private constant STAKE = 1 ether;

    uint64 private constant ACCEPT_DEADLINE = 1_010;
    uint64 private constant DELIVERY_DEADLINE = 1_020;
    uint64 private constant REVIEW_DEADLINE = 1_030;
    uint64 private constant DISPUTE_DEADLINE = 1_040;

    function _newVow() internal returns (VowTimeoutHarness) {
        return new VowTimeoutHarness(FAILURE_SINK);
    }

    function _acceptedVow() internal returns (VowTimeoutHarness vow, uint256 vowId) {
        vow = _newVow();
        vm.warp(1_000);
        vm.deal(CREATOR, STAKE);
        vm.prank(CREATOR);
        vowId = vow.createVow{value: STAKE}(
            PARTNER,
            ARBITER,
            "Ship frontend",
            "Deploy contract",
            ACCEPT_DEADLINE,
            DELIVERY_DEADLINE,
            REVIEW_DEADLINE,
            DISPUTE_DEADLINE
        );
        vm.warp(1_001);
        vm.deal(PARTNER, STAKE);
        vm.prank(PARTNER);
        vow.acceptVow{value: STAKE}(vowId);
    }

    function _assertSnapshot(
        VowTimeoutHarness vow,
        uint256 vowId,
        address expectedCreator,
        address expectedPartner,
        address expectedArbiter,
        uint256 expectedStake,
        uint64 expectedAcceptDeadline,
        uint64 expectedDeliveryDeadline,
        uint64 expectedReviewDeadline,
        uint64 expectedDisputeDeadline,
        string memory expectedCreatorPromise,
        string memory expectedPartnerPromise,
        string memory expectedCreatorProofURI,
        string memory expectedPartnerProofURI,
        bytes32 expectedCreatorProofHash,
        bytes32 expectedPartnerProofHash,
        string memory expectedCreatorReason,
        string memory expectedPartnerReason,
        VowContract.ParticipantStatus expectedCreatorStatus,
        VowContract.ParticipantStatus expectedPartnerStatus,
        VowContract.VowStatus expectedStatus,
        uint256 expectedBalance
    ) internal view {
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
            string memory partnerPromise,
            string memory creatorProofURI,
            string memory partnerProofURI,
            bytes32 creatorProofHash,
            bytes32 partnerProofHash,
            string memory creatorReason,
            string memory partnerReason,
            VowContract.ParticipantStatus creatorStatus,
            VowContract.ParticipantStatus partnerStatus,
            VowContract.VowStatus status
        ) = vow.vows(vowId);

        require(creator == expectedCreator, "creator");
        require(partner == expectedPartner, "partner");
        require(arbiter == expectedArbiter, "arbiter");
        require(stake == expectedStake, "stake");
        require(acceptDeadline == expectedAcceptDeadline, "acceptDeadline");
        require(deliveryDeadline == expectedDeliveryDeadline, "deliveryDeadline");
        require(reviewDeadline == expectedReviewDeadline, "reviewDeadline");
        require(disputeDeadline == expectedDisputeDeadline, "disputeDeadline");
        require(keccak256(bytes(creatorPromise)) == keccak256(bytes(expectedCreatorPromise)), "creatorPromise");
        require(keccak256(bytes(partnerPromise)) == keccak256(bytes(expectedPartnerPromise)), "partnerPromise");
        require(keccak256(bytes(creatorProofURI)) == keccak256(bytes(expectedCreatorProofURI)), "creatorProofURI");
        require(keccak256(bytes(partnerProofURI)) == keccak256(bytes(expectedPartnerProofURI)), "partnerProofURI");
        require(creatorProofHash == expectedCreatorProofHash, "creatorProofHash");
        require(partnerProofHash == expectedPartnerProofHash, "partnerProofHash");
        require(keccak256(bytes(creatorReason)) == keccak256(bytes(expectedCreatorReason)), "creatorReason");
        require(keccak256(bytes(partnerReason)) == keccak256(bytes(expectedPartnerReason)), "partnerReason");
        require(creatorStatus == expectedCreatorStatus, "creatorStatus");
        require(partnerStatus == expectedPartnerStatus, "partnerStatus");
        require(status == expectedStatus, "status");
        require(status != VowContract.VowStatus.SETTLED, "settled");
        require(address(vow).balance == expectedBalance, "balance");
        require(vow.claimable(CREATOR) == 0, "creatorClaimable");
        require(vow.claimable(PARTNER) == 0, "partnerClaimable");
        require(vow.claimable(FAILURE_SINK) == 0, "failureSinkClaimable");
    }

    function test_proposedVowUnaffectedByTimeouts() public {
        VowTimeoutHarness vow = _newVow();
        vm.warp(1_000);
        vm.deal(CREATOR, STAKE);
        vm.prank(CREATOR);
        uint256 vowId = vow.createVow{value: STAKE}(
            PARTNER,
            ARBITER,
            "Ship frontend",
            "Deploy contract",
            ACCEPT_DEADLINE,
            DELIVERY_DEADLINE,
            REVIEW_DEADLINE,
            DISPUTE_DEADLINE
        );

        vm.warp(1_050);
        vow.triggerTimeoutResolution(vowId);

        _assertSnapshot(
            vow,
            vowId,
            CREATOR,
            PARTNER,
            ARBITER,
            STAKE,
            ACCEPT_DEADLINE,
            DELIVERY_DEADLINE,
            REVIEW_DEADLINE,
            DISPUTE_DEADLINE,
            "Ship frontend",
            "Deploy contract",
            "",
            "",
            bytes32(0),
            bytes32(0),
            "",
            "",
            VowContract.ParticipantStatus.PENDING,
            VowContract.ParticipantStatus.PENDING,
            VowContract.VowStatus.PROPOSED,
            STAKE
        );
    }

    function test_deliveryTimeout_promotesPendingToFailed() public {
        (VowTimeoutHarness vow, uint256 vowId) = _acceptedVow();

        vm.warp(1_019);
        vow.triggerTimeoutResolution(vowId);
        _assertSnapshot(
            vow,
            vowId,
            CREATOR,
            PARTNER,
            ARBITER,
            STAKE,
            ACCEPT_DEADLINE,
            DELIVERY_DEADLINE,
            REVIEW_DEADLINE,
            DISPUTE_DEADLINE,
            "Ship frontend",
            "Deploy contract",
            "",
            "",
            bytes32(0),
            bytes32(0),
            "",
            "",
            VowContract.ParticipantStatus.PENDING,
            VowContract.ParticipantStatus.PENDING,
            VowContract.VowStatus.ACTIVE,
            2 * STAKE
        );

        vm.warp(1_020);
        vow.triggerTimeoutResolution(vowId);
        _assertSnapshot(
            vow,
            vowId,
            CREATOR,
            PARTNER,
            ARBITER,
            STAKE,
            ACCEPT_DEADLINE,
            DELIVERY_DEADLINE,
            REVIEW_DEADLINE,
            DISPUTE_DEADLINE,
            "Ship frontend",
            "Deploy contract",
            "",
            "",
            bytes32(0),
            bytes32(0),
            "",
            "",
            VowContract.ParticipantStatus.PENDING,
            VowContract.ParticipantStatus.PENDING,
            VowContract.VowStatus.ACTIVE,
            2 * STAKE
        );

        vm.warp(1_021);
        vow.triggerTimeoutResolution(vowId);
        _assertSnapshot(
            vow,
            vowId,
            CREATOR,
            PARTNER,
            ARBITER,
            STAKE,
            ACCEPT_DEADLINE,
            DELIVERY_DEADLINE,
            REVIEW_DEADLINE,
            DISPUTE_DEADLINE,
            "Ship frontend",
            "Deploy contract",
            "",
            "",
            bytes32(0),
            bytes32(0),
            "",
            "",
            VowContract.ParticipantStatus.FAILED,
            VowContract.ParticipantStatus.FAILED,
            VowContract.VowStatus.ACTIVE,
            2 * STAKE
        );
    }

    function test_reviewTimeout_promotesProofSubmittedToSuccess() public {
        (VowTimeoutHarness vow, uint256 vowId) = _acceptedVow();
        string memory creatorProofURI = "https://example.com/creator-proof";
        string memory partnerProofURI = "https://example.com/partner-proof";
        bytes32 creatorProofHash = keccak256(bytes(creatorProofURI));
        bytes32 partnerProofHash = keccak256(bytes(partnerProofURI));

        vm.warp(1_001);
        vm.prank(CREATOR);
        vow.submitProof(vowId, creatorProofURI, creatorProofHash);
        vm.warp(1_002);
        vm.prank(PARTNER);
        vow.submitProof(vowId, partnerProofURI, partnerProofHash);

        vm.warp(1_029);
        vow.triggerTimeoutResolution(vowId);
        _assertSnapshot(
            vow,
            vowId,
            CREATOR,
            PARTNER,
            ARBITER,
            STAKE,
            ACCEPT_DEADLINE,
            DELIVERY_DEADLINE,
            REVIEW_DEADLINE,
            DISPUTE_DEADLINE,
            "Ship frontend",
            "Deploy contract",
            creatorProofURI,
            partnerProofURI,
            creatorProofHash,
            partnerProofHash,
            "",
            "",
            VowContract.ParticipantStatus.PROOF_SUBMITTED,
            VowContract.ParticipantStatus.PROOF_SUBMITTED,
            VowContract.VowStatus.ACTIVE,
            2 * STAKE
        );

        vm.warp(1_030);
        vow.triggerTimeoutResolution(vowId);
        _assertSnapshot(
            vow,
            vowId,
            CREATOR,
            PARTNER,
            ARBITER,
            STAKE,
            ACCEPT_DEADLINE,
            DELIVERY_DEADLINE,
            REVIEW_DEADLINE,
            DISPUTE_DEADLINE,
            "Ship frontend",
            "Deploy contract",
            creatorProofURI,
            partnerProofURI,
            creatorProofHash,
            partnerProofHash,
            "",
            "",
            VowContract.ParticipantStatus.PROOF_SUBMITTED,
            VowContract.ParticipantStatus.PROOF_SUBMITTED,
            VowContract.VowStatus.ACTIVE,
            2 * STAKE
        );

        vm.warp(1_031);
        vow.triggerTimeoutResolution(vowId);
        _assertSnapshot(
            vow,
            vowId,
            CREATOR,
            PARTNER,
            ARBITER,
            STAKE,
            ACCEPT_DEADLINE,
            DELIVERY_DEADLINE,
            REVIEW_DEADLINE,
            DISPUTE_DEADLINE,
            "Ship frontend",
            "Deploy contract",
            creatorProofURI,
            partnerProofURI,
            creatorProofHash,
            partnerProofHash,
            "",
            "",
            VowContract.ParticipantStatus.SUCCESS,
            VowContract.ParticipantStatus.SUCCESS,
            VowContract.VowStatus.ACTIVE,
            2 * STAKE
        );
    }

    function test_disputeTimeout_promotesDisputedToUnresolved() public {
        (VowTimeoutHarness vow, uint256 vowId) = _acceptedVow();
        string memory creatorProofURI = "https://example.com/creator-proof";
        string memory partnerProofURI = "https://example.com/partner-proof";
        bytes32 creatorProofHash = keccak256(bytes(creatorProofURI));
        bytes32 partnerProofHash = keccak256(bytes(partnerProofURI));

        vm.warp(1_001);
        vm.prank(CREATOR);
        vow.submitProof(vowId, creatorProofURI, creatorProofHash);
        vm.prank(PARTNER);
        vow.reviewProof(vowId, CREATOR, true, "");
        vm.warp(1_002);
        vm.prank(PARTNER);
        vow.submitProof(vowId, partnerProofURI, partnerProofHash);
        vm.prank(CREATOR);
        vow.reviewProof(vowId, PARTNER, false, "bad evidence");

        vm.warp(1_040);
        vow.triggerTimeoutResolution(vowId);
        _assertSnapshot(
            vow,
            vowId,
            CREATOR,
            PARTNER,
            ARBITER,
            STAKE,
            ACCEPT_DEADLINE,
            DELIVERY_DEADLINE,
            REVIEW_DEADLINE,
            DISPUTE_DEADLINE,
            "Ship frontend",
            "Deploy contract",
            creatorProofURI,
            partnerProofURI,
            creatorProofHash,
            partnerProofHash,
            "",
            "bad evidence",
            VowContract.ParticipantStatus.SUCCESS,
            VowContract.ParticipantStatus.DISPUTED,
            VowContract.VowStatus.ACTIVE,
            2 * STAKE
        );

        vm.warp(1_041);
        vow.triggerTimeoutResolution(vowId);
        _assertSnapshot(
            vow,
            vowId,
            CREATOR,
            PARTNER,
            ARBITER,
            STAKE,
            ACCEPT_DEADLINE,
            DELIVERY_DEADLINE,
            REVIEW_DEADLINE,
            DISPUTE_DEADLINE,
            "Ship frontend",
            "Deploy contract",
            creatorProofURI,
            partnerProofURI,
            creatorProofHash,
            partnerProofHash,
            "",
            "bad evidence",
            VowContract.ParticipantStatus.SUCCESS,
            VowContract.ParticipantStatus.UNRESOLVED,
            VowContract.VowStatus.ACTIVE,
            2 * STAKE
        );
    }

    function test_terminalStatesRemainStable() public {
        {
            (VowTimeoutHarness vow, uint256 vowId) = _acceptedVow();
            string memory creatorProofURI = "https://example.com/creator-proof";
            string memory partnerProofURI = "https://example.com/partner-proof";
            bytes32 creatorProofHash = keccak256(bytes(creatorProofURI));
            bytes32 partnerProofHash = keccak256(bytes(partnerProofURI));
            vm.warp(1_001);
            vm.prank(CREATOR);
            vow.submitProof(vowId, creatorProofURI, creatorProofHash);
            vm.prank(PARTNER);
            vow.reviewProof(vowId, CREATOR, true, "");
            vm.prank(PARTNER);
            vow.submitProof(vowId, partnerProofURI, partnerProofHash);
            vm.prank(CREATOR);
            vow.reviewProof(vowId, PARTNER, true, "");
            vm.warp(1_050);
            vow.triggerTimeoutResolution(vowId);
            _assertSnapshot(
                vow,
                vowId,
                CREATOR,
                PARTNER,
                ARBITER,
                STAKE,
                ACCEPT_DEADLINE,
                DELIVERY_DEADLINE,
                REVIEW_DEADLINE,
                DISPUTE_DEADLINE,
                "Ship frontend",
                "Deploy contract",
                creatorProofURI,
                partnerProofURI,
                creatorProofHash,
                partnerProofHash,
                "",
                "",
                VowContract.ParticipantStatus.SUCCESS,
                VowContract.ParticipantStatus.SUCCESS,
                VowContract.VowStatus.ACTIVE,
                2 * STAKE
            );
            vm.warp(1_060);
            vow.triggerTimeoutResolution(vowId);
            _assertSnapshot(
                vow,
                vowId,
                CREATOR,
                PARTNER,
                ARBITER,
                STAKE,
                ACCEPT_DEADLINE,
                DELIVERY_DEADLINE,
                REVIEW_DEADLINE,
                DISPUTE_DEADLINE,
                "Ship frontend",
                "Deploy contract",
                creatorProofURI,
                partnerProofURI,
                creatorProofHash,
                partnerProofHash,
                "",
                "",
                VowContract.ParticipantStatus.SUCCESS,
                VowContract.ParticipantStatus.SUCCESS,
                VowContract.VowStatus.ACTIVE,
                2 * STAKE
            );
        }

        {
            (VowTimeoutHarness vow, uint256 vowId) = _acceptedVow();
            string memory creatorProofURI = "https://example.com/creator-proof";
            bytes32 creatorProofHash = keccak256(bytes(creatorProofURI));
            vm.warp(1_001);
            vm.prank(CREATOR);
            vow.submitProof(vowId, creatorProofURI, creatorProofHash);
            vm.prank(PARTNER);
            vow.reviewProof(vowId, CREATOR, true, "");
            vm.warp(1_021);
            vow.triggerTimeoutResolution(vowId);
            _assertSnapshot(
                vow,
                vowId,
                CREATOR,
                PARTNER,
                ARBITER,
                STAKE,
                ACCEPT_DEADLINE,
                DELIVERY_DEADLINE,
                REVIEW_DEADLINE,
                DISPUTE_DEADLINE,
                "Ship frontend",
                "Deploy contract",
                creatorProofURI,
                "",
                creatorProofHash,
                bytes32(0),
                "",
                "",
                VowContract.ParticipantStatus.SUCCESS,
                VowContract.ParticipantStatus.FAILED,
                VowContract.VowStatus.ACTIVE,
                2 * STAKE
            );
            vm.warp(1_060);
            vow.triggerTimeoutResolution(vowId);
            _assertSnapshot(
                vow,
                vowId,
                CREATOR,
                PARTNER,
                ARBITER,
                STAKE,
                ACCEPT_DEADLINE,
                DELIVERY_DEADLINE,
                REVIEW_DEADLINE,
                DISPUTE_DEADLINE,
                "Ship frontend",
                "Deploy contract",
                creatorProofURI,
                "",
                creatorProofHash,
                bytes32(0),
                "",
                "",
                VowContract.ParticipantStatus.SUCCESS,
                VowContract.ParticipantStatus.FAILED,
                VowContract.VowStatus.ACTIVE,
                2 * STAKE
            );
        }

        {
            (VowTimeoutHarness vow, uint256 vowId) = _acceptedVow();
            string memory partnerProofURI = "https://example.com/partner-proof";
            bytes32 partnerProofHash = keccak256(bytes(partnerProofURI));
            vm.warp(1_001);
            vm.prank(PARTNER);
            vow.submitProof(vowId, partnerProofURI, partnerProofHash);
            vm.prank(CREATOR);
            vow.reviewProof(vowId, PARTNER, true, "");
            vm.warp(1_021);
            vow.triggerTimeoutResolution(vowId);
            _assertSnapshot(
                vow,
                vowId,
                CREATOR,
                PARTNER,
                ARBITER,
                STAKE,
                ACCEPT_DEADLINE,
                DELIVERY_DEADLINE,
                REVIEW_DEADLINE,
                DISPUTE_DEADLINE,
                "Ship frontend",
                "Deploy contract",
                "",
                partnerProofURI,
                bytes32(0),
                partnerProofHash,
                "",
                "",
                VowContract.ParticipantStatus.FAILED,
                VowContract.ParticipantStatus.SUCCESS,
                VowContract.VowStatus.ACTIVE,
                2 * STAKE
            );
            vm.warp(1_060);
            vow.triggerTimeoutResolution(vowId);
            _assertSnapshot(
                vow,
                vowId,
                CREATOR,
                PARTNER,
                ARBITER,
                STAKE,
                ACCEPT_DEADLINE,
                DELIVERY_DEADLINE,
                REVIEW_DEADLINE,
                DISPUTE_DEADLINE,
                "Ship frontend",
                "Deploy contract",
                "",
                partnerProofURI,
                bytes32(0),
                partnerProofHash,
                "",
                "",
                VowContract.ParticipantStatus.FAILED,
                VowContract.ParticipantStatus.SUCCESS,
                VowContract.VowStatus.ACTIVE,
                2 * STAKE
            );
        }

        {
            (VowTimeoutHarness vow, uint256 vowId) = _acceptedVow();
            vm.warp(1_021);
            vow.triggerTimeoutResolution(vowId);
            _assertSnapshot(
                vow,
                vowId,
                CREATOR,
                PARTNER,
                ARBITER,
                STAKE,
                ACCEPT_DEADLINE,
                DELIVERY_DEADLINE,
                REVIEW_DEADLINE,
                DISPUTE_DEADLINE,
                "Ship frontend",
                "Deploy contract",
                "",
                "",
                bytes32(0),
                bytes32(0),
                "",
                "",
                VowContract.ParticipantStatus.FAILED,
                VowContract.ParticipantStatus.FAILED,
                VowContract.VowStatus.ACTIVE,
                2 * STAKE
            );
            vm.warp(1_060);
            vow.triggerTimeoutResolution(vowId);
            _assertSnapshot(
                vow,
                vowId,
                CREATOR,
                PARTNER,
                ARBITER,
                STAKE,
                ACCEPT_DEADLINE,
                DELIVERY_DEADLINE,
                REVIEW_DEADLINE,
                DISPUTE_DEADLINE,
                "Ship frontend",
                "Deploy contract",
                "",
                "",
                bytes32(0),
                bytes32(0),
                "",
                "",
                VowContract.ParticipantStatus.FAILED,
                VowContract.ParticipantStatus.FAILED,
                VowContract.VowStatus.ACTIVE,
                2 * STAKE
            );
        }

        {
            (VowTimeoutHarness vow, uint256 vowId) = _acceptedVow();
            string memory creatorProofURI = "https://example.com/creator-proof";
            string memory partnerProofURI = "https://example.com/partner-proof";
            bytes32 creatorProofHash = keccak256(bytes(creatorProofURI));
            bytes32 partnerProofHash = keccak256(bytes(partnerProofURI));
            vm.warp(1_001);
            vm.prank(CREATOR);
            vow.submitProof(vowId, creatorProofURI, creatorProofHash);
            vm.prank(PARTNER);
            vow.reviewProof(vowId, CREATOR, false, "bad evidence");
            vm.warp(1_002);
            vm.prank(PARTNER);
            vow.submitProof(vowId, partnerProofURI, partnerProofHash);
            vm.prank(CREATOR);
            vow.reviewProof(vowId, PARTNER, true, "");
            vm.warp(1_041);
            vow.triggerTimeoutResolution(vowId);
            _assertSnapshot(
                vow,
                vowId,
                CREATOR,
                PARTNER,
                ARBITER,
                STAKE,
                ACCEPT_DEADLINE,
                DELIVERY_DEADLINE,
                REVIEW_DEADLINE,
                DISPUTE_DEADLINE,
                "Ship frontend",
                "Deploy contract",
                creatorProofURI,
                partnerProofURI,
                creatorProofHash,
                partnerProofHash,
                "bad evidence",
                "",
                VowContract.ParticipantStatus.UNRESOLVED,
                VowContract.ParticipantStatus.SUCCESS,
                VowContract.VowStatus.ACTIVE,
                2 * STAKE
            );
            vm.warp(1_060);
            vow.triggerTimeoutResolution(vowId);
            _assertSnapshot(
                vow,
                vowId,
                CREATOR,
                PARTNER,
                ARBITER,
                STAKE,
                ACCEPT_DEADLINE,
                DELIVERY_DEADLINE,
                REVIEW_DEADLINE,
                DISPUTE_DEADLINE,
                "Ship frontend",
                "Deploy contract",
                creatorProofURI,
                partnerProofURI,
                creatorProofHash,
                partnerProofHash,
                "bad evidence",
                "",
                VowContract.ParticipantStatus.UNRESOLVED,
                VowContract.ParticipantStatus.SUCCESS,
                VowContract.VowStatus.ACTIVE,
                2 * STAKE
            );
        }

        {
            (VowTimeoutHarness vow, uint256 vowId) = _acceptedVow();
            string memory creatorProofURI = "https://example.com/creator-proof";
            string memory partnerProofURI = "https://example.com/partner-proof";
            bytes32 creatorProofHash = keccak256(bytes(creatorProofURI));
            bytes32 partnerProofHash = keccak256(bytes(partnerProofURI));
            vm.warp(1_001);
            vm.prank(CREATOR);
            vow.submitProof(vowId, creatorProofURI, creatorProofHash);
            vm.prank(PARTNER);
            vow.reviewProof(vowId, CREATOR, false, "bad evidence");
            vm.prank(PARTNER);
            vow.submitProof(vowId, partnerProofURI, partnerProofHash);
            vm.prank(CREATOR);
            vow.reviewProof(vowId, PARTNER, false, "bad evidence");
            vm.warp(1_041);
            vow.triggerTimeoutResolution(vowId);
            _assertSnapshot(
                vow,
                vowId,
                CREATOR,
                PARTNER,
                ARBITER,
                STAKE,
                ACCEPT_DEADLINE,
                DELIVERY_DEADLINE,
                REVIEW_DEADLINE,
                DISPUTE_DEADLINE,
                "Ship frontend",
                "Deploy contract",
                creatorProofURI,
                partnerProofURI,
                creatorProofHash,
                partnerProofHash,
                "bad evidence",
                "bad evidence",
                VowContract.ParticipantStatus.UNRESOLVED,
                VowContract.ParticipantStatus.UNRESOLVED,
                VowContract.VowStatus.ACTIVE,
                2 * STAKE
            );
            vm.warp(1_060);
            vow.triggerTimeoutResolution(vowId);
            _assertSnapshot(
                vow,
                vowId,
                CREATOR,
                PARTNER,
                ARBITER,
                STAKE,
                ACCEPT_DEADLINE,
                DELIVERY_DEADLINE,
                REVIEW_DEADLINE,
                DISPUTE_DEADLINE,
                "Ship frontend",
                "Deploy contract",
                creatorProofURI,
                partnerProofURI,
                creatorProofHash,
                partnerProofHash,
                "bad evidence",
                "bad evidence",
                VowContract.ParticipantStatus.UNRESOLVED,
                VowContract.ParticipantStatus.UNRESOLVED,
                VowContract.VowStatus.ACTIVE,
                2 * STAKE
            );
        }
    }
}
