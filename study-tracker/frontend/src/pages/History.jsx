import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  History as HistoryIcon,
  Filter,
  Calendar,
  Clock,
  BarChart3,
  Layers,
  ChevronDown,
  Trash2,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { historyApi } from '../api/historyApi';
import { studySessionApi } from '../api/studySessionApi';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import Modal from '../components/Modal';

export default function History() {
  // Period filter: 7, 30, or custom
  const [periodOption, setPeriodOption] = useState('7'); // 'today' | '7' | '30' | 'custom'
  const [customDays, setCustomDays] = useState(14);
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Table Category Filter
  const [categoryFilter, setCategoryFilter] = useState('ALL'); // 'ALL' | 'GATE' | 'SEMESTER' | 'LABS'

  // Delete modal state
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let data;
      if (periodOption === '7') {
        data = await historyApi.getSevenDays();
      } else if (periodOption === '30') {
        data = await historyApi.getThirtyDays();
      } else if (periodOption === 'today') {
        data = await historyApi.getCustom(1);
      } else {
        data = await historyApi.getCustom(customDays || 7);
      }
      setHistoryData(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  }, [periodOption, customDays]);

  useEffect(() => {
    fetchHistory();

    const handleSessionSaved = () => {
      fetchHistory();
    };
    window.addEventListener('study-session-saved', handleSessionSaved);
    return () => window.removeEventListener('study-session-saved', handleSessionSaved);
  }, [fetchHistory]);

  // Filtered session list based on table filter
  const filteredSessions = useMemo(() => {
    if (!historyData?.sessions) return [];
    if (categoryFilter === 'ALL') return historyData.sessions;
    return historyData.sessions.filter(
      (s) => (s.category_name || '').toUpperCase() === categoryFilter.toUpperCase()
    );
  }, [historyData, categoryFilter]);

  const handleDeleteSession = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await studySessionApi.delete(deleteId);
      setDeleteId(null);
      await fetchHistory();
      window.dispatchEvent(new CustomEvent('study-session-saved'));
    } catch (err) {
      setError(err.message || 'Failed to delete session');
    } finally {
      setDeleting(false);
    }
  };

  const formatSecs = (sec) => {
    const mins = Math.floor(sec / 60);
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return hrs > 0 ? `${hrs}h ${rem}m` : `${rem}m`;
  };

  const formatTimeStr = (iso) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  if (loading && !historyData) {
    return <LoadingSpinner message="Loading study history logs..." />;
  }

  const gateSummary = historyData?.category_summaries?.GATE;
  const semSummary = historyData?.category_summaries?.SEMESTER;
  const labsSummary = historyData?.category_summaries?.LABS;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <HistoryIcon className="w-6 h-6 text-indigo-400" />
            STUDY HISTORY & LOGS
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Review detailed past study sessions, category breakdowns, and weekly timeline charts.
          </p>
        </div>

        {/* Date Filters: Today, Last 7 Days, Last 30 Days, Custom */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: 'Today', val: 'today' },
            { label: 'Last 7 Days', val: '7' },
            { label: 'Last 30 Days', val: '30' },
            { label: 'Custom', val: 'custom' },
          ].map((f) => (
            <button
              key={f.val}
              onClick={() => setPeriodOption(f.val)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                periodOption === f.val
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}

          {periodOption === 'custom' && (
            <div className="flex items-center gap-1.5 ml-1">
              <input
                type="number"
                min="1"
                max="365"
                value={customDays}
                onChange={(e) => setCustomDays(parseInt(e.target.value, 10) || 7)}
                className="w-16 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-mono"
              />
              <span className="text-xs text-slate-400">days</span>
            </div>
          )}
        </div>
      </div>

      <ErrorMessage message={error} onRetry={fetchHistory} />

      {/* SUMMARY CARDS (GATE, SEMESTER, LABS, TOTAL) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* GATE Hours */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">GATE</span>
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">
            {gateSummary ? `${gateSummary.hours}h` : '0h'}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono">
            {gateSummary?.formatted || '0m'}
          </div>
        </div>

        {/* SEMESTER Hours */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">SEMESTER</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">
            {semSummary ? `${semSummary.hours}h` : '0h'}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono">
            {semSummary?.formatted || '0m'}
          </div>
        </div>

        {/* LABS Hours */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">LABS</span>
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">
            {labsSummary ? `${labsSummary.hours}h` : '0h'}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono">
            {labsSummary?.formatted || '0m'}
          </div>
        </div>

        {/* TOTAL Hours */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">TOTAL</span>
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">
            {historyData ? `${historyData.total_hours}h` : '0h'}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono">
            {historyData?.total_formatted || '0m'} ({historyData?.total_sessions || 0} sessions)
          </div>
        </div>
      </div>

      {/* HISTORY CHART (Grouped / Stacked Bar Chart) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            Study Hours by Category Timeline
          </h2>
          <span className="text-xs text-slate-500">Hours per day</span>
        </div>

        {historyData?.chart_data && historyData.chart_data.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={historyData.chart_data}
                margin={{ top: 20, right: 20, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis
                  dataKey="day_name"
                  stroke="#94a3b8"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val, idx) => {
                    const item = historyData.chart_data[idx];
                    return `${val.substring(0, 3)} (${item?.date?.substring(5) || ''})`;
                  }}
                />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#475569',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                  formatter={(val, name) => [`${val} hrs`, name]}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: '10px' }} />
                <Bar dataKey="GATE" name="GATE" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="SEMESTER" name="SEMESTER" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="LABS" name="LABS" stackId="a" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-xs text-slate-500">
            No history data for the selected period.
          </div>
        )}
      </div>

      {/* HISTORY TABLE WITH FILTERS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">SESSION LOGS</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing {filteredSessions.length} recorded session(s)
            </p>
          </div>

          {/* Category Filter Buttons: All, GATE, Semester, Labs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
            {['ALL', 'GATE', 'SEMESTER', 'LABS'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  categoryFilter === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filteredSessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-800/70 text-slate-400 border-b border-slate-700/60 font-semibold">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Date</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Chapter</th>
                  <th className="px-4 py-3">Topic</th>
                  <th className="px-4 py-3">Start Time</th>
                  <th className="px-4 py-3">End Time</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Session Type</th>
                  <th className="px-4 py-3 rounded-r-lg text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredSessions.map((sess) => (
                  <tr key={sess.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-medium text-slate-200 whitespace-nowrap">
                      {sess.study_date}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      <span className="px-2 py-0.5 rounded text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {sess.category_name || 'CATEGORY'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-200">{sess.subject_name || '-'}</td>
                    <td className="px-4 py-3 text-slate-300">{sess.chapter_name || '-'}</td>
                    <td className="px-4 py-3 text-emerald-400 font-medium">{sess.topic_name || '-'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      {formatTimeStr(sess.start_time)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      {formatTimeStr(sess.end_time)}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-100">
                      {formatSecs(sess.duration_seconds)}
                    </td>
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
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setDeleteId(sess.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Delete session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-slate-500 text-sm">
            No study sessions found matching the current filters.
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteId !== null}
        onClose={() => !deleting && setDeleteId(null)}
        title="Delete Session Record"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Are you sure you want to delete this study session record? This action will permanently recalculate all performance and history metrics.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              disabled={deleting}
              onClick={() => setDeleteId(null)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              disabled={deleting}
              onClick={handleDeleteSession}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-lg shadow-rose-600/30 transition disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
