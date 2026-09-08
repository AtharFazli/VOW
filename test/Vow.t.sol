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

    event VowCreated(uint256 indexed vowId, address indexed creator, address indexed partner, uint256 stake, address arbiter);

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
        vowId = vow.createVow{value: stake}(partner, arbiter, creatorPromise, partnerPromise, acceptDeadline, deliveryDeadline, reviewDeadline, disputeDeadline);
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
        vow.createVow{value: stake}(partner, arbiter, creatorPromise, partnerPromise, acceptDeadline, deliveryDeadline, reviewDeadline, disputeDeadline);
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

    function _assertCreatedState(Vow vow, uint256 vowId) internal view {
        bytes memory data = _vowData(vow, vowId);
        require(_addr(data, 0) == CREATOR, "creator");
        require(_addr(data, 1) == PARTNER, "partner");
        require(_addr(data, 2) == ARBITER, "arbiter");
        require(_word(data, 3) == bytes32(STAKE), "stake");
        require(_u64(data, 4) == 1_010, "acceptDeadline");
        require(_u64(data, 5) == 1_020, "deliveryDeadline");
        require(_u64(data, 6) == 1_030, "reviewDeadline");
        require(_u64(data, 7) == 1_040, "disputeDeadline");
        require(keccak256(bytes(_string(data, 8))) == keccak256(bytes("Ship frontend")), "creatorPromise");
        require(keccak256(bytes(_string(data, 9))) == keccak256(bytes("Deploy contract")), "partnerPromise");
        require(bytes(_string(data, 10)).length == 0, "creatorProofURI");
        require(bytes(_string(data, 11)).length == 0, "partnerProofURI");
        require(_word(data, 12) == bytes32(0), "creatorProofHash");
        require(_word(data, 13) == bytes32(0), "partnerProofHash");
        require(bytes(_string(data, 14)).length == 0, "creatorDisputeReason");
        require(bytes(_string(data, 15)).length == 0, "partnerDisputeReason");
        require(_participantStatus(data, 16) == Vow.ParticipantStatus.PENDING, "creatorStatus");
        require(_participantStatus(data, 17) == Vow.ParticipantStatus.PENDING, "partnerStatus");
        require(_status(data, 18) == Vow.VowStatus.PROPOSED, "status");
    }

    function test_CreateVowSuccessStoresFullStateAndIndexes() public {
        vm.warp(1_000);
        Vow vow = _newVow();

        vm.expectEmit(true, true, true, true);
        emit VowCreated(0, CREATOR, PARTNER, STAKE, ARBITER);

        uint256 vowId = _create(vow, CREATOR, PARTNER, ARBITER, STAKE, "Ship frontend", "Deploy contract", 1_010, 1_020, 1_030, 1_040);

        require(vowId == 0, "vowId");
        require(vow.nextVowId() == 1, "nextVowId");
        require(address(vow).balance == STAKE, "contract balance");
        _assertCreatedState(vow, vowId);

        uint256[] memory creatorIds = vow.getUserVowIds(CREATOR);
        uint256[] memory partnerIds = vow.getUserVowIds(PARTNER);
        require(creatorIds.length == 1 && creatorIds[0] == 0, "creator index");
        require(partnerIds.length == 1 && partnerIds[0] == 0, "partner index");
    }

    function test_CreateVowProgressesVowIdAcrossMultipleCreations() public {
        vm.warp(2_000);
        Vow vow = _newVow();

        uint256 firstId = _create(vow, CREATOR, PARTNER, address(0), STAKE, "First", "Second", 2_010, 2_020, 2_030, 2_040);
        uint256 secondId = _create(vow, CREATOR, PARTNER_2, address(0), STAKE, "Third", "Fourth", 2_011, 2_021, 2_031, 2_041);

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
        _expectCreateRevert(abi.encodeWithSelector(Vow.InvalidPartner.selector), address(0), ARBITER, "Ship frontend", "Deploy contract", 3_010, 3_020, 3_030, 3_040, STAKE);
    }

    function test_CreateVowRevertSelfPartner() public {
        vm.warp(3_000);
        _expectCreateRevert(abi.encodeWithSelector(Vow.InvalidPartner.selector), CREATOR, ARBITER, "Ship frontend", "Deploy contract", 3_010, 3_020, 3_030, 3_040, STAKE);
    }

    function test_CreateVowRevertZeroStake() public {
        vm.warp(3_000);
        _expectCreateRevert(abi.encodeWithSelector(Vow.InvalidStake.selector), PARTNER, ARBITER, "Ship frontend", "Deploy contract", 3_010, 3_020, 3_030, 3_040, 0);
    }

    function test_CreateVowRevertEmptyCreatorPromise() public {
        vm.warp(3_000);
        _expectCreateRevert(abi.encodeWithSelector(Vow.EmptyPromise.selector), PARTNER, ARBITER, "", "Deploy contract", 3_010, 3_020, 3_030, 3_040, STAKE);
    }

    function test_CreateVowRevertEmptyPartnerPromise() public {
        vm.warp(3_000);
        _expectCreateRevert(abi.encodeWithSelector(Vow.EmptyPromise.selector), PARTNER, ARBITER, "Ship frontend", "", 3_010, 3_020, 3_030, 3_040, STAKE);
    }

    function test_CreateVowRevertAcceptDeadlineEqualNow() public {
        vm.warp(3_000);
        _expectCreateRevert(abi.encodeWithSelector(Vow.AcceptDeadlinePassed.selector), PARTNER, ARBITER, "Ship frontend", "Deploy contract", 3_000, 3_020, 3_030, 3_040, STAKE);
    }

    function test_CreateVowRevertAcceptDeadlinePast() public {
        vm.warp(3_000);
        _expectCreateRevert(abi.encodeWithSelector(Vow.AcceptDeadlinePassed.selector), PARTNER, ARBITER, "Ship frontend", "Deploy contract", 2_999, 3_020, 3_030, 3_040, STAKE);
    }

    function test_CreateVowRevertInvalidDeadlineOrderAcceptEqualsDelivery() public {
        vm.warp(3_000);
        _expectCreateRevert(abi.encodeWithSelector(Vow.InvalidDeadlineOrder.selector), PARTNER, ARBITER, "Ship frontend", "Deploy contract", 3_010, 3_010, 3_030, 3_040, STAKE);
    }

    function test_CreateVowRevertInvalidDeadlineOrderDeliveryEqualsReview() public {
        vm.warp(3_000);
        _expectCreateRevert(abi.encodeWithSelector(Vow.InvalidDeadlineOrder.selector), PARTNER, ARBITER, "Ship frontend", "Deploy contract", 3_010, 3_020, 3_020, 3_040, STAKE);
    }

    function test_CreateVowRevertInvalidDeadlineOrderReviewEqualsDispute() public {
        vm.warp(3_000);
        _expectCreateRevert(abi.encodeWithSelector(Vow.InvalidDeadlineOrder.selector), PARTNER, ARBITER, "Ship frontend", "Deploy contract", 3_010, 3_020, 3_030, 3_030, STAKE);
    }

    function test_CreateVowRevertArbiterIsCreator() public {
        vm.warp(3_000);
        _expectCreateRevert(abi.encodeWithSelector(Vow.InvalidArbiter.selector), PARTNER, CREATOR, "Ship frontend", "Deploy contract", 3_010, 3_020, 3_030, 3_040, STAKE);
    }

    function test_CreateVowRevertArbiterIsPartner() public {
        vm.warp(3_000);
        _expectCreateRevert(abi.encodeWithSelector(Vow.InvalidArbiter.selector), PARTNER, PARTNER, "Ship frontend", "Deploy contract", 3_010, 3_020, 3_030, 3_040, STAKE);
    }
}

