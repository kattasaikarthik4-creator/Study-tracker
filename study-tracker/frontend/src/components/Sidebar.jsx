import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Timer,
  BookOpen,
  BarChart3,
  Calendar,
  History,
  Menu,
  X,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { useTimer } from '../context/TimerContext';

const navItems = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Sessions', path: '/sessions', icon: Timer },
  { name: 'Syllabus', path: '/syllabus', icon: BookOpen },
  { name: 'Performance', path: '/performance', icon: BarChart3 },
  { name: 'Weekly Schedule', path: '/schedule', icon: Calendar },
  { name: 'History', path: '/history', icon: History },
];

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isRunning, formattedTime, topic } = useTimer();

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile Top Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base tracking-wider text-white">STUDY TRACKER</span>
            <span className="text-[10px] block font-medium uppercase tracking-wider text-indigo-400">Academic Suite</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isRunning && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/80 border border-emerald-500/30 rounded-full text-xs font-mono text-emerald-400 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {formattedTime}
            </div>
          )}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Backdrop for mobile drawer */}
      {mobileOpen && (
        <div
          onClick={closeMobile}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="px-6 py-6 border-b border-slate-800/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/25 ring-1 ring-white/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-wider text-white">STUDY TRACKER</h1>
              <p className="text-[11px] font-medium uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                <span>GATE</span> • <span>SEM</span> • <span>LABS</span>
              </p>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={closeMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom card: Active session mini badge or tips */}
        <div className="p-4 border-t border-slate-800/80">
          {isRunning ? (
            <div className="p-3.5 rounded-xl bg-slate-800/70 border border-emerald-500/30 shadow-inner">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Active Session
                </span>
                <span className="font-mono text-emerald-300 font-bold">{formattedTime}</span>
              </div>
              <div className="text-xs text-slate-300 truncate font-medium">
                {topic?.name || 'Studying...'}
              </div>
              <NavLink
                to="/sessions"
                onClick={closeMobile}
                className="mt-2 block text-center text-xs py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition"
              >
                Open Session
              </NavLink>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-indigo-400 font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                Focus Mode
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Build your syllabus & track targeted study hours daily.
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Navigation for quick thumb switching */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-around py-2 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-medium transition ${
                  isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-300'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span className="truncate max-w-[50px]">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
