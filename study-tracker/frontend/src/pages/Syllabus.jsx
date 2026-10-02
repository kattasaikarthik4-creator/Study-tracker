import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  Search,
  Clock,
  Layers,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Folder,
  FolderOpen,
  FileText,
} from 'lucide-react';
import { categoryApi } from '../api/categoryApi';
import { subjectApi } from '../api/subjectApi';
import { chapterApi } from '../api/chapterApi';
import { topicApi } from '../api/topicApi';
import { syllabusApi } from '../api/syllabusApi';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import Modal from '../components/Modal';

export default function Syllabus() {
  const [categories, setCategories] = useState([]);
  const [selectedCategoryName, setSelectedCategoryName] = useState('GATE');
  const [fullSyllabus, setFullSyllabus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Expand / collapse tracking: sets of IDs
  const [expandedSubjects, setExpandedSubjects] = useState(new Set());
  const [expandedChapters, setExpandedChapters] = useState(new Set());

  // Modal states
  // 1. Add/Edit Subject Modal
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null); // null for new, object for edit
  const [subjectForm, setSubjectForm] = useState({ name: '', target_hours: '', description: '' });

  // 2. Add/Edit Chapter Modal
  const [chapterModalOpen, setChapterModalOpen] = useState(false);
  const [activeSubjectForChapter, setActiveSubjectForChapter] = useState(null);
  const [editingChapter, setEditingChapter] = useState(null);
  const [chapterForm, setChapterForm] = useState({ name: '', target_hours: '' });

  // 3. Add/Edit Topic Modal
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [activeChapterForTopic, setActiveChapterForTopic] = useState(null);
  const [editingTopic, setEditingTopic] = useState(null);
  const [topicForm, setTopicForm] = useState({ name: '', target_hours: '' });

  // 4. Delete Confirmation Modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: '', // 'subject' | 'chapter' | 'topic'
    id: null,
    name: '',
  });

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Fetch full syllabus tree
  const loadSyllabus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [cats, tree] = await Promise.all([
        categoryApi.getAll(),
        syllabusApi.getFullTree(),
      ]);
      setCategories(cats);
      setFullSyllabus(tree);

      // Auto-expand all subjects and chapters by default so user can view immediately
      const subIds = new Set();
      const chapIds = new Set();
      tree.forEach((c) => {
        c.subjects?.forEach((s) => {
          subIds.add(s.id);
          s.chapters?.forEach((ch) => {
            chapIds.add(ch.id);
          });
        });
      });
      setExpandedSubjects(subIds);
      setExpandedChapters(chapIds);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load syllabus');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSyllabus();
  }, [loadSyllabus]);

  // Selected Category Object
  const currentCategory = useMemo(() => {
    return fullSyllabus.find((c) => c.name.toUpperCase() === selectedCategoryName.toUpperCase()) || null;
  }, [fullSyllabus, selectedCategoryName]);

  // Filtered subjects based on search query
  const filteredSubjects = useMemo(() => {
    if (!currentCategory || !currentCategory.subjects) return [];
    if (!searchQuery.trim()) return currentCategory.subjects;

    const q = searchQuery.toLowerCase().trim();

    return currentCategory.subjects.reduce((acc, sub) => {
      const matchSubject = sub.name.toLowerCase().includes(q) || (sub.description && sub.description.toLowerCase().includes(q));

      const matchingChapters = (sub.chapters || []).reduce((chAcc, ch) => {
        const matchChapter = ch.name.toLowerCase().includes(q);
        const matchingTopics = (ch.topics || []).filter((t) => t.name.toLowerCase().includes(q));

        if (matchChapter || matchingTopics.length > 0) {
          chAcc.push({
            ...ch,
            topics: matchChapter ? ch.topics : matchingTopics,
          });
        }
        return chAcc;
      }, []);

      if (matchSubject || matchingChapters.length > 0) {
        acc.push({
          ...sub,
          chapters: matchSubject ? sub.chapters : matchingChapters,
        });
      }
      return acc;
    }, []);
  }, [currentCategory, searchQuery]);

  // Expand / collapse toggles
  const toggleSubject = (id) => {
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleChapter = (id) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // SUBJECT HANDLERS
  const handleOpenAddSubject = () => {
    setEditingSubject(null);
    setSubjectForm({ name: '', target_hours: '', description: '' });
    setSubjectModalOpen(true);
  };

  const handleOpenEditSubject = (sub) => {
    setEditingSubject(sub);
    setSubjectForm({
      name: sub.name,
      target_hours: sub.target_hours ? String(sub.target_hours) : '',
      description: sub.description || '',
    });
    setSubjectModalOpen(true);
  };

  const handleSaveSubject = async (e) => {
    e.preventDefault();
    if (!subjectForm.name.trim()) return;

    try {
      setSaving(true);
      if (editingSubject) {
        await subjectApi.update(editingSubject.id, {
          name: subjectForm.name.trim(),
          target_hours: parseFloat(subjectForm.target_hours) || 0,
          description: subjectForm.description.trim() || null,
        });
        setFeedback({ type: 'success', text: `Subject '${subjectForm.name}' updated successfully.` });
      } else {
        await subjectApi.create({
          category_id: currentCategory.id,
          name: subjectForm.name.trim(),
          target_hours: parseFloat(subjectForm.target_hours) || 0,
          description: subjectForm.description.trim() || null,
        });
        setFeedback({ type: 'success', text: `Subject '${subjectForm.name}' created successfully.` });
      }
      setSubjectModalOpen(false);
      await loadSyllabus();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to save subject' });
    } finally {
      setSaving(false);
    }
  };

  // CHAPTER HANDLERS
  const handleOpenAddChapter = (sub) => {
    setActiveSubjectForChapter(sub);
    setEditingChapter(null);
    setChapterForm({ name: '', target_hours: '' });
    setChapterModalOpen(true);
  };

  const handleOpenEditChapter = (sub, chap) => {
    setActiveSubjectForChapter(sub);
    setEditingChapter(chap);
    setChapterForm({
      name: chap.name,
      target_hours: chap.target_hours ? String(chap.target_hours) : '',
    });
    setChapterModalOpen(true);
  };

  const handleSaveChapter = async (e) => {
    e.preventDefault();
    if (!chapterForm.name.trim()) return;

    try {
      setSaving(true);
      if (editingChapter) {
        await chapterApi.update(editingChapter.id, {
          name: chapterForm.name.trim(),
          target_hours: parseFloat(chapterForm.target_hours) || 0,
        });
        setFeedback({ type: 'success', text: `Chapter '${chapterForm.name}' updated successfully.` });
      } else {
        await chapterApi.create({
          subject_id: activeSubjectForChapter.id,
          name: chapterForm.name.trim(),
          target_hours: parseFloat(chapterForm.target_hours) || 0,
        });
        setFeedback({ type: 'success', text: `Chapter '${chapterForm.name}' created successfully.` });
      }
      setChapterModalOpen(false);
      await loadSyllabus();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to save chapter' });
    } finally {
      setSaving(false);
    }
  };

  // TOPIC HANDLERS
  const handleOpenAddTopic = (chap) => {
    setActiveChapterForTopic(chap);
    setEditingTopic(null);
    setTopicForm({ name: '', target_hours: '' });
    setTopicModalOpen(true);
  };

  const handleOpenEditTopic = (chap, top) => {
    setActiveChapterForTopic(chap);
    setEditingTopic(top);
    setTopicForm({
      name: top.name,
      target_hours: top.target_hours ? String(top.target_hours) : '',
    });
    setTopicModalOpen(true);
  };

  const handleSaveTopic = async (e) => {
    e.preventDefault();
    if (!topicForm.name.trim()) return;

    try {
      setSaving(true);
      if (editingTopic) {
        await topicApi.update(editingTopic.id, {
          name: topicForm.name.trim(),
          target_hours: parseFloat(topicForm.target_hours) || 0,
        });
        setFeedback({ type: 'success', text: `Topic '${topicForm.name}' updated successfully.` });
      } else {
        await topicApi.create({
          chapter_id: activeChapterForTopic.id,
          name: topicForm.name.trim(),
          target_hours: parseFloat(topicForm.target_hours) || 0,
        });
        setFeedback({ type: 'success', text: `Topic '${topicForm.name}' created successfully.` });
      }
      setTopicModalOpen(false);
      await loadSyllabus();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to save topic' });
    } finally {
      setSaving(false);
    }
  };

  // DELETE HANDLERS
  const handleOpenDelete = (type, item) => {
    setDeleteModal({
      isOpen: true,
      type,
      id: item.id,
      name: item.name,
    });
  };

  const handleConfirmDelete = async () => {
    const { type, id, name } = deleteModal;
    try {
      setSaving(true);
      if (type === 'subject') {
        await subjectApi.delete(id);
      } else if (type === 'chapter') {
        await chapterApi.delete(id);
      } else if (type === 'topic') {
        await topicApi.delete(id);
      }
      setFeedback({ type: 'success', text: `${type.toUpperCase()} '${name}' deleted successfully.` });
      setDeleteModal({ isOpen: false, type: '', id: null, name: '' });
      await loadSyllabus();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || `Failed to delete ${type}` });
    } finally {
      setSaving(false);
    }
  };

  if (loading && fullSyllabus.length === 0) {
    return <LoadingSpinner message="Loading syllabus structure..." />;
  }

  const standardTabs = ['GATE', 'SEMESTER', 'LABS'];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title & Header */}
      <div className="pb-3 border-b border-slate-800">
        <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-indigo-400" />
          SYLLABUS MANAGEMENT
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Create, customize, and maintain your academic hierarchy: Category → Subject → Chapter → Topic.
        </p>
      </div>

      {/* Notifications */}
      {feedback.text && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-medium ${
            feedback.type === 'error'
              ? 'bg-rose-950/70 border border-rose-500/40 text-rose-200'
              : 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'error' ? (
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback({ type: '', text: '' })}
            className="text-xs text-slate-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TABS: [GATE] [SEMESTER] [LABS] */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-2xl w-fit">
          {standardTabs.map((tab) => {
            const isSelected = selectedCategoryName.toUpperCase() === tab;
            return (
              <button
                key={tab}
                onClick={() => setSelectedCategoryName(tab)}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Add Subject Button */}
        <button
          onClick={handleOpenAddSubject}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>ADD SUBJECT</span>
        </button>
      </div>

      {/* SYLLABUS SEARCH BAR */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${selectedCategoryName} syllabus by Subject, Chapter, or Topic...`}
          className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-indigo-500 shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {/* SYLLABUS TREE VIEW */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm uppercase tracking-wider text-indigo-400 font-mono">
              ▼ {selectedCategoryName} SYLLABUS
            </span>
            <span className="text-xs text-slate-500">
              ({filteredSubjects.length} subjects found)
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <button
              onClick={() => {
                const subIds = new Set(filteredSubjects.map((s) => s.id));
                const chapIds = new Set();
                filteredSubjects.forEach((s) => s.chapters?.forEach((ch) => chapIds.add(ch.id)));
                setExpandedSubjects(subIds);
                setExpandedChapters(chapIds);
              }}
              className="hover:text-white underline"
            >
              Expand All
            </button>
            <span>•</span>
            <button
              onClick={() => {
                setExpandedSubjects(new Set());
                setExpandedChapters(new Set());
              }}
              className="hover:text-white underline"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Tree Content */}
        {filteredSubjects.length > 0 ? (
          <div className="space-y-4 pt-2">
            {filteredSubjects.map((subject) => {
              const isSubExpanded = expandedSubjects.has(subject.id);

              return (
                <div
                  key={subject.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/40 overflow-hidden transition"
                >
                  {/* Subject Header Row */}
                  <div className="p-4 flex items-center justify-between gap-3 bg-slate-800/40 hover:bg-slate-800/70 transition">
                    <div
                      onClick={() => toggleSubject(subject.id)}
                      className="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-0"
                    >
                      <button className="text-slate-400 hover:text-white">
                        {isSubExpanded ? (
                          <ChevronDown className="w-5 h-5 text-indigo-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-slate-500" />
                        )}
                      </button>
                      <Folder className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-bold text-base text-white truncate flex items-center gap-2">
                          <span>{subject.name}</span>
                          {subject.target_hours > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                              {subject.target_hours}h target
                            </span>
                          )}
                        </div>
                        {subject.description && (
                          <p className="text-xs text-slate-400 truncate">{subject.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Subject Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleOpenAddChapter(subject)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-xs font-semibold border border-indigo-500/30 transition"
                        title="Add Chapter to Subject"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Chapter</span>
                      </button>
                      <button
                        onClick={() => handleOpenEditSubject(subject)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
                        title="Edit Subject"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenDelete('subject', subject)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition"
                        title="Delete Subject"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Chapters List (nested) */}
                  {isSubExpanded && (
                    <div className="p-4 space-y-3 pl-6 md:pl-10 border-t border-slate-800/80">
                      {subject.chapters && subject.chapters.length > 0 ? (
                        subject.chapters.map((chapter) => {
                          const isChapExpanded = expandedChapters.has(chapter.id);

                          return (
                            <div
                              key={chapter.id}
                              className="rounded-xl border border-slate-800/80 bg-slate-900/60 overflow-hidden"
                            >
                              {/* Chapter Header Row */}
                              <div className="p-3.5 flex items-center justify-between gap-3 bg-slate-800/30 hover:bg-slate-800/50 transition">
                                <div
                                  onClick={() => toggleChapter(chapter.id)}
                                  className="flex items-center gap-2.5 cursor-pointer select-none flex-1 min-w-0"
                                >
                                  <button className="text-slate-400 hover:text-white">
                                    {isChapExpanded ? (
                                      <ChevronDown className="w-4 h-4 text-emerald-400" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-slate-500" />
                                    )}
                                  </button>
                                  <FolderOpen className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                  <span className="font-semibold text-sm text-slate-200 truncate">
                                    {chapter.name}
                                  </span>
                                  {chapter.target_hours > 0 && (
                                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono">
                                      {chapter.target_hours}h
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <button
                                    onClick={() => handleOpenAddTopic(chapter)}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 text-xs font-medium border border-emerald-500/30 transition"
                                    title="Add Topic to Chapter"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Add Topic</span>
                                  </button>
                                  <button
                                    onClick={() => handleOpenEditChapter(subject, chapter)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
                                    title="Edit Chapter"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenDelete('chapter', chapter)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition"
                                    title="Delete Chapter"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Topics List (nested) */}
                              {isChapExpanded && (
                                <div className="p-3 pl-8 md:pl-10 space-y-1.5 border-t border-slate-800/60 bg-slate-950/20">
                                  {chapter.topics && chapter.topics.length > 0 ? (
                                    chapter.topics.map((topic) => (
                                      <div
                                        key={topic.id}
                                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/40 group transition"
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"></span>
                                          <span className="text-xs md:text-sm text-slate-300 group-hover:text-white transition font-medium truncate">
                                            {topic.name}
                                          </span>
                                          {topic.target_hours > 0 && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                                              {topic.target_hours}h target
                                            </span>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                                          <button
                                            onClick={() => handleOpenEditTopic(chapter, topic)}
                                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition"
                                            title="Edit Topic"
                                          >
                                            <Edit2 className="w-3 h-3" />
                                          </button>
                                          <button
                                            onClick={() => handleOpenDelete('topic', topic)}
                                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition"
                                            title="Delete Topic"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-xs text-slate-500 py-1.5 italic">
                                      No topics yet. Click "+ Add Topic" to add one.
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-xs text-slate-500 py-2 italic">
                          No chapters yet. Click "+ Add Chapter" to add one.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 px-4 rounded-xl bg-slate-950/30 border border-dashed border-slate-800 space-y-3">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="text-slate-300 font-semibold text-sm">
              {searchQuery ? 'No syllabus items match your search.' : `No subjects found in ${selectedCategoryName}.`}
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Start building your custom {selectedCategoryName} syllabus hierarchy by clicking the "+ ADD SUBJECT" button above.
            </p>
            <button
              onClick={handleOpenAddSubject}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Subject</span>
            </button>
          </div>
        )}
      </div>

      {/* 1. SUBJECT MODAL */}
      <Modal
        isOpen={subjectModalOpen}
        onClose={() => !saving && setSubjectModalOpen(false)}
        title={editingSubject ? 'Edit Subject' : `Add New ${selectedCategoryName} Subject`}
      >
        <form onSubmit={handleSaveSubject} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Category
            </label>
            <input
              type="text"
              readOnly
              value={selectedCategoryName}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-400 text-sm font-semibold cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Subject Name *
            </label>
            <input
              type="text"
              required
              value={subjectForm.name}
              onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
              placeholder="e.g. Theory of Computation or Algorithms"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Target Hours (Optional)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={subjectForm.target_hours}
              onChange={(e) => setSubjectForm({ ...subjectForm, target_hours: e.target.value })}
              placeholder="e.g. 40"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={subjectForm.description}
              onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
              placeholder="Brief summary of syllabus objectives..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              disabled={saving}
              onClick={() => setSubjectModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !subjectForm.name.trim()}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingSubject ? 'Update Subject' : 'Save Subject'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. CHAPTER MODAL */}
      <Modal
        isOpen={chapterModalOpen}
        onClose={() => !saving && setChapterModalOpen(false)}
        title={editingChapter ? 'Edit Chapter' : `Add Chapter to "${activeSubjectForChapter?.name}"`}
      >
        <form onSubmit={handleSaveChapter} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Chapter Name *
            </label>
            <input
              type="text"
              required
              value={chapterForm.name}
              onChange={(e) => setChapterForm({ ...chapterForm, name: e.target.value })}
              placeholder="e.g. Automata or Sorting"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Target Hours (Optional)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={chapterForm.target_hours}
              onChange={(e) => setChapterForm({ ...chapterForm, target_hours: e.target.value })}
              placeholder="e.g. 10"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              disabled={saving}
              onClick={() => setChapterModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !chapterForm.name.trim()}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingChapter ? 'Update Chapter' : 'Save Chapter'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 3. TOPIC MODAL */}
      <Modal
        isOpen={topicModalOpen}
        onClose={() => !saving && setTopicModalOpen(false)}
        title={editingTopic ? 'Edit Topic' : `Add Topic to "${activeChapterForTopic?.name}"`}
      >
        <form onSubmit={handleSaveTopic} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Topic Name *
            </label>
            <input
              type="text"
              required
              value={topicForm.name}
              onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })}
              placeholder="e.g. DFA or Bubble Sort"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Target Hours (Optional)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={topicForm.target_hours}
              onChange={(e) => setTopicForm({ ...topicForm, target_hours: e.target.value })}
              placeholder="e.g. 3"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              disabled={saving}
              onClick={() => setTopicModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !topicForm.name.trim()}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingTopic ? 'Update Topic' : 'Save Topic'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 4. DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => !saving && setDeleteModal({ isOpen: false, type: '', id: null, name: '' })}
        title={`Delete ${deleteModal.type.toUpperCase()}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Are you sure you want to delete this {deleteModal.type}: <strong className="text-white">"{deleteModal.name}"</strong>?
            {deleteModal.type !== 'topic' && ' This will also delete all associated nested items under it.'}
          </p>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              disabled={saving}
              onClick={() => setDeleteModal({ isOpen: false, type: '', id: null, name: '' })}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleConfirmDelete}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-lg shadow-rose-600/30 transition disabled:opacity-50"
            >
              {saving ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
