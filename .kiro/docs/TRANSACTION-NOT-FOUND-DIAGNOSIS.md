# Transaction Not Found - Diagnosis & Solution

## Problem
- User clicked "Bridge Now" and approved in MetaMask
- USDT was deducted from balance display
- No transaction appears in MetaMask Activity
- No transaction found on BSCScan
- Transaction hash doesn't exist on blockchain

## What This Means
**The transaction NEVER reached the blockchain.** This can happen when:

1. **Frontend shows pending balance** - The UI deducts the amount optimistically before the transaction is confirmed
2. **MetaMask rejected the transaction** - User might have rejected it or it failed validation
3. **Wrong network selected** - User might be on testnet instead of mainnet
4. **Gas estimation failed** - Transaction couldn't estimate gas and was never sent
5. **Contract call failed** - The deposit function reverted during simulation

## How to Verify

### Step 1: Check MetaMask Network
1. Open MetaMask
2. Look at the top - should say **"BSC Mainnet"** (NOT "BSC Testnet")
3. If it says testnet, switch to mainnet

### Step 2: Check MetaMask Activity
1. Open MetaMask
2. Click "Activity" tab
3. Look for ANY transaction (even failed ones)
4. If you see NOTHING, the transaction was never sent

### Step 3: Check Your USDT Balance
1. Open MetaMask
2. Make sure you're on BSC Mainnet
3. Check your actual USDT balance
4. **If the USDT is still there**, it was never deducted - just a frontend display issue

### Step 4: Refresh the Frontend
1. Hard refresh the bridge page (Cmd+Shift+R or Ctrl+Shift+R)
2. Reconnect your wallet
3. Check if the balance updates correctly

## Solution

### If USDT is Still in Your Wallet (Most Likely)
Your funds are safe! The transaction never happened. To deposit:

1. **Verify you're on BSC Mainnet** in MetaMask
2. **Refresh the bridge page**
3. **Reconnect wallet**
4. **Try depositing again**
5. **This time, watch MetaMask carefully:**
   - You should see a popup asking to confirm
   - After confirming, you should see "Pending" in MetaMask Activity
   - Copy the transaction hash immediately
   - Search it on BSCScan.com

### If USDT is Actually Gone (Unlikely)
If your USDT balance decreased but there's no transaction:

1. **Check all networks** - You might have sent it on a different network
2. **Check MetaMask on different devices** - Transaction might show on another device
3. **Export your private key** and import into a fresh MetaMask to see all transactions

## Prevention for Next Time

### Before Depositing:
- [ ] Verify MetaMask shows "BSC Mainnet" (not testnet)
- [ ] Check you have BNB for gas (~$0.50)
- [ ] Check your USDT balance is correct
- [ ] Make sure you're on the correct website

### During Deposit:
- [ ] MetaMask popup should appear
- [ ] Review the transaction details carefully
- [ ] Click "Confirm" in MetaMask
- [ ] Wait for "Pending" to appear in MetaMask Activity
- [ ] Copy the transaction hash immediately

### After Deposit:
- [ ] Check transaction on BSCScan: https://bscscan.com/tx/[TX_HASH]
- [ ] Wait for 6 confirmations (~18 seconds)
- [ ] Wait 2-5 minutes for relayer to process
- [ ] Check UC Chain wallet for received USDT

## Current Status

Based on the evidence:
- ✅ Bridge contract exists on BSC Mainnet
- ✅ Bridge has 30.01 USDT (from previous deposits)
- ✅ Relayer is running (but stuck due to rate limits)
- ❌ Your transaction doesn't exist on blockchain
- ❌ Transaction hash not found

**Conclusion:** The transaction was never sent to the blockchain. Your USDT should still be in your wallet.

## Next Steps

1. **Check your USDT balance** in MetaMask on BSC Mainnet
2. **If USDT is there:** Try depositing again (carefully this time)
3. **If USDT is missing:** Check other networks or contact support with your wallet address

## Need Help?

Provide these details:
1. Your wallet address
2. Screenshot of MetaMask Activity tab
3. Screenshot of MetaMask showing current network
4. Your current USDT balance on BSC Mainnet
5. Any error messages you saw

---

**Important:** If you don't see a transaction in MetaMask Activity, it means the transaction was NEVER sent. Your funds are safe in your wallet.
