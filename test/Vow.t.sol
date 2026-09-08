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

contract VowCreateTest {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    address constant CREATOR = address(0xA11CE);
    address constant PARTNER = address(0xB0B);
    address constant PARTNER_2 = address(0xB0C);
    address constant ARBITER = address(0xC0DE);
    address constant FAILURE_SINK = address(0xFEE1);
    uint256 constant STAKE = 1 ether;

    event VowCreated(
        uint256 indexed vowId, address indexed creator, address indexed partner, uint256 stake, address arbiter
    );

    function _newVow() internal returns (Vow) {
        return new Vow(FAILURE_SINK);
    }

    function _create(
        Vow vow,
        address creator,
        address partner,
        address arbiter,
        uint256 stake,
        string memory creatorPromise,
        string memory partnerPromise,
        uint64 acceptDeadline,
        uint64 deliveryDeadline,
        uint64 reviewDeadline,
        uint64 disputeDeadline
    ) internal returns (uint256 vowId) {
        vm.deal(creator, stake);
        vm.prank(creator);
        vowId = vow.createVow{value: stake}(
            partner,
            arbiter,
            creatorPromise,
            partnerPromise,
            acceptDeadline,
            deliveryDeadline,
            reviewDeadline,
            disputeDeadline
        );
    }

    function _expectCreateRevert(
        bytes memory revertData,
        address partner,
        address arbiter,
        string memory creatorPromise,
        string memory partnerPromise,
        uint64 acceptDeadline,
        uint64 deliveryDeadline,
        uint64 reviewDeadline,
        uint64 disputeDeadline,
        uint256 stake
    ) internal {
        Vow vow = _newVow();
        vm.deal(CREATOR, stake);
        vm.expectRevert(revertData);
        vm.prank(CREATOR);
        vow.createVow{value: stake}(
            partner,
            arbiter,
            creatorPromise,
            partnerPromise,
            acceptDeadline,
            deliveryDeadline,
            reviewDeadline,
            disputeDeadline
        );
    }

    function test_CreateVowSuccessStoresFullStateAndIndexes() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        uint64 acceptDeadline = 1_010;
        uint64 deliveryDeadline = 1_020;
        uint64 reviewDeadline = 1_030;
        uint64 disputeDeadline = 1_040;

        vm.expectEmit(true, true, true, true);
        emit VowCreated(0, CREATOR, PARTNER, STAKE, ARBITER);

        uint256 vowId = _create(
            vow,
            CREATOR,
            PARTNER,
            ARBITER,
            STAKE,
            "Ship frontend",
            "Deploy contract",
            acceptDeadline,
            deliveryDeadline,
            reviewDeadline,
            disputeDeadline
        );

        require(vowId == 0, "vowId");
        require(vow.nextVowId() == 1, "nextVowId");
        require(address(vow).balance == STAKE, "contract balance");

        (
            address creator,
            address partner,
            address arbiter,
            uint256 stake,
            uint64 storedAcceptDeadline,
            uint64 storedDeliveryDeadline,
            uint64 storedReviewDeadline,
            uint64 storedDisputeDeadline,
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
        ) = vow.vows(vowId);

        require(creator == CREATOR, "creator");
        require(partner == PARTNER, "partner");
        require(arbiter == ARBITER, "arbiter");
        require(stake == STAKE, "stake");
        require(storedAcceptDeadline == acceptDeadline, "acceptDeadline");
        require(storedDeliveryDeadline == deliveryDeadline, "deliveryDeadline");
        require(storedReviewDeadline == reviewDeadline, "reviewDeadline");
        require(storedDisputeDeadline == disputeDeadline, "disputeDeadline");
        require(keccak256(bytes(creatorPromise)) == keccak256(bytes("Ship frontend")), "creatorPromise");
        require(keccak256(bytes(partnerPromise)) == keccak256(bytes("Deploy contract")), "partnerPromise");
        require(bytes(creatorProofURI).length == 0, "creatorProofURI");
        require(bytes(partnerProofURI).length == 0, "partnerProofURI");
        require(creatorProofHash == bytes32(0), "creatorProofHash");
        require(partnerProofHash == bytes32(0), "partnerProofHash");
        require(bytes(creatorDisputeReason).length == 0, "creatorDisputeReason");
        require(bytes(partnerDisputeReason).length == 0, "partnerDisputeReason");
        require(creatorStatus == Vow.ParticipantStatus.PENDING, "creatorStatus");
        require(partnerStatus == Vow.ParticipantStatus.PENDING, "partnerStatus");
        require(status == Vow.VowStatus.PROPOSED, "status");

        uint256[] memory creatorIds = vow.getUserVowIds(CREATOR);
        uint256[] memory partnerIds = vow.getUserVowIds(PARTNER);
        require(creatorIds.length == 1 && creatorIds[0] == 0, "creator index");
        require(partnerIds.length == 1 && partnerIds[0] == 0, "partner index");
    }

    function test_CreateVowProgressesVowIdAcrossMultipleCreations() public {
        vm.warp(2_000);
        Vow vow = _newVow();

        uint256 firstId =
            _create(vow, CREATOR, PARTNER, address(0), STAKE, "First", "Second", 2_010, 2_020, 2_030, 2_040);
        uint256 secondId =
            _create(vow, CREATOR, PARTNER_2, address(0), STAKE, "Third", "Fourth", 2_011, 2_021, 2_031, 2_041);

        require(firstId == 0, "firstId");
        require(secondId == 1, "secondId");
        require(vow.nextVowId() == 2, "nextVowId");
        require(address(vow).balance == 2 * STAKE, "balance");

        uint256[] memory creatorIds = vow.getUserVowIds(CREATOR);
        uint256[] memory partnerIds = vow.getUserVowIds(PARTNER);
        uint256[] memory partner2Ids = vow.getUserVowIds(PARTNER_2);
        require(creatorIds.length == 2 && creatorIds[0] == 0 && creatorIds[1] == 1, "creator ids");
        require(partnerIds.length == 1 && partnerIds[0] == 0, "partner ids");
        require(partner2Ids.length == 1 && partner2Ids[0] == 1, "partner2 ids");
    }

    function test_CreateVowRevertZeroPartner() public {
        vm.warp(3_000);
        _expectCreateRevert(
            abi.encodeWithSelector(Vow.InvalidPartner.selector),
            address(0),
            ARBITER,
            "Ship frontend",
            "Deploy contract",
            3_010,
            3_020,
            3_030,
            3_040,
            STAKE
        );
    }

    function test_CreateVowRevertSelfPartner() public {
        vm.warp(3_000);
        _expectCreateRevert(
            abi.encodeWithSelector(Vow.InvalidPartner.selector),
            CREATOR,
            ARBITER,
            "Ship frontend",
            "Deploy contract",
            3_010,
            3_020,
            3_030,
            3_040,
            STAKE
        );
    }

    function test_CreateVowRevertZeroStake() public {
        vm.warp(3_000);
        _expectCreateRevert(
            abi.encodeWithSelector(Vow.InvalidStake.selector),
            PARTNER,
            ARBITER,
            "Ship frontend",
            "Deploy contract",
            3_010,
            3_020,
            3_030,
            3_040,
            0
        );
    }

    function test_CreateVowRevertEmptyCreatorPromise() public {
        vm.warp(3_000);
        _expectCreateRevert(
            abi.encodeWithSelector(Vow.EmptyPromise.selector),
            PARTNER,
            ARBITER,
            "",
            "Deploy contract",
            3_010,
            3_020,
            3_030,
            3_040,
            STAKE
        );
    }

    function test_CreateVowRevertEmptyPartnerPromise() public {
        vm.warp(3_000);
        _expectCreateRevert(
            abi.encodeWithSelector(Vow.EmptyPromise.selector),
            PARTNER,
            ARBITER,
            "Ship frontend",
            "",
            3_010,
            3_020,
            3_030,
            3_040,
            STAKE
        );
    }

    function test_CreateVowRevertAcceptDeadlineEqualNow() public {
        vm.warp(3_000);
        _expectCreateRevert(
            abi.encodeWithSelector(Vow.AcceptDeadlinePassed.selector),
            PARTNER,
            ARBITER,
            "Ship frontend",
            "Deploy contract",
            3_000,
            3_020,
            3_030,
            3_040,
            STAKE
        );
    }

    function test_CreateVowRevertAcceptDeadlinePast() public {
        vm.warp(3_000);
        _expectCreateRevert(
            abi.encodeWithSelector(Vow.AcceptDeadlinePassed.selector),
            PARTNER,
            ARBITER,
            "Ship frontend",
            "Deploy contract",
            2_999,
            3_020,
            3_030,
            3_040,
            STAKE
        );
    }

    function test_CreateVowRevertInvalidDeadlineOrderAcceptEqualsDelivery() public {
        vm.warp(3_000);
        _expectCreateRevert(
            abi.encodeWithSelector(Vow.InvalidDeadlineOrder.selector),
            PARTNER,
            ARBITER,
            "Ship frontend",
            "Deploy contract",
            3_010,
            3_010,
            3_030,
            3_040,
            STAKE
        );
    }

    function test_CreateVowRevertInvalidDeadlineOrderDeliveryEqualsReview() public {
        vm.warp(3_000);
        _expectCreateRevert(
            abi.encodeWithSelector(Vow.InvalidDeadlineOrder.selector),
            PARTNER,
            ARBITER,
            "Ship frontend",
            "Deploy contract",
            3_010,
            3_020,
            3_020,
            3_040,
            STAKE
        );
    }

    function test_CreateVowRevertInvalidDeadlineOrderReviewEqualsDispute() public {
        vm.warp(3_000);
        _expectCreateRevert(
            abi.encodeWithSelector(Vow.InvalidDeadlineOrder.selector),
            PARTNER,
            ARBITER,
            "Ship frontend",
            "Deploy contract",
            3_010,
            3_020,
            3_030,
            3_030,
            STAKE
        );
    }

    function test_CreateVowRevertArbiterIsCreator() public {
        vm.warp(3_000);
        _expectCreateRevert(
            abi.encodeWithSelector(Vow.InvalidArbiter.selector),
            PARTNER,
            CREATOR,
            "Ship frontend",
            "Deploy contract",
            3_010,
            3_020,
            3_030,
            3_040,
            STAKE
        );
    }

    function test_CreateVowRevertArbiterIsPartner() public {
        vm.warp(3_000);
        _expectCreateRevert(
            abi.encodeWithSelector(Vow.InvalidArbiter.selector),
            PARTNER,
            PARTNER,
            "Ship frontend",
            "Deploy contract",
            3_010,
            3_020,
            3_030,
            3_040,
            STAKE
        );
    }
}
