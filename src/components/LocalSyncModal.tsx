/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useCart } from '../context/CartContext.js';
import { 
  X, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle2, 
  ShieldCheck, 
  Database, 
  Clock, 
  Layers,
  ArrowDownUp
} from 'lucide-react';

interface LocalSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocalSyncModal: React.FC<LocalSyncModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    isOfflineMode,
    setIsOfflineMode,
    pendingSyncEvents,
    flushSyncQueue,
    isSyncing,
    lastSyncedAt,
    cartItems,
  } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Edge LocalSync Engine Inspector">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isOfflineMode ? 'bg-amber-950 border border-amber-800 text-amber-400' : 'bg-emerald-950 border border-emerald-800 text-emerald-400'
            }`}>
              {isOfflineMode ? <WifiOff className="w-5 h-5 animate-pulse" /> : <Wifi className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Edge LocalSync Offline Engine
              </h2>
              <p className="text-xs text-slate-400">
                Conflict-free replicated distributed cart state for in-store signal dead zones
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          
          {/* Status & Simulation Toggle */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isOfflineMode ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Network Link: {isOfflineMode ? 'Disconnected (Local Offline Cache Active)' : 'Online (Edge Replicating)'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Last reconciled: <span className="font-mono text-slate-300">{new Date(lastSyncedAt).toLocaleTimeString()}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsOfflineMode(prev => !prev)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  isOfflineMode
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                    : 'bg-amber-950 hover:bg-amber-900 text-amber-300 border-amber-800'
                }`}
              >
                {isOfflineMode ? 'Reconnect to Store WiFi' : 'Simulate WiFi Blackout'}
              </button>
              
              {!isOfflineMode && (
                <button
                  onClick={flushSyncQueue}
                  disabled={isSyncing || pendingSyncEvents.length === 0}
                  className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Sync Now</span>
                </button>
              )}
            </div>
          </div>

          {/* Sync Queue Statistics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Queued Events</span>
              <span className="text-2xl font-black text-cyan-400 font-mono mt-0.5 block">
                {pendingSyncEvents.length}
              </span>
              <span className="text-[10px] text-slate-400">Buffered locally</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Active Cart Items</span>
              <span className="text-2xl font-black text-emerald-400 font-mono mt-0.5 block">
                {cartItems.length}
              </span>
              <span className="text-[10px] text-slate-400">In memory state</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Integrity Protocol</span>
              <span className="text-sm font-bold text-slate-200 mt-2 block flex items-center justify-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> CRDT Event Log
              </span>
              <span className="text-[10px] text-slate-400">SHA-256 Chained</span>
            </div>
          </div>

          {/* Event Log Inspector */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Local Transaction Queue:</span>
              <span className="text-slate-500 font-normal">FIFO In-Memory Queue</span>
            </h3>

            {pendingSyncEvents.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                All local cart mutations are synchronized with the store edge cloud.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {pendingSyncEvents.map((event) => (
                  <div 
                    key={event.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                          {event.type}
                        </span>
                        <span className="text-white font-medium truncate">
                          {event.payload.productName || event.payload.productId || 'Cart state'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-1">
                        Hash: {event.hash} • {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                    </div>

                    <span className="text-[10px] font-semibold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800 shrink-0">
                      Pending Sync
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
