# Meta Transactions for Governor

## Contracts
### `Governor.sol`
Governor contract manage polls for (upcoming) token holders. </br>
Owner can create a each poll and finalize it.
Voter can vote when a poll is activated.

**This Contract inherits MetaOwnable which is modified to compatible with ERC2771 for meta-transaction.**
- Poll : Struct
    - a struct data structure for storing and managing each poll
    - Property
        - title : string
        - candidates : string[]
            - Candidates for each Poll. Indexed
        - startAt, due : uint256
        - totalVoted : uint256 
        - votesPerCandidates : uint256[]
            - an array of counted votes for each candidate. 
        - status : Status(Enum)
</br>
</br>

- `createPoll` : Function
    - owner can create a poll with this external function
    - poll should be started after it being created.
    - Due should be after its startAt timestamp.
    - Array of structs 'polls' have each poll. 
    - User or owner can access each poll with the index(id) of each poll.
</br>
</br>

- `Vote` : Function
    - Voter can vote each poll with this external function.
    - poll accessed by 'pollId' should be open for voting, which is activated by Owner.
    - the data voter executed would be pushed to 'poll array'
    - Voter can not vote again for each poll. this is managed by 'pollVoterResults'(mapping, pollId => voter => votes[candidateId])
</br>
</br>
- `finalize` : Function
    - Owner can close a poll with this external function
    - Aggreate the each poll and counting votes for each candidates.



## Relyaer
### `relayer.ts`
- An Express Server for managing meta transactions.
- User can post its signed transaction with API '/vote'.
- This relayer server sends the tx to the forwarder(MinimalForwarder.sol) contract to verify and execute it instead of the front user. This helps the users to interact blockchain without gas fees.

- `signTx` : Function
    - Get Contract Instance of forwarder(MinimalForwarder) deployed already. 
    - Signer in the server signs it and send it to the forwarder contract.


## Front
### `App.tsx`
- An Minimal app for having Vote Component.

### `Vote.tsx`
- An component for having button to signing transaction and sends it to the relayer server.
- `signTx` : function
    - signing for the transaction and sends to the relayer server. 
    - With the abi of 'vote' function in 'governor.sol' and the 'forward' contract, this function builds the transaction to be signed and getting EIP 712 signed from users.
- `postData` : function
    - sends the tx data, and the signed signature by user(msgSender) to the relayer server
