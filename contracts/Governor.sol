// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
import "contracts/MetaOwnable.sol";

contract Governor is MetaOwnable {

    enum Status { 
        PENDING, 
        OPEN, 
        FINALIZED 
    }

    struct Poll {
        string title;
        string[] candidates;
        uint256 startAt;
        uint256 due;
        uint256 totalVoted;
        VoteData[] votes;
        uint256[] votesPerCandidates; 
        Status status; 
    }

    struct VoteData {
        address voterAddress;
        string[] votedCandidates;
        uint256 amount;
    }

    struct Tally {
        string candidate;
        uint256 votes;
    }

    Poll[] public polls;

    ///@notice pollId => voteIndex => voter address 
    mapping(uint256 => mapping(uint256 => address)) public voters; 

    ///@notice pollId => voter => votes[candidateId]
    mapping(uint256 => mapping(address => uint256)) public pollVoterResults; 

    event PollCreated(uint256 pollId);
    event Voted(uint256 indexed pollId, uint256 voteIndex, address voter, uint256 amount);
    event Activated(uint256 indexed pollId, uint256 timestamp);
    event Finalized(uint256 indexed pollId, uint256 totalVoted, uint256 timestamp);

    modifier validPoll(uint256 pollId) {
        require(pollId < polls.length, "Governor : Invalid Poll Id");
        _;
    }

    constructor(address _forwarder) ERC2771Context(_forwarder)
    {
       
    } 


    ////////////////////////////
    //////      PUBLIC   ///////
    ////////////////////////////

    function totalVotes(uint256 pollId) public view validPoll(pollId) returns (uint256) {
        return polls[pollId].votes.length;
    }

    function pollResult(uint256 pollId) public view validPoll(pollId) returns (Tally[] memory) {
        require(polls[pollId].status == Status.FINALIZED, "Governor: poll not finalized yet");

        Tally[] memory tally = new Tally[](polls[pollId].candidates.length);
        
        for (uint256 i=0; i < polls[pollId].candidates.length; i++){
            tally[i].candidate  = polls[pollId].candidates[i];
            tally[i].votes = polls[pollId].votesPerCandidates[i];
        }

        return tally;
    }

    ////////////////////////////
    //////      EXTERNAL   /////
    ////////////////////////////

    function createPoll(
        string memory title_,
        string[] memory candidates_,
        uint256 startAt_,
        uint256 due_
    ) external onlyOwner {
        require(candidates_.length > 1, "Governor: Candidates can not be less than or equal to 1");
        require(startAt_ > block.timestamp, "Governor: Poll cannot start from the past");
        require(due_ > startAt_, "Governor: Poll cannot be end before the start");

        polls.push();
        uint256 id = polls.length - 1;
        
        polls[id].title = title_;
        polls[id].candidates = candidates_;
        polls[id].startAt = startAt_;
        polls[id].due = due_;
        polls[id].votesPerCandidates = new uint256[](candidates_.length);
        polls[id].status = Status.PENDING;

        emit PollCreated(polls.length - 1);
    }

    function vote(
        uint256 pollId,
        uint256 amount,
        string[] calldata votedCandidates // TODO Replace for commit-reveal scheme
    ) external validPoll(pollId) {
        require(polls[pollId].status == Status.OPEN, "Governor : Poll is not open now");
        require(pollVoterResults[pollId][_msgSender()] == 0, "Governor : Voter cannot vote again"); // TODO replace for multiple voting

        Poll storage poll = polls[pollId];
        VoteData memory voteData = VoteData(_msgSender(), votedCandidates, amount); // TODO replace params with hash for commit-reveal scheme
        poll.votes.push(voteData);
        poll.totalVoted++;

        uint256 voteIndex = poll.votes.length - 1;
        voters[pollId][voteIndex] = _msgSender();

        emit Voted(pollId, voteIndex, _msgSender(), amount);
    }


    function activate(
        uint256 pollId
    ) external validPoll(pollId) onlyOwner {
        require(polls[pollId].status == Status.PENDING, "Governor : poll should be pending for activating");
        require(polls[pollId].due > block.timestamp, "Governor : current timestamp cannot be over the poll's due");
        _updatePollStatus(pollId, Status.OPEN);
        
        emit Activated(pollId, block.timestamp);
    }

    function finalize(uint256 pollId) external validPoll(pollId) onlyOwner {
        require(block.timestamp > polls[pollId].due, "Governor: Due should be passed");
        require(polls[pollId].status == Status.OPEN, "Governor: Poll should be open");
        
        // _reveal(pollId);
        _updatePollStatus(pollId, Status.FINALIZED);   
        
        emit Finalized(pollId, polls[pollId].totalVoted, block.timestamp);
    }


    ///////////////////////////////
    //////      PRIVATE    ///////
    ///////////////////////////////

    // function _reveal(
    //     uint256 pollId
    // ) private validPoll(pollId) {
    //     require(polls[pollId].due > block.timestamp, "Governor : current timestamp cannot be over the poll's due");
    //     require(polls[pollId].status != Status.FINALIZED);
    //     Poll storage poll = polls[pollId];
        
    //     for (uint256 i = 0; i < poll.votes.length; i++) {
    //         for (uint256 canId = 0; canId < poll.votes[i].votedCandidates.length; canId++) {
    //             poll.votesPerCandidates[poll.votes[i].votedCandidates] += poll.votes[i].amount;
    //         }
    //     }
    // }


    function _updatePollStatus(
        uint256 pollId,
        Status status
    ) private {
        polls[pollId].status = Status(status);
    }
    
}
