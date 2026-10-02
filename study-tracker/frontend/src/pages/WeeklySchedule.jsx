import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { scheduleApi } from '../api/scheduleApi';
import { categoryApi } from '../api/categoryApi';
import { subjectApi } from '../api/subjectApi';
import { chapterApi } from '../api/chapterApi';
import { topicApi } from '../api/topicApi';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import Modal from '../components/Modal';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function WeeklySchedule() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active day filter for mobile / focused view
  const [selectedDayTab, setSelectedDayTab] = useState('All');

  // Categories & dropdown lists for Schedule Modal
  const [categories, setCategories] = useState([]);
  const [modalCatId, setModalCatId] = useState('');
  const [modalSubId, setModalSubId] = useState('');
  const [modalChapId, setModalChapId] = useState('');
  const [modalTopId, setModalTopId] = useState('');

  const [subjectsList, setSubjectsList] = useState([]);
  const [chaptersList, setChaptersList] = useState([]);
  const [topicsList, setTopicsList] = useState([]);

  // Modal open states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    day: 'Monday',
    start_time: '08:00',
    end_time: '09:30',
    notes: '',
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await scheduleApi.getAll();
      setSchedules(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load timetable schedules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
    categoryApi.getAll().then((cats) => {
      setCategories(cats);
      if (cats.length > 0) setModalCatId(String(cats[0].id));
    }).catch(console.error);
  }, [fetchSchedules]);

  // Handle cascading dropdowns for modal
  useEffect(() => {
    if (!modalCatId) {
      setSubjectsList([]);
      setModalSubId('');
      return;
    }
    subjectApi.getByCategory(modalCatId).then((subs) => {
      setSubjectsList(subs);
      if (subs.length > 0) setModalSubId(String(subs[0].id));
      else setModalSubId('');
    }).catch(console.error);
  }, [modalCatId]);

  useEffect(() => {
    if (!modalSubId) {
      setChaptersList([]);
      setModalChapId('');
      return;
    }
    chapterApi.getBySubject(modalSubId).then((chaps) => {
      setChaptersList(chaps);
      if (chaps.length > 0) setModalChapId(String(chaps[0].id));
      else setModalChapId('');
    }).catch(console.error);
  }, [modalSubId]);

  useEffect(() => {
    if (!modalChapId) {
      setTopicsList([]);
      setModalTopId('');
      return;
    }
    topicApi.getByChapter(modalChapId).then((tops) => {
      setTopicsList(tops);
      if (tops.length > 0) setModalTopId(String(tops[0].id));
      else setModalTopId('');
    }).catch(console.error);
  }, [modalChapId]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      day: selectedDayTab !== 'All' ? selectedDayTab : 'Monday',
      start_time: '08:00',
      end_time: '09:30',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      day: item.day,
      start_time: item.start_time,
      end_time: item.end_time,
      notes: item.notes || '',
    });
    if (item.category_id) setModalCatId(String(item.category_id));
    if (item.subject_id) setModalSubId(String(item.subject_id));
    if (item.chapter_id) setModalChapId(String(item.chapter_id));
    if (item.topic_id) setModalTopId(String(item.topic_id));
    setIsModalOpen(true);
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const payload = {
      title: formData.title.trim(),
      category_id: modalCatId ? parseInt(modalCatId, 10) : null,
      subject_id: modalSubId ? parseInt(modalSubId, 10) : null,
      chapter_id: modalChapId ? parseInt(modalChapId, 10) : null,
      topic_id: modalTopId ? parseInt(modalTopId, 10) : null,
      day: formData.day,
      start_time: formData.start_time,
      end_time: formData.end_time,
      notes: formData.notes.trim() || null,
    };

    try {
      setSaving(true);
      if (editingItem) {
        await scheduleApi.update(editingItem.id, payload);
        setStatusMsg({ type: 'success', text: 'Schedule slot updated successfully.' });
      } else {
        await scheduleApi.create(payload);
        setStatusMsg({ type: 'success', text: 'New schedule slot added to timetable.' });
      }
      setIsModalOpen(false);
      await fetchSchedules();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to save schedule slot' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!deleteConfirmId) return;
    try {
      setSaving(true);
      await scheduleApi.delete(deleteConfirmId);
      setDeleteConfirmId(null);
      setStatusMsg({ type: 'success', text: 'Schedule slot removed.' });
      await fetchSchedules();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to delete schedule slot' });
    } finally {
      setSaving(false);
    }
  };

  // Group schedules by day
  const schedulesByDay = useMemo(() => {
    const map = {};
    DAYS.forEach((d) => {
      map[d] = [];
    });
    schedules.forEach((s) => {
      if (map[s.day]) {
        map[s.day].push(s);
      }
    });
    // Sort each day chronologically by start_time
    DAYS.forEach((d) => {
      map[d].sort((a, b) => a.start_time.localeCompare(b.start_time));
    });
    return map;
  }, [schedules]);

  if (loading && schedules.length === 0) {
    return <LoadingSpinner message="Loading weekly schedule..." />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-indigo-400" />
            WEEKLY SCHEDULE & TIMETABLE
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Organize and plan your study routine across days and time slots from 5 AM to 11 PM.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ ADD SCHEDULE</span>
        </button>
      </div>

      <ErrorMessage message={error} onRetry={fetchSchedules} />

      {statusMsg.text && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
            statusMsg.type === 'error'
              ? 'bg-rose-950/70 border border-rose-500/40 text-rose-200'
              : 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-200'
          }`}
        >
          {statusMsg.type === 'error' ? (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Filter Tabs for Day selection (Mobile / focus view) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedDayTab('All')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
            selectedDayTab === 'All'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Full Week Grid
        </button>
        {DAYS.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDayTab(d)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedDayTab === d
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {d} ({schedulesByDay[d]?.length || 0})
          </button>
        ))}
      </div>

      {/* TIMETABLE GRID VIEW */}
      {selectedDayTab === 'All' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-4">
          {DAYS.map((day) => {
            const dayItems = schedulesByDay[day] || [];

            return (
              <div
                key={day}
                className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-full overflow-hidden shadow-lg"
              >
                {/* Day Header */}
                <div className="px-4 py-3 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
                  <span className="font-extrabold text-sm text-white tracking-wide">{day}</span>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-700/60 text-indigo-300">
                    {dayItems.length}
                  </span>
                </div>

                {/* Day Slots */}
                <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[600px]">
                  {dayItems.length > 0 ? (
                    dayItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/50 transition group space-y-2"
                      >
                        <div className="flex items-center justify-between gap-1 text-[11px] text-indigo-400 font-mono font-bold">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.start_time} - {item.end_time}
                          </span>
                          {item.category_name && (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px]">
                              {item.category_name}
                            </span>
                          )}
                        </div>

                        <div className="font-bold text-xs text-white leading-tight">
                          {item.title}
                        </div>

                        {(item.subject_name || item.topic_name) && (
                          <div className="text-[11px] text-slate-400 truncate">
                            {item.subject_name} {item.topic_name ? `→ ${item.topic_name}` : ''}
                          </div>
                        )}

                        {item.notes && (
                          <p className="text-[10px] text-slate-400 italic line-clamp-2">
                            "{item.notes}"
                          </p>
                        )}

                        <div className="flex items-center justify-end gap-1 pt-1 opacity-60 group-hover:opacity-100 transition">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="Edit slot"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(item.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                            title="Delete slot"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-xs text-slate-500 italic">
                      No study slots
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Single Day Focused View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-lg font-bold text-white tracking-wide">{selectedDayTab} Schedule</h2>
            <span className="text-xs text-slate-400">
              {schedulesByDay[selectedDayTab]?.length || 0} scheduled slots
            </span>
          </div>

          <div className="space-y-3">
            {schedulesByDay[selectedDayTab]?.length > 0 ? (
              schedulesByDay[selectedDayTab].map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                        {item.start_time} - {item.end_time}
                      </span>
                      {item.category_name && (
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                          {item.category_name}
                        </span>
                      )}
                    </div>
                    <div className="text-base font-bold text-white">{item.title}</div>
                    {(item.subject_name || item.topic_name) && (
                      <div className="text-xs text-slate-400">
                        {item.subject_name} {item.chapter_name ? `→ ${item.chapter_name}` : ''}{' '}
                        {item.topic_name ? `→ ${item.topic_name}` : ''}
                      </div>
                    )}
                    {item.notes && <p className="text-xs text-slate-400 italic">"{item.notes}"</p>}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(item.id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-semibold border border-rose-500/30 transition flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-500 text-sm">
                No slots scheduled for {selectedDayTab}. Click "+ ADD SCHEDULE" to plan your day.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD / EDIT SCHEDULE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !saving && setIsModalOpen(false)}
        title={editingItem ? 'Edit Timetable Slot' : 'Add Timetable Slot'}
      >
        <form onSubmit={handleSaveSchedule} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. TOC Finite Automata practice"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Day of Week
              </label>
              <select
                value={formData.day}
                onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-hidden focus:border-indigo-500"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Start Time
              </label>
              <input
                type="time"
                required
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                End Time
              </label>
              <input
                type="time"
                required
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Category (Optional)
              </label>
              <select
                value={modalCatId}
                onChange={(e) => setModalCatId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-indigo-500"
              >
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Subject (Optional)
              </label>
              <select
                value={modalSubId}
                onChange={(e) => setModalSubId(e.target.value)}
                disabled={subjectsList.length === 0}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-indigo-500 disabled:opacity-50"
              >
                <option value="">None</option>
                {subjectsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Chapter (Optional)
              </label>
              <select
                value={modalChapId}
                onChange={(e) => setModalChapId(e.target.value)}
                disabled={chaptersList.length === 0}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-indigo-500 disabled:opacity-50"
              >
                <option value="">None</option>
                {chaptersList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Topic (Optional)
              </label>
              <select
                value={modalTopId}
                onChange={(e) => setModalTopId(e.target.value)}
                disabled={topicsList.length === 0}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-indigo-500 disabled:opacity-50"
              >
                <option value="">None</option>
                {topicsList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Notes
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Books, problem sets, or goals for this time slot..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              disabled={saving}
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !formData.title.trim()}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingItem ? 'Update Slot' : 'Save Slot'}
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Timetable Slot"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Are you sure you want to remove this schedule slot from your timetable?
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteSchedule}
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