contract VowAcceptTest {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    address constant CREATOR = address(0xA11CE);
    address constant PARTNER = address(0xB0B);
    address constant OTHER = address(0xD0D);
    address constant FAILURE_SINK = address(0xFEE1);
    uint256 constant STAKE = 1 ether;

    event VowAccepted(uint256 indexed vowId, address indexed partner);

    function _newVow() internal returns (Vow) {
        return new Vow(FAILURE_SINK);
    }

    function _createProposedVow(Vow vow, uint64 acceptDeadline) internal returns (uint256 vowId) {
        vm.deal(CREATOR, STAKE);
        vm.prank(CREATOR);
        vowId = vow.createVow{value: STAKE}(PARTNER, address(0), "Ship frontend", "Deploy contract", acceptDeadline, acceptDeadline + 10, acceptDeadline + 20, acceptDeadline + 30);
    }

    function _accept(Vow vow, address sender, uint256 vowId, uint256 value) internal {
        vm.deal(sender, value);
        vm.prank(sender);
        vow.acceptVow{value: value}(vowId);
    }

    function _expectAcceptRevert(Vow vow, address sender, uint256 vowId, uint256 value, bytes memory revertData) internal {
        vm.deal(sender, value);
        vm.expectRevert(revertData);
        vm.prank(sender);
        vow.acceptVow{value: value}(vowId);
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

    function _assertAcceptedState(Vow vow, uint256 vowId) internal view {
        bytes memory data = _vowData(vow, vowId);
        require(_addr(data, 0) == CREATOR, "creator");
        require(_addr(data, 1) == PARTNER, "partner");
        require(_addr(data, 2) == address(0), "arbiter");
        require(_word(data, 3) == bytes32(STAKE), "stake");
        require(_u64(data, 4) == 1_010, "acceptDeadline");
        require(_u64(data, 5) == 1_020, "deliveryDeadline");
        require(_u64(data, 6) == 1_030, "reviewDeadline");
        require(_u64(data, 7) == 1_040, "disputeDeadline");
        require(keccak256(bytes(_string(data, 8))) == keccak256(bytes("Ship frontend")), "creatorPromise");
        require(keccak256(bytes(_string(data, 9))) == keccak256(bytes("Deploy contract")), "partnerPromise");
        require(bytes(_string(data, 10)).length == 0, "creatorProofURI");
        require(bytes(_string(data, 11)).length == 0, "partnerProofURI");
        require(_word(data, 12) == bytes32(0), "creatorProofHash");
        require(_word(data, 13) == bytes32(0), "partnerProofHash");
        require(bytes(_string(data, 14)).length == 0, "creatorDisputeReason");
        require(bytes(_string(data, 15)).length == 0, "partnerDisputeReason");
        require(_participantStatus(data, 16) == Vow.ParticipantStatus.PENDING, "creatorStatus");
        require(_participantStatus(data, 17) == Vow.ParticipantStatus.PENDING, "partnerStatus");
        require(_status(data, 18) == Vow.VowStatus.ACTIVE, "status");
    }

    function test_PartnerAcceptsSuccessfully() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        uint256 vowId = _createProposedVow(vow, 1_010);

        vm.expectEmit(true, true, false, false);
        emit VowAccepted(vowId, PARTNER);
        _accept(vow, PARTNER, vowId, STAKE);

        _assertAcceptedState(vow, vowId);
        require(address(vow).balance == 2 * STAKE, "balance");
    }

    function test_CreatorCannotAccept() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        uint256 vowId = _createProposedVow(vow, 1_010);
        _expectAcceptRevert(vow, CREATOR, vowId, STAKE, abi.encodeWithSelector(Vow.Unauthorized.selector));
    }

    function test_UnrelatedWalletCannotAccept() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        uint256 vowId = _createProposedVow(vow, 1_010);
        _expectAcceptRevert(vow, OTHER, vowId, STAKE, abi.encodeWithSelector(Vow.Unauthorized.selector));
    }

    function test_NonexistentVowFails() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        _expectAcceptRevert(vow, PARTNER, 999, STAKE, abi.encodeWithSelector(Vow.InvalidVow.selector));
    }

    function test_ZeroValueFails() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        uint256 vowId = _createProposedVow(vow, 1_010);
        _expectAcceptRevert(vow, PARTNER, vowId, 0, abi.encodeWithSelector(Vow.IncorrectStake.selector));
    }

    function test_LowValueFails() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        uint256 vowId = _createProposedVow(vow, 1_010);
        _expectAcceptRevert(vow, PARTNER, vowId, STAKE - 1, abi.encodeWithSelector(Vow.IncorrectStake.selector));
    }

    function test_HighValueFails() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        uint256 vowId = _createProposedVow(vow, 1_010);
        _expectAcceptRevert(vow, PARTNER, vowId, STAKE + 1, abi.encodeWithSelector(Vow.IncorrectStake.selector));
    }

    function test_DoubleAcceptanceFails() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        uint256 vowId = _createProposedVow(vow, 1_010);
        _accept(vow, PARTNER, vowId, STAKE);
        _expectAcceptRevert(vow, PARTNER, vowId, STAKE, abi.encodeWithSelector(Vow.InvalidVowStatus.selector));
    }

    function test_BeforeAcceptDeadlineSucceeds() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        uint256 vowId = _createProposedVow(vow, 1_010);
        vm.warp(1_009);
        _accept(vow, PARTNER, vowId, STAKE);
        require(_status(_vowData(vow, vowId), 18) == Vow.VowStatus.ACTIVE, "status");
    }

    function test_ExactlyAtAcceptDeadlineSucceeds() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        uint256 vowId = _createProposedVow(vow, 1_010);
        vm.warp(1_010);
        _accept(vow, PARTNER, vowId, STAKE);
        require(_status(_vowData(vow, vowId), 18) == Vow.VowStatus.ACTIVE, "status");
    }

    function test_AfterAcceptDeadlineFails() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        uint256 vowId = _createProposedVow(vow, 1_010);
        vm.warp(1_011);
        _expectAcceptRevert(vow, PARTNER, vowId, STAKE, abi.encodeWithSelector(Vow.AcceptDeadlinePassed.selector));
    }

    function test_AgreementDataStaysUnchanged() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        uint256 vowId = _createProposedVow(vow, 1_010);
        _accept(vow, PARTNER, vowId, STAKE);
        _assertAcceptedState(vow, vowId);
    }

    function test_FailedAttemptsPreserveStateAndAccounting() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        uint256 vowId = _createProposedVow(vow, 1_010);
        uint256 before = address(vow).balance;
        _expectAcceptRevert(vow, OTHER, vowId, STAKE, abi.encodeWithSelector(Vow.Unauthorized.selector));
        require(_status(_vowData(vow, vowId), 18) == Vow.VowStatus.PROPOSED, "status");
        require(address(vow).balance == before, "balance");
    }

    function test_VowAcceptedEventIsCorrect() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        uint256 vowId = _createProposedVow(vow, 1_010);
        vm.expectEmit(true, true, false, false);
        emit VowAccepted(vowId, PARTNER);
        _accept(vow, PARTNER, vowId, STAKE);
    }

    function test_StateAndMoneyLoopExactCollateral() public {
        vm.warp(1_000);
        Vow vow = _newVow();
        uint256 vowId = _createProposedVow(vow, 1_010);
        require(address(vow).balance == STAKE, "before balance");
        _accept(vow, PARTNER, vowId, STAKE);
        require(address(vow).balance == 2 * STAKE, "after balance");
        require(_status(_vowData(vow, vowId), 18) == Vow.VowStatus.ACTIVE, "status");
    }
}
