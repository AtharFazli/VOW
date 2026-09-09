# VOW Session Handoff

## Current State
- Current/last completed gate: Gate M — Deploy Contract
- Gate status: PASS; locked
- Next allowed gate: Gate N — Wallet & Contract Frontend Foundation
- Current branch: testnet-mainnet
- Current commit: <TBD — pending Gate M commit>

## Completed Gates
- Gate B — PASS; createVow skeleton and constructor baseline verified.
- Gate C — PASS; createVow behavior implemented and verified.
- Gate D — PASS; acceptVow behavior implemented and verified.
- Gate E — PASS; submitProof behavior implemented and verified.
- Gate F — PASS; reviewProof behavior implemented and verified.
- Gate G — PASS; resolveDispute behavior implemented and verified.
- Gate H — PASS; timeout resolution implemented and verified.
- Gate I — PASS; finalization and settlement implemented and verified.
- Gate J — PASS; withdraw behavior implemented and verified.
- Gate K — PASS; full contract audit completed, no protocol bug found.
- Gate L — PASS; BOT Chain network configuration established (Bohr Testnet + BOT Mainnet RPC, chain IDs, deployer profiles).
- Gate M — PASS; Vow contract deployed to Bohr Testnet.

## Deployment State

### Bohr Testnet (DEPLOYED)
- Network: Bohr Testnet
- Chain ID: 968
- RPC: https://rpc.bohr.life
- Explorer: https://scan.bohr.life
- Vow contract: 0x9539263f4861812B08C37Bb3cB6603c771d6530b
- failureSink: 0xF4436Ae58d3Cc4F35dc5D38F56DBBa959230285B
- Deployer: 0x8d9165F2eDF3Ec10659A0762112DE9e007619aE7
- Transaction hash: 0x60de58eca141fd24c63d4d26ab1d045c46fd969c258fc5941eb802d8227649c0
- Block: 22766973
- Gas used: 1,766,110
- Deployment cost: ~0.0353 BOT (at 20 gwei)

### BOT Mainnet
- NOT DEPLOYED

## Current Implementation
- Contracts deployed: Vow.sol on Bohr Testnet at 0x9539263f4861812B08C37Bb3cB6603c771d6530b
- Functions: createVow, acceptVow, submitProof, reviewProof, resolveDispute, finalizeVow, withdraw
- Frontend implemented: none in this repository.

## Verification
- Post-deploy readback:
  - bytecode: non-empty ✓
  - failureSink(): 0xF4436Ae58d3Cc4F35dc5D38F56DBBa959230285B ✓
  - nextVowId(): 0 ✓
  - chain ID: 968 ✓
- Latest verified commands:
  - forge fmt
  - forge fmt --check
  - forge build
  - forge test -vvv
  - git diff --check
- Result: 118 passed, 0 failed

## Known Issues
- Existing Foundry style warnings remain in repo (naming conventions, import style).
- Deploy script added forge-std submodule and libs=["lib"] to foundry.toml for Gate M.

## Important Decisions
- DISPUTED is not FAILED at review stage.
- Arbiter resolution must not move funds directly.
- finalizeVow() remains permissionless and deterministic.
- withdraw() uses pull-payment accounting and reentrancy protection.
- Source-of-truth docs remain authoritative over this handoff.
- Deploy script uses hard chain guard: require(block.chainid == 968, "Wrong chain").
- PRIVATE_KEY is never committed, logged, or stored in source.

## Files Changed Recently
- src/Vow.sol: withdraw and audit-era contract logic are final for v1.
- test/Vow*.t.sol: full Gate A-K Foundry coverage in place.
- script/DeployVow.s.sol: Gate M deployment script (Bohr Testnet only).
- lib/forge-std: added as submodule (v1.16.2) for deploy script dependency.
- .gitmodules: forge-std submodule registration.
- foundry.toml: libs = ["lib"] added for forge-std resolution.

## Next Session
- Exact next allowed gate: Gate N — Wallet & Contract Frontend Foundation.
- Before continuing, re-read source-of-truth docs and verify repo state first.
