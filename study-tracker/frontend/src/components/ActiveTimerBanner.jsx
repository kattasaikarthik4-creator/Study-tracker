import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Square, ChevronRight, Clock, AlertCircle } from 'lucide-react';
import { useTimer } from '../context/TimerContext';
import Modal from './Modal';

export default function ActiveTimerBanner() {
  const {
    isRunning,
    isPaused,
    formattedTime,
    category,
    subject,
    chapter,
    topic,
    pauseTimer,
    resumeTimer,
    stopTimer,
    saveStatus,
  } = useTimer();

  const [confirmStopOpen, setConfirmStopOpen] = useState(false);
  const [stopNotes, setStopNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  if (!isRunning) return null;

  const handleStopClick = () => {
    setErrorMsg('');
    setConfirmStopOpen(true);
  };

  const handleConfirmStop = async () => {
    try {
      setSubmitting(true);
      setErrorMsg('');
      await stopTimer(stopNotes);
      setConfirmStopOpen(false);
      setStopNotes('');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save session');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-indigo-950/90 border border-emerald-500/40 rounded-2xl p-4 shadow-xl mb-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Hierarchy Info */}
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isPaused ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isPaused ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
              </span>
              <span className="text-xs font-semibold tracking-wider uppercase text-emerald-400">
                {isPaused ? 'Session Paused' : 'Currently Studying Live'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-sm md:text-base font-semibold text-slate-100">
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold border border-indigo-500/30">
                {category?.name || 'CATEGORY'}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <span className="text-slate-200">{subject?.name || 'Subject'}</span>
              <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <span className="text-slate-300">{chapter?.name || 'Chapter'}</span>
              <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <span className="text-emerald-400 font-bold">{topic?.name || 'Topic'}</span>
            </div>
          </div>

          {/* Timer Display and Controls */}
          <div className="flex items-center justify-between md:justify-end gap-4">
            <div className="flex items-center gap-2 font-mono text-2xl md:text-3xl font-bold tracking-wider text-emerald-300 bg-slate-950/60 px-4 py-2 rounded-xl border border-emerald-500/30">
              <Clock className={`w-5 h-5 text-emerald-400 ${isPaused ? '' : 'animate-spin-slow'}`} />
              <span>{formattedTime}</span>
            </div>

            <div className="flex items-center gap-2">
              {isPaused ? (
                <button
                  onClick={resumeTimer}
                  title="Resume Study Session"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-600/30 transition transform active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Resume</span>
                </button>
              ) : (
                <button
                  onClick={pauseTimer}
                  title="Pause Study Session"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold shadow-lg shadow-amber-600/30 transition transform active:scale-95"
                >
                  <Pause className="w-4 h-4 fill-white" />
                  <span>Pause</span>
                </button>
              )}

              <button
                onClick={handleStopClick}
                title="Stop and Save Study Session"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold shadow-lg shadow-rose-600/30 transition transform active:scale-95"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Stop</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stop & Save Modal */}
      <Modal
        isOpen={confirmStopOpen}
        onClose={() => !submitting && setConfirmStopOpen(false)}
        title="Complete Study Session"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2 text-sm">
            <div className="text-slate-400">Review your study session:</div>
            <div className="font-semibold text-white">
              {category?.name} → {subject?.name} → {chapter?.name} → {topic?.name}
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-700/60">
              <span className="text-slate-400">Elapsed Time:</span>
              <span className="font-mono text-emerald-400 font-bold text-base">{formattedTime}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Session Notes (Optional)
            </label>
            <textarea
              value={stopNotes}
              onChange={(e) => setStopNotes(e.target.value)}
              placeholder="What did you solve or understand in this topic?"
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => setConfirmStopOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleConfirmStop}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Study Session'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
