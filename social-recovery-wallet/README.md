# Social Recovery Wallet

A secure wallet implementation in Clarity that allows recovery of funds through a trusted network of guardians using threshold signatures.

## Overview

The Social Recovery Wallet is a smart contract that provides a secure way to recover access to your digital assets if you lose your private key. Instead of relying on a single point of failure, this wallet uses a social recovery mechanism where a predefined number of trusted guardians (friends, family, or institutions) can collectively help you regain access to your wallet.

## Key Features

- **Guardian System**: Designate trusted individuals or institutions as guardians for your wallet
- **Threshold-based Recovery**: Set a minimum number of guardians required to approve a recovery
- **Secure Ownership Transfer**: Recover wallet access by transferring ownership to a new address
- **Fraud Prevention**: Protection against duplicate votes and unauthorized recovery attempts
- **Owner Controls**: Full authority to add/remove guardians and adjust security parameters

## How It Works

1. **Setup**: Initialize the wallet with an owner address and define the threshold of guardians required for recovery
2. **Guardian Management**: Add trusted guardians to your recovery network
3. **Normal Operation**: Use the wallet like any other Clarity wallet to manage your assets
4. **Recovery Process**:
   - If you lose access, any guardian can initiate the recovery process
   - Other guardians vote to support the recovery
   - Once the threshold is met, the recovery can be executed
   - Ownership transfers to a new address, restoring your access

## Contract Functions

### Initialization and Management

- `initialize(new-owner, threshold)`: Set up the wallet with initial owner and threshold
- `add-guardian(guardian)`: Add a new guardian to the recovery network
- `remove-guardian(guardian)`: Remove a guardian from the recovery network
- `update-threshold(new-threshold)`: Change the number of guardians required for recovery

### Recovery Process

- `initiate-recovery(new-owner)`: Start the recovery process with a proposed new owner
- `support-recovery(recovery-id)`: Add your vote as a guardian to support a recovery
- `execute-recovery(recovery-id)`: Complete the recovery once enough guardians have voted
- `cancel-recovery(recovery-id)`: Cancel an ongoing recovery process (owner only)

### Asset Management

- `transfer(token, recipient, amount)`: Transfer fungible tokens from the wallet
- `transfer-stx(recipient, amount)`: Transfer STX tokens from the wallet

### Status Queries

- `get-owner()`: Get the current wallet owner
- `get-threshold()`: Get the current recovery threshold
- `is-guardian(address)`: Check if an address is a registered guardian
- `get-recovery-status(recovery-id)`: Check the status of a recovery process
- `has-voted(recovery-id, guardian)`: Check if a guardian has voted on a recovery
- `get-guardian-count()`: Get the total number of guardians

## Development and Testing

The project includes comprehensive tests written with Vitest to verify the functionality of the smart contract. The tests cover all major functions and edge cases to ensure the security and reliability of the wallet.

To run the tests:

```bash
npm test
```

## Security Considerations

- Choose your guardians carefully - they should be trusted individuals or institutions
- Set an appropriate threshold - too low may be insecure, too high may make recovery difficult
- Consider geographic distribution of guardians to prevent single points of failure
- Regularly review your guardian list and adjust as needed

## Future Enhancements

- Time-locked recovery to add delay for additional security
- Graduated recovery thresholds based on transaction value
- Guardian rotation policies to ensure continued security
- Multi-signature operations for high-value transactions

## License

This project is licensed under the MIT License - see the LICENSE file for details.