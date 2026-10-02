import React, { useState, useEffect, useCallback } from 'react';
import {
  Timer,
  FilePlus,
  Play,
  Pause,
  Square,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Calendar,
  Trash2,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { categoryApi } from '../api/categoryApi';
import { subjectApi } from '../api/subjectApi';
import { chapterApi } from '../api/chapterApi';
import { topicApi } from '../api/topicApi';
import { studySessionApi } from '../api/studySessionApi';
import { useTimer } from '../context/TimerContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import Modal from '../components/Modal';

export default function Sessions() {
  const {
    isRunning,
    isPaused,
    formattedTime,
    category: activeCategory,
    subject: activeSubject,
    chapter: activeChapter,
    topic: activeTopic,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
  } = useTimer();

  // Mode: 'start' or 'log'
  const [activeTab, setActiveTab] = useState('start');

  // Categories list
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);

  // Cascading dropdown state for LIVE timer selection
  const [liveCategoryId, setLiveCategoryId] = useState('');
  const [liveSubjectId, setLiveSubjectId] = useState('');
  const [liveChapterId, setLiveChapterId] = useState('');
  const [liveTopicId, setLiveTopicId] = useState('');

  const [liveSubjects, setLiveSubjects] = useState([]);
  const [liveChapters, setLiveChapters] = useState([]);
  const [liveTopics, setLiveTopics] = useState([]);

  // Log session form state
  const [logCategoryId, setLogCategoryId] = useState('');
  const [logSubjectId, setLogSubjectId] = useState('');
  const [logChapterId, setLogChapterId] = useState('');
  const [logTopicId, setLogTopicId] = useState('');

  const [logSubjects, setLogSubjects] = useState([]);
  const [logChapters, setLogChapters] = useState([]);
  const [logTopics, setLogTopics] = useState([]);

  const [logDate, setLogDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [logStartTime, setLogStartTime] = useState('09:00');
  const [logEndTime, setLogEndTime] = useState('10:30');
  const [logNotes, setLogNotes] = useState('');
  const [logSubmitting, setLogSubmitting] = useState(false);

  // Feedback notifications
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [recentSessions, setRecentSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Stop session modal
  const [stopModalOpen, setStopModalOpen] = useState(false);
  const [stopSessionNotes, setStopSessionNotes] = useState('');
  const [stopping, setStopping] = useState(false);

  // Delete session modal
  const [deleteSessionId, setDeleteSessionId] = useState(null);

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      try {
        setLoadingCats(true);
        const data = await categoryApi.getAll();
        setCategories(data);
        if (data.length > 0) {
          setLiveCategoryId((prev) => prev || String(data[0].id));
          setLogCategoryId((prev) => prev || String(data[0].id));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCats(false);
      }
    }
    loadCategories();
  }, []);

  // Fetch recent sessions
  const fetchRecentSessions = useCallback(async () => {
    try {
      setLoadingSessions(true);
      const data = await studySessionApi.getAll({ limit: 15 });
      setRecentSessions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentSessions();

    const handleSessionSaved = () => {
      fetchRecentSessions();
    };
    window.addEventListener('study-session-saved', handleSessionSaved);
    return () => window.removeEventListener('study-session-saved', handleSessionSaved);
  }, [fetchRecentSessions]);

  // Handle Live category changes
  useEffect(() => {
    if (!liveCategoryId) {
      setLiveSubjects([]);
      setLiveSubjectId('');
      return;
    }
    subjectApi.getByCategory(liveCategoryId).then((data) => {
      setLiveSubjects(data);
      if (data.length > 0) {
        setLiveSubjectId(String(data[0].id));
      } else {
        setLiveSubjectId('');
      }
    }).catch(console.error);
  }, [liveCategoryId]);

  // Handle Live subject changes
  useEffect(() => {
    if (!liveSubjectId) {
      setLiveChapters([]);
      setLiveChapterId('');
      return;
    }
    chapterApi.getBySubject(liveSubjectId).then((data) => {
      setLiveChapters(data);
      if (data.length > 0) {
        setLiveChapterId(String(data[0].id));
      } else {
        setLiveChapterId('');
      }
    }).catch(console.error);
  }, [liveSubjectId]);

  // Handle Live chapter changes
  useEffect(() => {
    if (!liveChapterId) {
      setLiveTopics([]);
      setLiveTopicId('');
      return;
    }
    topicApi.getByChapter(liveChapterId).then((data) => {
      setLiveTopics(data);
      if (data.length > 0) {
        setLiveTopicId(String(data[0].id));
      } else {
        setLiveTopicId('');
      }
    }).catch(console.error);
  }, [liveChapterId]);

  // Handle Log category changes
  useEffect(() => {
    if (!logCategoryId) {
      setLogSubjects([]);
      setLogSubjectId('');
      return;
    }
    subjectApi.getByCategory(logCategoryId).then((data) => {
      setLogSubjects(data);
      if (data.length > 0) {
        setLogSubjectId(String(data[0].id));
      } else {
        setLogSubjectId('');
      }
    }).catch(console.error);
  }, [logCategoryId]);

  // Handle Log subject changes
  useEffect(() => {
    if (!logSubjectId) {
      setLogChapters([]);
      setLogChapterId('');
      return;
    }
    chapterApi.getBySubject(logSubjectId).then((data) => {
      setLogChapters(data);
      if (data.length > 0) {
        setLogChapterId(String(data[0].id));
      } else {
        setLogChapterId('');
      }
    }).catch(console.error);
  }, [logSubjectId]);

  // Handle Log chapter changes
  useEffect(() => {
    if (!logChapterId) {
      setLogTopics([]);
      setLogTopicId('');
      return;
    }
    topicApi.getByChapter(logChapterId).then((data) => {
      setLogTopics(data);
      if (data.length > 0) {
        setLogTopicId(String(data[0].id));
      } else {
        setLogTopicId('');
      }
    }).catch(console.error);
  }, [logChapterId]);

  // Start live timer handler
  const handleStartLiveSession = () => {
    if (!liveCategoryId || !liveSubjectId || !liveChapterId || !liveTopicId) {
      setStatusMessage({
        type: 'error',
        text: 'Please select Category, Subject, Chapter, and Topic before starting the timer.',
      });
      return;
    }

    const catObj = categories.find((c) => String(c.id) === String(liveCategoryId));
    const subObj = liveSubjects.find((s) => String(s.id) === String(liveSubjectId));
    const chapObj = liveChapters.find((c) => String(c.id) === String(liveChapterId));
    const topObj = liveTopics.find((t) => String(t.id) === String(liveTopicId));

    startTimer({
      category: catObj ? { id: catObj.id, name: catObj.name } : null,
      subject: subObj ? { id: subObj.id, name: subObj.name } : null,
      chapter: chapObj ? { id: chapObj.id, name: chapObj.name } : null,
      topic: topObj ? { id: topObj.id, name: topObj.name } : null,
    });

    setStatusMessage({ type: '', text: '' });
  };

  const handleOpenStopModal = () => {
    setStopSessionNotes('');
    setStopModalOpen(true);
  };

  const handleConfirmStopSession = async () => {
    try {
      setStopping(true);
      await stopTimer(stopSessionNotes);
      setStopModalOpen(false);
      setStatusMessage({
        type: 'success',
        text: 'Study session saved successfully.',
      });
      fetchRecentSessions();
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to save study session',
      });
    } finally {
      setStopping(false);
    }
  };

  // Submit Logged Session
  const handleLogSessionSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', text: '' });

    if (!logCategoryId || !logSubjectId || !logChapterId || !logTopicId) {
      setStatusMessage({
        type: 'error',
        text: 'Please complete all hierarchy selections (Category, Subject, Chapter, Topic). If none exist, create them in Syllabus.',
      });
      return;
    }

    if (!logStartTime || !logEndTime) {
      setStatusMessage({ type: 'error', text: 'Please specify both Start Time and End Time.' });
      return;
    }

    const startDateTime = new Date(`${logDate}T${logStartTime}:00`);
    const endDateTime = new Date(`${logDate}T${logEndTime}:00`);

    if (endDateTime <= startDateTime) {
      setStatusMessage({
        type: 'error',
        text: 'Validation Error: End time cannot be earlier than or equal to start time.',
      });
      return;
    }

    const diffSeconds = Math.round((endDateTime.getTime() - startDateTime.getTime()) / 1000);

    const payload = {
      category_id: parseInt(logCategoryId, 10),
      subject_id: parseInt(logSubjectId, 10),
      chapter_id: parseInt(logChapterId, 10),
      topic_id: parseInt(logTopicId, 10),
      session_type: 'LOGGED',
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      duration_seconds: diffSeconds,
      study_date: logDate,
      notes: logNotes.trim() || null,
    };

    try {
      setLogSubmitting(true);
      await studySessionApi.create(payload);
      setStatusMessage({
        type: 'success',
        text: 'Study session logged successfully.',
      });
      setLogNotes('');
      fetchRecentSessions();
      window.dispatchEvent(new CustomEvent('study-session-saved'));
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to log session.',
      });
    } finally {
      setLogSubmitting(false);
    }
  };

  // Delete session handler
  const handleDeleteSession = async () => {
    if (!deleteSessionId) return;
    try {
      await studySessionApi.delete(deleteSessionId);
      setDeleteSessionId(null);
      setStatusMessage({
        type: 'success',
        text: 'Session deleted successfully.',
      });
      fetchRecentSessions();
      window.dispatchEvent(new CustomEvent('study-session-saved'));
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to delete session',
      });
    }
  };

  // Helper duration formatter
  const formatSecs = (sec) => {
    const mins = Math.floor(sec / 60);
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return hrs > 0 ? `${hrs}h ${rem}m` : `${rem}m`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div className="pb-3 border-b border-slate-800">
        <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
          <Timer className="w-6 h-6 text-indigo-400" />
          STUDY SESSIONS
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Track live focused sessions with continuous timer or log past study sessions manually.
        </p>
      </div>

      {/* Notifications */}
      {statusMessage.text && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
            statusMessage.type === 'error'
              ? 'bg-rose-950/70 border border-rose-500/40 text-rose-200'
              : 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-200'
          }`}
        >
          {statusMessage.type === 'error' ? (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* TWO MAJOR OPTIONS: START SESSION vs LOG SESSION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setActiveTab('start')}
          className={`p-6 rounded-2xl border text-left transition-all relative overflow-hidden ${
            activeTab === 'start'
              ? 'bg-gradient-to-br from-indigo-950/90 via-slate-900 to-slate-900 border-indigo-500 shadow-xl shadow-indigo-500/10 ring-2 ring-indigo-500/20'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-indigo-400 fill-indigo-400/20" />
              START SESSION
            </span>
            {activeTab === 'start' && (
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500"></span>
            )}
          </div>
          <p className="text-sm text-slate-400">
            Track a study session live with interactive stopwatch timer, pause, resume, and auto-logging.
          </p>
        </button>

        <button
          onClick={() => setActiveTab('log')}
          className={`p-6 rounded-2xl border text-left transition-all relative overflow-hidden ${
            activeTab === 'log'
              ? 'bg-gradient-to-br from-indigo-950/90 via-slate-900 to-slate-900 border-indigo-500 shadow-xl shadow-indigo-500/10 ring-2 ring-indigo-500/20'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold text-white flex items-center gap-2">
              <FilePlus className="w-5 h-5 text-indigo-400" />
              LOG SESSION
            </span>
            {activeTab === 'log' && (
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500"></span>
            )}
          </div>
          <p className="text-sm text-slate-400">
            Enter a study session manually for past offline study time or when you forgot to run the timer.
          </p>
        </button>
      </div>

      {/* START SESSION INTERFACE */}
      {activeTab === 'start' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Live Study Session Tracker</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Select your study topic from your custom syllabus and initiate timer.
              </p>
            </div>
            {isRunning && (
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-950/80 border border-emerald-500/40 rounded-full font-mono text-xs text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                ACTIVE
              </div>
            )}
          </div>

          {/* If a timer is already running */}
          {isRunning ? (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/40 space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Currently Studying</span>
                <div className="text-lg md:text-xl font-bold text-white flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600/30 text-indigo-300 text-sm border border-indigo-500/30 font-mono">
                    {activeCategory?.name}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-200">{activeSubject?.name}</span>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-300">{activeChapter?.name}</span>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                  <span className="text-emerald-400 font-extrabold">{activeTopic?.name}</span>
                </div>
              </div>

              {/* Timer Clock display */}
              <div className="text-center py-6 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                <div className="font-mono text-5xl md:text-6xl font-extrabold text-emerald-300 tracking-wider">
                  {formattedTime}
                </div>
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  {isPaused ? 'SESSION PAUSED' : 'TIMER RUNNING'}
                </div>
              </div>

              {/* Controls: [START/RESUME] [PAUSE] [STOP] */}
              <div className="flex flex-wrap items-center justify-center gap-4">
                {isPaused ? (
                  <button
                    onClick={resumeTimer}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 transition transform active:scale-95"
                  >
                    <Play className="w-5 h-5 fill-white" />
                    <span>RESUME</span>
                  </button>
                ) : (
                  <button
                    onClick={pauseTimer}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-xl shadow-amber-600/30 transition transform active:scale-95"
                  >
                    <Pause className="w-5 h-5 fill-white" />
                    <span>PAUSE</span>
                  </button>
                )}

                <button
                  onClick={handleOpenStopModal}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-xl shadow-rose-600/30 transition transform active:scale-95"
                >
                  <Square className="w-5 h-5 fill-white" />
                  <span>STOP & SAVE</span>
                </button>
              </div>
            </div>
          ) : (
            /* Timer is idle: hierarchy picker */
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Category */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    1. CATEGORY
                  </label>
                  <select
                    value={liveCategoryId}
                    onChange={(e) => setLiveCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium text-sm focus:outline-hidden focus:border-indigo-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Subject */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    2. SUBJECT
                  </label>
                  <select
                    value={liveSubjectId}
                    onChange={(e) => setLiveSubjectId(e.target.value)}
                    disabled={liveSubjects.length === 0}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium text-sm focus:outline-hidden focus:border-indigo-500 disabled:opacity-50"
                  >
                    {liveSubjects.length === 0 ? (
                      <option value="">No subjects (add in Syllabus)</option>
                    ) : (
                      liveSubjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* 3. Chapter */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    3. CHAPTER
                  </label>
                  <select
                    value={liveChapterId}
                    onChange={(e) => setLiveChapterId(e.target.value)}
                    disabled={liveChapters.length === 0}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium text-sm focus:outline-hidden focus:border-indigo-500 disabled:opacity-50"
                  >
                    {liveChapters.length === 0 ? (
                      <option value="">No chapters (add in Syllabus)</option>
                    ) : (
                      liveChapters.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* 4. Topic */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    4. TOPIC
                  </label>
                  <select
                    value={liveTopicId}
                    onChange={(e) => setLiveTopicId(e.target.value)}
                    disabled={liveTopics.length === 0}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium text-sm focus:outline-hidden focus:border-indigo-500 disabled:opacity-50"
                  >
                    {liveTopics.length === 0 ? (
                      <option value="">No topics (add in Syllabus)</option>
                    ) : (
                      liveTopics.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Hierarchy path preview */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-slate-300">Hierarchy:</span>
                  <span className="text-indigo-400 font-bold">
                    {categories.find((c) => String(c.id) === String(liveCategoryId))?.name || 'Category'}
                  </span>
                  <span>↓</span>
                  <span className="text-slate-200">
                    {liveSubjects.find((s) => String(s.id) === String(liveSubjectId))?.name || 'Subject'}
                  </span>
                  <span>↓</span>
                  <span className="text-slate-300">
                    {liveChapters.find((c) => String(c.id) === String(liveChapterId))?.name || 'Chapter'}
                  </span>
                  <span>↓</span>
                  <span className="text-emerald-400 font-bold">
                    {liveTopics.find((t) => String(t.id) === String(liveTopicId))?.name || 'Topic'}
                  </span>
                </div>
              </div>

              {/* Timer Ready section */}
              <div className="text-center py-6 bg-slate-950/40 rounded-2xl border border-slate-800 space-y-4">
                <div className="text-xs uppercase font-bold tracking-widest text-slate-400">START TIMER</div>
                <div className="font-mono text-5xl font-extrabold text-slate-300">00:00:00</div>
                <div>
                  <button
                    onClick={handleStartLiveSession}
                    disabled={!liveTopicId}
                    className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-base shadow-xl shadow-emerald-600/30 transition transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Play className="w-5 h-5 fill-white" />
                    <span>START</span>
                  </button>
                </div>
                {!liveTopicId && (
                  <p className="text-xs text-amber-400/90">
                    Please ensure the selected Chapter has Topics. You can create them in the Syllabus page.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* LOG SESSION INTERFACE */}
      {activeTab === 'log' && (
        <form
          onSubmit={handleLogSessionSubmit}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl space-y-6"
        >
          <div className="pb-4 border-b border-slate-800">
            <h2 className="text-lg font-bold text-white tracking-wide">Log Study Session Manually</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Record a previously completed study session with exact start and end times.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Category
              </label>
              <select
                value={logCategoryId}
                onChange={(e) => setLogCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium text-sm focus:outline-hidden focus:border-indigo-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Subject
              </label>
              <select
                value={logSubjectId}
                onChange={(e) => setLogSubjectId(e.target.value)}
                disabled={logSubjects.length === 0}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium text-sm focus:outline-hidden focus:border-indigo-500 disabled:opacity-50"
              >
                {logSubjects.length === 0 ? (
                  <option value="">No subjects</option>
                ) : (
                  logSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Chapter */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Chapter
              </label>
              <select
                value={logChapterId}
                onChange={(e) => setLogChapterId(e.target.value)}
                disabled={logChapters.length === 0}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium text-sm focus:outline-hidden focus:border-indigo-500 disabled:opacity-50"
              >
                {logChapters.length === 0 ? (
                  <option value="">No chapters</option>
                ) : (
                  logChapters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Topic */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Topic
              </label>
              <select
                value={logTopicId}
                onChange={(e) => setLogTopicId(e.target.value)}
                disabled={logTopics.length === 0}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium text-sm focus:outline-hidden focus:border-indigo-500 disabled:opacity-50"
              >
                {logTopics.length === 0 ? (
                  <option value="">No topics</option>
                ) : (
                  logTopics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
            {/* Date */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Study Date
              </label>
              <input
                type="date"
                required
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Start Time
              </label>
              <input
                type="time"
                required
                value={logStartTime}
                onChange={(e) => setLogStartTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* End Time */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                End Time
              </label>
              <input
                type="time"
                required
                value={logEndTime}
                onChange={(e) => setLogEndTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={logNotes}
              onChange={(e) => setLogNotes(e.target.value)}
              placeholder="Concepts reviewed, practice questions solved, etc."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={logSubmitting || !logTopicId}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition transform active:scale-95 disabled:opacity-50"
            >
              {logSubmitting ? 'Saving Session...' : 'SAVE SESSION'}
            </button>
          </div>
        </form>
      )}

      {/* RECENT SESSIONS TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            RECENT SESSIONS
          </h2>
          <span className="text-xs text-slate-400">{recentSessions.length} recorded</span>
        </div>

        {recentSessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-800/70 text-slate-400 border-b border-slate-700/60 font-semibold">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Date</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Chapter</th>
                  <th className="px-4 py-3">Topic</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 rounded-r-lg text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {recentSessions.map((sess) => (
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
                        {sess.session_type === 'LIVE' ? 'Live Session' : 'Logged Session'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setDeleteSessionId(sess.id)}
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
            No study sessions recorded yet. Start a live timer or log a completed session above!
          </div>
        )}
      </div>

      {/* Stop Session Notes Modal */}
      <Modal
        isOpen={stopModalOpen}
        onClose={() => !stopping && setStopModalOpen(false)}
        title="Save Study Session"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 text-sm space-y-1">
            <div className="text-xs uppercase font-bold text-slate-400">Session Summary</div>
            <div className="text-white font-semibold">
              {activeCategory?.name} → {activeSubject?.name} → {activeChapter?.name} → {activeTopic?.name}
            </div>
            <div className="text-emerald-400 font-mono font-bold pt-1">
              Duration: {formattedTime}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Add Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={stopSessionNotes}
              onChange={(e) => setStopSessionNotes(e.target.value)}
              placeholder="What questions or topics did you cover?"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={stopping}
              onClick={() => setStopModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={stopping}
              onClick={handleConfirmStopSession}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
            >
              {stopping ? 'Saving...' : 'Save Session'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteSessionId !== null}
        onClose={() => setDeleteSessionId(null)}
        title="Confirm Delete Session"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Are you sure you want to delete this study session? This will recalculate all performance and history metrics.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setDeleteSessionId(null)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteSession}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-lg shadow-rose-600/30 transition"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
