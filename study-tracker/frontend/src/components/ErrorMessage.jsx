import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorMessage({ message, onRetry }) {
  if (!message) return null;

  return (
    <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 flex items-start justify-between gap-3 my-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-semibold text-rose-200">Error Occurred</h4>
          <p className="text-xs text-rose-300/90 mt-0.5 leading-relaxed">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-900 text-rose-200 text-xs font-semibold border border-rose-500/40 transition flex-shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}
