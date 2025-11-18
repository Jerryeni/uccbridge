import { useState } from 'react';
import Link from 'next/link';
import { useWeb3 } from '../contexts/Web3Context';

export default function TransactionHistory() {
  const { isConnected, account, chainId, connectWallet } = useWeb3();
  const [error, setError] = useState('');

  const handleConnect = async () => {
    try {
      await connectWallet();
      setError('');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError('Failed to connect wallet');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/">
          <button className="mb-4 sm:mb-6 px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base bg-slate-800 rounded-lg hover:bg-slate-700 transition-all flex items-center space-x-2">
            <i className="fa-solid fa-arrow-left text-xs sm:text-sm"></i>
            <span>Back to Bridge</span>
          </button>
        </Link>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 md:mb-8">Transaction History</h1>

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-center space-x-2">
              <i className="fa-solid fa-exclamation-triangle text-red-400 text-sm sm:text-base"></i>
              <p className="text-red-400 text-xs sm:text-sm flex-1">{error}</p>
            </div>
          </div>
        )}

        {!isConnected ? (
          <div className="bg-slate-800/80 backdrop-blur-sm p-6 sm:p-8 md:p-10 rounded-xl sm:rounded-2xl text-center border border-slate-700/50">
            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg shadow-yellow-500/20">
              <i className="fa-solid fa-wallet text-white text-xl sm:text-2xl md:text-3xl"></i>
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 text-white">Connect Your Wallet</h2>
            <p className="mb-4 sm:mb-6 text-sm sm:text-base md:text-lg text-slate-300 px-2">Connect your wallet to view transaction history</p>
            <button
              onClick={handleConnect}
              className="px-6 sm:px-8 py-3 sm:py-3.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 font-bold text-sm sm:text-base rounded-lg sm:rounded-xl hover:from-yellow-500 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              <i className="fa-solid fa-wallet mr-2"></i>
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="bg-slate-800/80 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border border-slate-700/50">
            {/* Wallet Info Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 pb-4 border-b border-slate-700 gap-3 sm:gap-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fa-solid fa-check text-white text-base sm:text-lg"></i>
                </div>
                <div className="min-w-0">
                  <p className="text-base sm:text-lg font-bold text-green-400">Wallet Connected</p>
                  <p className="text-xs sm:text-sm text-slate-400 mt-0.5 truncate">
                    {account.slice(0, 8)}...{account.slice(-6)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 sm:text-right">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <div>
                  <p className="text-xs text-slate-400">Network</p>
                  <p className="text-xs sm:text-sm font-medium text-white">
                    {chainId === 56 ? 'BSC Mainnet' : chainId === 1137 ? 'Universe Chain' : `Chain ${chainId}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Empty State */}
            <div className="text-center py-8 sm:py-12 md:py-16">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <i className="fa-solid fa-clock-rotate-left text-3xl sm:text-4xl md:text-5xl text-slate-500"></i>
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-300 mb-2">No Transactions Yet</h3>
              <p className="text-xs sm:text-sm md:text-base text-slate-400 mb-1 px-4">
                Transaction history will be loaded from the blockchain
              </p>
              <p className="text-xs sm:text-sm text-slate-500 px-4">
                This feature is being enhanced with real blockchain data
              </p>
              
              {/* Quick Actions */}
              <div className="mt-6 sm:mt-8">
                <Link href="/">
                  <button className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 font-bold text-xs sm:text-sm rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all">
                    <i className="fa-solid fa-bridge mr-2"></i>
                    Make Your First Bridge
                  </button>
                </Link>
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-6">
              <div className="bg-slate-700/30 rounded-lg p-3 sm:p-4 border border-slate-600/30">
                <div className="flex items-center space-x-2 mb-2">
                  <i className="fa-solid fa-bolt text-yellow-400 text-sm sm:text-base"></i>
                  <h4 className="font-semibold text-xs sm:text-sm text-white">Fast Transfers</h4>
                </div>
                <p className="text-xs text-slate-400">Bridge transactions complete in 2-5 minutes</p>
              </div>
              
              <div className="bg-slate-700/30 rounded-lg p-3 sm:p-4 border border-slate-600/30">
                <div className="flex items-center space-x-2 mb-2">
                  <i className="fa-solid fa-shield-halved text-green-400 text-sm sm:text-base"></i>
                  <h4 className="font-semibold text-xs sm:text-sm text-white">Secure & Audited</h4>
                </div>
                <p className="text-xs text-slate-400">Your assets are protected by smart contracts</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
