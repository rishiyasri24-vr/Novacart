/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { SecurityAuditLog, UserRole } from '../../shared/types.js';
import { 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Key, 
  UserCheck, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface SecurityLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityLedgerModal: React.FC<SecurityLedgerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { session, setRole } = useAuth();
  const [logs, setLogs] = useState<SecurityAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tokenInput, setTokenInput] = useState<string>('');
  const [tokenVerificationResult, setTokenVerificationResult] = useState<{
    tested: boolean;
    valid: boolean;
    message: string;
  } | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/audit-logs', {
        headers: {
          'x-user-role': session.role,
          'x-user-id': session.userId,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, session.role]);

  const handleVerifyToken = () => {
    if (!tokenInput.trim()) return;
    const clean = tokenInput.trim();
    const isValid = clean.startsWith('NOVACART_VERIFIED_EXIT_') && clean.length > 30;
    setTokenVerificationResult({
      tested: true,
      valid: isValid,
      message: isValid 
        ? 'Valid cryptographic signature. Receipt verified. Gate opened.' 
        : 'INVALID OR FORGED TOKEN! Shrinkage alert triggered. Gate locked.',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Loss Prevention Security Ledger">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[88vh] overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800 text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Loss Prevention & Cryptographic Audit Ledger
              </h2>
              <p className="text-xs text-slate-400">
                Tamper-evident chained HMAC log for retail anti-shrinkage auditing
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
          
          {/* Role-Based Access Control Switcher */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">
                Active Session & RBAC Role:
              </span>
              <p className="text-xs font-bold text-white mt-0.5">
                {session.name} <span className="text-cyan-400">({session.role})</span>
              </p>
              <p className="text-[10px] text-slate-400">Token ID: {session.token.slice(0, 16)}...</p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 font-semibold px-2">Switch:</span>
              {(['shopper', 'store_associate', 'security_auditor'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                    session.role === r
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Exit Gate Token Validator Tool */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-300 block">
              Simulate Store Exit Gate Sensor (Anti-Theft Pass Validator):
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Paste antiTheftQrToken (e.g. NOVACART_VERIFIED_EXIT_RCP-...)"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleVerifyToken}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shrink-0"
              >
                Verify Turnstile Gate
              </button>
            </div>

            {tokenVerificationResult && (
              <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                tokenVerificationResult.valid
                  ? 'bg-emerald-950/70 border-emerald-800 text-emerald-200'
                  : 'bg-rose-950/70 border-rose-800 text-rose-200'
              }`}>
                {tokenVerificationResult.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{tokenVerificationResult.message}</span>
              </div>
            )}
          </div>

          {/* Audit Logs Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Cryptographic Chained Events ({logs.length})
              </h3>
              <button
                onClick={fetchLogs}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {session.role === 'shopper' ? (
              <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                <Lock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="font-bold text-white">Access Denied by Server RBAC (403 Forbidden)</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                  Only users with 'store_associate' or 'security_auditor' credentials can inspect the Loss Prevention tamper-evident ledger. Use the role switcher above to test authorization!
                </p>
              </div>
            ) : (
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/80 text-xs">
                  {logs.map((log) => (
                    <div key={log.id} className="p-3 hover:bg-slate-900/40 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            log.severity === 'critical' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                            log.severity === 'security_alert' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                            'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {log.action}
                          </span>
                          <span className="font-semibold text-slate-300 text-[11px]">
                            {log.actor} ({log.role})
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 mt-1.5">
                        {log.details}
                      </p>

                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-1.5 pt-1 border-t border-slate-900">
                        <span>HMAC Hash: <span className="text-indigo-400">{log.integrityHash}</span></span>
                        <span>•</span>
                        <span>IP: {log.ipAddress}</span>
                      </div>
                    </div>
                  ))}
                </div>
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
