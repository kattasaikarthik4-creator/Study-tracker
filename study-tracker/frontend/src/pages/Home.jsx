import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  BookOpen,
  Play,
  Pause,
  Square,
  Sparkles,
  Award,
  Calendar as CalendarIcon,
  ChevronRight,
  TrendingUp,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { studySessionApi } from '../api/studySessionApi';
import { categoryApi } from '../api/categoryApi';
import { performanceApi } from '../api/performanceApi';
import { useTimer } from '../context/TimerContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function Home() {
  const navigate = useNavigate();
  const {
    isRunning,
    isPaused,
    formattedTime,
    category: activeCategory,
    subject: activeSubject,
    chapter: activeChapter,
    topic: activeTopic,
    pauseTimer,
    resumeTimer,
    stopTimer,
  } = useTimer();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [todayData, setTodayData] = useState({
    total_formatted: '0m',
    total_seconds: 0,
    categories: {
      GATE: { formatted: '0m', seconds: 0, hours: 0 },
      SEMESTER: { formatted: '0m', seconds: 0, hours: 0 },
      LABS: { formatted: '0m', seconds: 0, hours: 0 },
    },
    sessions: [],
  });

  const [categoryPerformances, setCategoryPerformances] = useState({
    GATE: null,
    SEMESTER: null,
    LABS: null,
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const todayRes = await studySessionApi.getToday();
      setTodayData(todayRes);

      // Fetch performance data for categories
      const [gatePerf, semPerf, labsPerf] = await Promise.allSettled([
        performanceApi.getGate(),
        performanceApi.getSemester(),
        performanceApi.getLabs(),
      ]);

      setCategoryPerformances({
        GATE: gatePerf.status === 'fulfilled' ? gatePerf.value : null,
        SEMESTER: semPerf.status === 'fulfilled' ? semPerf.value : null,
        LABS: labsPerf.status === 'fulfilled' ? labsPerf.value : null,
      });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    // Listen for saved study sessions
    const handleSessionSaved = () => {
      fetchDashboardData();
    };
    window.addEventListener('study-session-saved', handleSessionSaved);
    return () => window.removeEventListener('study-session-saved', handleSessionSaved);
  }, [fetchDashboardData]);

  // Format today's date
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  if (loading && !todayData.sessions) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  const gateToday = todayData.categories?.GATE?.formatted || '0m';
  const semToday = todayData.categories?.SEMESTER?.formatted || '0m';
  const labsToday = todayData.categories?.LABS?.formatted || '0m';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl md:text-2xl font-black tracking-tight text-white">
              Welcome Back!
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-3 h-3" /> Study Tracker
            </span>
          </div>
          <p className="text-slate-400 text-sm flex items-center gap-1.5 mt-1 font-medium">
            <CalendarIcon className="w-4 h-4 text-indigo-400" />
            {todayFormatted}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/sessions')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition transform active:scale-95"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Go to Sessions</span>
          </button>
        </div>
      </div>

      <ErrorMessage message={error} onRetry={fetchDashboardData} />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today Total */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Today's Total</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {todayData.total_formatted || '0m'}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>{todayData.sessions?.length || 0} sessions today</span>
          </div>
        </div>

        {/* GATE Card */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-blue-500/40 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">GATE Time</span>
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">
              GATE
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white tracking-tight">{gateToday}</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">Competitive Exam Preparation</div>
        </div>

        {/* SEMESTER Card */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">SEMESTER Time</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              SEM
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white tracking-tight">{semToday}</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">University Curriculum</div>
        </div>

        {/* LABS Card */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-purple-500/40 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">LABS Time</span>
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold text-xs">
              LAB
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white tracking-tight">{labsToday}</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">Practical & Hands-on Work</div>
        </div>
      </div>

      {/* TODAY'S PROGRESS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            TODAY'S PROGRESS
          </h2>
          <span className="text-xs text-slate-400">Calculated from stored study sessions</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* GATE Progress */}
          {(() => {
            const perf = categoryPerformances.GATE;
            const target = perf ? perf.target_hours : 0;
            const spentSec = todayData.categories?.GATE?.seconds || 0;
            const spentHrs = Number((spentSec / 3600).toFixed(1));
            const pct = target > 0 ? Math.min(100, Math.round((spentHrs / target) * 100)) : (spentSec > 0 ? 100 : 0);

            return (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    <span className="font-bold text-white text-sm">GATE</span>
                  </div>
                  <span className="text-xs font-bold text-blue-400">{todayData.categories?.GATE?.formatted || '0m'}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{target > 0 ? `Target: ${target}h total` : 'No target set'}</span>
                  <span>{target > 0 ? `${pct}% of target` : 'Active'}</span>
                </div>
              </div>
            );
          })()}

          {/* SEMESTER Progress */}
          {(() => {
            const perf = categoryPerformances.SEMESTER;
            const target = perf ? perf.target_hours : 0;
            const spentSec = todayData.categories?.SEMESTER?.seconds || 0;
            const spentHrs = Number((spentSec / 3600).toFixed(1));
            const pct = target > 0 ? Math.min(100, Math.round((spentHrs / target) * 100)) : (spentSec > 0 ? 100 : 0);

            return (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="font-bold text-white text-sm">SEMESTER</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">{todayData.categories?.SEMESTER?.formatted || '0m'}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{target > 0 ? `Target: ${target}h total` : 'No target set'}</span>
                  <span>{target > 0 ? `${pct}% of target` : 'Active'}</span>
                </div>
              </div>
            );
          })()}

          {/* LABS Progress */}
          {(() => {
            const perf = categoryPerformances.LABS;
            const target = perf ? perf.target_hours : 0;
            const spentSec = todayData.categories?.LABS?.seconds || 0;
            const spentHrs = Number((spentSec / 3600).toFixed(1));
            const pct = target > 0 ? Math.min(100, Math.round((spentHrs / target) * 100)) : (spentSec > 0 ? 100 : 0);

            return (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                    <span className="font-bold text-white text-sm">LABS</span>
                  </div>
                  <span className="text-xs font-bold text-purple-400">{todayData.categories?.LABS?.formatted || '0m'}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-purple-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{target > 0 ? `Target: ${target}h total` : 'No target set'}</span>
                  <span>{target > 0 ? `${pct}% of target` : 'Active'}</span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* CURRENT SESSION CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-400" />
          CURRENT SESSION
        </h2>

        {isRunning ? (
          <div className="p-5 rounded-xl bg-slate-800/80 border border-emerald-500/40 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                Currently Studying
              </span>
              <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                {isPaused ? 'PAUSED' : 'RUNNING'}
              </span>
            </div>

            <div className="space-y-1.5 text-sm md:text-base font-semibold text-slate-100 pl-1">
              <div className="text-indigo-400 font-bold">{activeCategory?.name}</div>
              <div className="text-slate-300">→ {activeSubject?.name}</div>
              <div className="text-slate-400">→ {activeChapter?.name}</div>
              <div className="text-emerald-400 font-bold">→ {activeTopic?.name}</div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-700/60">
              <div className="font-mono text-3xl font-extrabold tracking-wider text-emerald-300">
                {formattedTime}
              </div>

              <div className="flex items-center gap-2">
                {isPaused ? (
                  <button
                    onClick={resumeTimer}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition shadow-lg shadow-emerald-600/30"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Resume</span>
                  </button>
                ) : (
                  <button
                    onClick={pauseTimer}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition shadow-lg shadow-amber-600/30"
                  >
                    <Pause className="w-4 h-4 fill-white" />
                    <span>Pause</span>
                  </button>
                )}

                <button
                  onClick={() => stopTimer()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition shadow-lg shadow-rose-600/30"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Stop</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 px-4 rounded-xl bg-slate-800/30 border border-dashed border-slate-800 space-y-3">
            <p className="text-slate-400 text-sm font-medium">No active study session</p>
            <button
              onClick={() => navigate('/sessions')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Session</span>
            </button>
          </div>
        )}
      </div>

      {/* RECENT SESSIONS TABLE ON HOME */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-400" />
            RECENT SESSIONS (TODAY)
          </h2>
          <button
            onClick={() => navigate('/history')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
          >
            <span>View All History</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {todayData.sessions && todayData.sessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-800/70 text-slate-400 border-b border-slate-700/60 font-semibold">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Category</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Chapter</th>
                  <th className="px-4 py-3">Topic</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3 rounded-r-lg">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {todayData.sessions.map((sess) => {
                  const mins = Math.floor(sess.duration_seconds / 60);
                  const hrs = Math.floor(mins / 60);
                  const remMins = mins % 60;
                  const durStr = hrs > 0 ? `${hrs}h ${remMins}m` : `${remMins}m`;

                  return (
                    <tr key={sess.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-semibold text-white">
                        <span className="px-2 py-0.5 rounded text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {sess.category_name || 'CATEGORY'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-200">{sess.subject_name || '-'}</td>
                      <td className="px-4 py-3 text-slate-300">{sess.chapter_name || '-'}</td>
                      <td className="px-4 py-3 text-emerald-400 font-medium">{sess.topic_name || '-'}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-100">{durStr}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            sess.session_type === 'LIVE'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                              : 'bg-blue-950 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {sess.session_type === 'LIVE' ? 'Live' : 'Logged'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-sm">
            No study sessions recorded today yet. Select "Start Session" to begin!
          </div>
        )}
      </div>
    </div>
  );
}
