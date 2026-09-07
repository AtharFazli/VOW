// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Vow {
    enum VowStatus {
        PROPOSED,
        ACTIVE,
        SETTLED
    }

    enum ParticipantStatus {
        PENDING,
        PROOF_SUBMITTED,
        SUCCESS,
        FAILED,
        DISPUTED,
        UNRESOLVED
    }

    struct Vow {
        address creator;
        address partner;
        address arbiter;
        uint256 stake;
        uint64 acceptDeadline;
        uint64 deliveryDeadline;
        uint64 reviewDeadline;
        uint64 disputeDeadline;
        string creatorPromise;
        string partnerPromise;
        string creatorProofURI;
        string partnerProofURI;
        bytes32 creatorProofHash;
        bytes32 partnerProofHash;
        string creatorDisputeReason;
        string partnerDisputeReason;
        ParticipantStatus creatorStatus;
        ParticipantStatus partnerStatus;
        VowStatus status;
    }

    error ZeroAddress();
    error InvalidPartner();
    error InvalidArbiter();
    error InvalidStake();
    error InvalidDeadlineOrder();
    error EmptyPromise();
    error InvalidVow();
    error InvalidVowStatus();
    error Unauthorized();
    error AcceptDeadlinePassed();
    error IncorrectStake();
    error DeliveryDeadlinePassed();
    error ReviewDeadlinePassed();
    error DisputeDeadlinePassed();
    error ProofAlreadySubmitted();
    error ProofNotSubmitted();
    error InvalidProof();
    error AlreadyReviewed();
    error NotDisputed();
    error VowNotReadyForSettlement();
    error NothingToWithdraw();
    error NativeTransferFailed();

    event VowCreated(
        uint256 indexed vowId, address indexed creator, address indexed partner, uint256 stake, address arbiter
    );

    event VowAccepted(uint256 indexed vowId, address indexed partner);

    event ProofSubmitted(uint256 indexed vowId, address indexed participant, string proofURI, bytes32 proofHash);

    event ProofApproved(uint256 indexed vowId, address indexed participant, address indexed reviewer);

    event ProofDisputed(uint256 indexed vowId, address indexed participant, address indexed reviewer, string reason);

    event DisputeResolved(uint256 indexed vowId, address indexed participant, bool proofValid);

    event VowSettled(uint256 indexed vowId, ParticipantStatus creatorOutcome, ParticipantStatus partnerOutcome);

    event Withdrawal(address indexed account, uint256 amount);

    uint256 public nextVowId;
    mapping(uint256 => Vow) public vows;
    mapping(address => uint256) public claimable;
    mapping(address => uint256[]) private userVowIds;
    address public immutable failureSink;

    constructor(address failureSink_) {
        if (failureSink_ == address(0)) revert ZeroAddress();
        failureSink = failureSink_;
    }
}
