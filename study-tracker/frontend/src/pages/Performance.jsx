import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart3,
  PieChart as PieIcon,
  Clock,
  Target,
  Award,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Layers,
  Calendar,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { performanceApi } from '../api/performanceApi';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'];

export default function Performance() {
  const [selectedCategory, setSelectedCategory] = useState('GATE');
  const [categoryData, setCategoryData] = useState(null);
  const [allCategoriesData, setAllCategoriesData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Drilldown states
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [selectedChapterId, setSelectedChapterId] = useState(null);

  const fetchPerformance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [gate, sem, labs] = await Promise.allSettled([
        performanceApi.getGate(),
        performanceApi.getSemester(),
        performanceApi.getLabs(),
      ]);

      const dataMap = {
        GATE: gate.status === 'fulfilled' ? gate.value : null,
        SEMESTER: sem.status === 'fulfilled' ? sem.value : null,
        LABS: labs.status === 'fulfilled' ? labs.value : null,
      };

      setAllCategoriesData(dataMap);
      setCategoryData(dataMap[selectedCategory]);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load performance metrics');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchPerformance();

    const handleSessionSaved = () => {
      fetchPerformance();
    };
    window.addEventListener('study-session-saved', handleSessionSaved);
    return () => window.removeEventListener('study-session-saved', handleSessionSaved);
  }, [fetchPerformance]);

  useEffect(() => {
    if (allCategoriesData[selectedCategory]) {
      setCategoryData(allCategoriesData[selectedCategory]);
      // Reset drilldowns when category changes
      setSelectedSubjectId(null);
      setSelectedChapterId(null);
    }
  }, [selectedCategory, allCategoriesData]);

  // Selected subject object
  const currentSubject = useMemo(() => {
    if (!categoryData || !selectedSubjectId) return null;
    return categoryData.subjects?.find((s) => s.id === selectedSubjectId) || null;
  }, [categoryData, selectedSubjectId]);

  // Selected chapter object
  const currentChapter = useMemo(() => {
    if (!currentSubject || !selectedChapterId) return null;
    return currentSubject.chapters?.find((c) => c.id === selectedChapterId) || null;
  }, [currentSubject, selectedChapterId]);

  // Chart 1: Subject-wise study time chart & Target vs Actual chart
  const subjectChartData = useMemo(() => {
    if (!categoryData?.subjects) return [];
    return categoryData.subjects.map((s) => ({
      name: s.name.length > 15 ? s.name.substring(0, 15) + '...' : s.name,
      fullName: s.name,
      ActualHours: s.spent_hours,
      TargetHours: s.target_hours,
    }));
  }, [categoryData]);

  // Chart 2: Chapter-wise study time chart (for selected subject or all)
  const chapterChartData = useMemo(() => {
    if (currentSubject) {
      return (currentSubject.chapters || []).map((c) => ({
        name: c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name,
        fullName: c.name,
        ActualHours: c.spent_hours,
        TargetHours: c.target_hours,
      }));
    }
    // If no subject selected, aggregate all chapters across subjects in current category
    const list = [];
    (categoryData?.subjects || []).forEach((s) => {
      (s.chapters || []).forEach((c) => {
        list.push({
          name: c.name.length > 12 ? c.name.substring(0, 12) + '...' : c.name,
          fullName: `${s.name} → ${c.name}`,
          ActualHours: c.spent_hours,
          TargetHours: c.target_hours,
        });
      });
    });
    return list.slice(0, 10);
  }, [currentSubject, categoryData]);

  // Chart 3: Category Distribution (Pie Chart)
  const categoryDistributionData = useMemo(() => {
    return [
      { name: 'GATE', value: allCategoriesData.GATE?.spent_hours || 0 },
      { name: 'SEMESTER', value: allCategoriesData.SEMESTER?.spent_hours || 0 },
      { name: 'LABS', value: allCategoriesData.LABS?.spent_hours || 0 },
    ].filter((item) => item.value > 0);
  }, [allCategoriesData]);

  if (loading && !categoryData) {
    return <LoadingSpinner message="Calculating performance analytics..." />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div className="pb-3 border-b border-slate-800">
        <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-400" />
          PERFORMANCE ANALYTICS
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Detailed metrics calculated dynamically from syllabus target hours and completed study sessions.
        </p>
      </div>

      <ErrorMessage message={error} onRetry={fetchPerformance} />

      {/* TOP TABS: [GATE] [SEMESTER] [LABS] */}
      <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-2xl w-fit">
        {['GATE', 'SEMESTER', 'LABS'].map((tab) => {
          const isSelected = selectedCategory === tab;
          return (
            <button
              key={tab}
              onClick={() => setSelectedCategory(tab)}
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

      {/* Category Summary Header */}
      {categoryData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <span className="text-xs uppercase font-bold text-slate-400">Total Studied</span>
            <div className="text-2xl font-extrabold text-white mt-1">
              {categoryData.spent_formatted}
            </div>
            <div className="text-xs text-indigo-400 mt-1 font-mono font-medium">
              {categoryData.spent_hours} hours total
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <span className="text-xs uppercase font-bold text-slate-400">Target Goal</span>
            <div className="text-2xl font-extrabold text-white mt-1">
              {categoryData.target_hours}h
            </div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Syllabus Sum</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <span className="text-xs uppercase font-bold text-slate-400">Remaining</span>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">
              {categoryData.remaining_formatted}
            </div>
            <div className="text-xs text-slate-400 mt-1 font-medium">
              {categoryData.remaining_hours} hours remaining
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <span className="text-xs uppercase font-bold text-slate-400">Overall Progress</span>
            <div className="text-2xl font-extrabold text-indigo-400 mt-1">
              {categoryData.progress_percent}%
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-indigo-500 h-2 rounded-full"
                style={{ width: `${categoryData.progress_percent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* PERFORMANCE CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Target vs Actual (Subject-wise) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-400" />
              Target vs Actual Study Time
            </h3>
            <span className="text-xs text-slate-500">Hours</span>
          </div>

          {subjectChartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '12px', color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: '10px' }} />
                  <Bar dataKey="ActualHours" name="Actual (h)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="TargetHours" name="Target (h)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-500">
              No subjects or target data available for {selectedCategory}.
            </div>
          )}
        </div>

        {/* Chart 2: Category Distribution Donut */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-indigo-400" />
              Category Time Distribution
            </h3>
            <span className="text-xs text-slate-500">All-time hours</span>
          </div>

          {categoryDistributionData.length > 0 ? (
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}h`}
                  >
                    {categoryDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '12px', color: '#fff' }}
                    formatter={(val) => [`${val} hours`, 'Time Spent']}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-500">
              No study session durations recorded yet to generate distribution chart.
            </div>
          )}
        </div>
      </div>

      {/* SUBJECT PERFORMANCE LIST */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">SUBJECT PERFORMANCE</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any subject to expand Chapter and Topic breakdown.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {categoryData?.subjects?.length || 0} subjects in {selectedCategory}
          </span>
        </div>

        {categoryData?.subjects && categoryData.subjects.length > 0 ? (
          <div className="space-y-4">
            {categoryData.subjects.map((sub) => {
              const isSelected = selectedSubjectId === sub.id;

              return (
                <div
                  key={sub.id}
                  className={`rounded-2xl border transition-all ${
                    isSelected
                      ? 'border-indigo-500/80 bg-slate-950/60 shadow-lg shadow-indigo-500/10'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  {/* Subject Card Row */}
                  <div
                    onClick={() => {
                      if (isSelected) {
                        setSelectedSubjectId(null);
                        setSelectedChapterId(null);
                      } else {
                        setSelectedSubjectId(sub.id);
                        setSelectedChapterId(null);
                      }
                    }}
                    className="p-5 cursor-pointer select-none space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <button className="text-slate-400">
                          {isSelected ? (
                            <ChevronDown className="w-5 h-5 text-indigo-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-slate-500" />
                          )}
                        </button>
                        <div>
                          <h3 className="font-extrabold text-base text-white">{sub.name}</h3>
                          {sub.description && (
                            <p className="text-xs text-slate-400 truncate max-w-md">{sub.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
                        <div>
                          <span>Sessions: </span>
                          <span className="text-white font-bold">{sub.session_count}</span>
                        </div>
                        <div>
                          <span>Last Studied: </span>
                          <span className="text-emerald-400 font-bold">{sub.last_studied || 'Never'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats pills */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-800">
                        <div className="text-slate-400 text-[11px]">Target Hours</div>
                        <div className="font-bold text-white text-sm mt-0.5">{sub.target_hours}h</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-800">
                        <div className="text-slate-400 text-[11px]">Time Spent</div>
                        <div className="font-bold text-emerald-400 text-sm mt-0.5">{sub.spent_formatted}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-800">
                        <div className="text-slate-400 text-[11px]">Remaining</div>
                        <div className="font-bold text-slate-200 text-sm mt-0.5">{sub.remaining_formatted}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-800">
                        <div className="text-slate-400 text-[11px]">Progress</div>
                        <div className="font-bold text-indigo-400 text-sm mt-0.5">{sub.progress_percent}%</div>
                      </div>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-400 font-medium">
                        <span>Completion Rate</span>
                        <span>{sub.progress_percent}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${sub.progress_percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* CHAPTER PERFORMANCE (Drilldown) */}
                  {isSelected && (
                    <div className="p-5 border-t border-slate-800/80 bg-slate-950/40 space-y-4 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-300">
                          Chapters in {sub.name}
                        </h4>
                        <span className="text-xs text-slate-400">
                          Overall: {sub.spent_formatted} / {sub.target_hours}h
                        </span>
                      </div>

                      {sub.chapters && sub.chapters.length > 0 ? (
                        <div className="space-y-3">
                          {sub.chapters.map((chap) => {
                            const isChapSelected = selectedChapterId === chap.id;

                            return (
                              <div
                                key={chap.id}
                                className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden"
                              >
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedChapterId(isChapSelected ? null : chap.id);
                                  }}
                                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/40 transition"
                                >
                                  <div className="flex items-center gap-2">
                                    <button className="text-slate-400">
                                      {isChapSelected ? (
                                        <ChevronDown className="w-4 h-4 text-emerald-400" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4 text-slate-500" />
                                      )}
                                    </button>
                                    <span className="font-bold text-sm text-slate-200">
                                      {chap.name}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-4 text-xs">
                                    <span className="text-slate-400">Target: <strong className="text-white">{chap.target_hours}h</strong></span>
                                    <span className="text-slate-400">Spent: <strong className="text-emerald-400">{chap.spent_formatted}</strong></span>
                                    <span className="text-slate-400">Progress: <strong className="text-indigo-400">{chap.progress_percent}%</strong></span>
                                  </div>
                                </div>

                                {/* TOPIC PERFORMANCE (Level 3 Drilldown) */}
                                {isChapSelected && (
                                  <div className="p-4 border-t border-slate-800/60 bg-slate-950/60 space-y-2">
                                    <div className="text-xs uppercase font-bold text-slate-400 mb-2">
                                      Topic Breakdown
                                    </div>
                                    {chap.topics && chap.topics.length > 0 ? (
                                      <div className="space-y-2">
                                        {chap.topics.map((tp) => (
                                          <div
                                            key={tp.id}
                                            className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                          >
                                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                              <span>{tp.name}</span>
                                            </div>

                                            <div className="flex items-center gap-3 text-xs">
                                              <span className="text-slate-400">
                                                Target: <strong className="text-white">{tp.target_hours}h</strong>
                                              </span>
                                              <span className="text-slate-400">
                                                Spent: <strong className="text-emerald-400">{tp.spent_formatted}</strong>
                                              </span>
                                              <span className="text-slate-400">
                                                Progress: <strong className="text-indigo-400">{tp.progress_percent}%</strong>
                                              </span>
                                              <span className="text-slate-500 font-mono text-[11px]">
                                                {tp.last_studied ? `(${tp.last_studied})` : ''}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-xs text-slate-500 italic">No topics under this chapter.</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 italic">No chapters created for this subject yet.</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-500 text-sm">
            No subjects found in {selectedCategory}. Add subjects and chapters on the Syllabus page to begin tracking performance!
          </div>
        )}
      </div>
    </div>
  );
}
