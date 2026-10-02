import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TimerProvider } from './context/TimerContext';
import Sidebar from './components/Sidebar';
import ActiveTimerBanner from './components/ActiveTimerBanner';

import Home from './pages/Home';
import Sessions from './pages/Sessions';
import Syllabus from './pages/Syllabus';
import Performance from './pages/Performance';
import WeeklySchedule from './pages/WeeklySchedule';
import History from './pages/History';

export default function App() {
  return (
    <TimerProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row antialiased">
          {/* Responsive Left Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <main className="flex-1 lg:pl-64 flex flex-col min-w-0 pb-20 lg:pb-12">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
              {/* Sticky / Floating global Active Timer Banner */}
              <ActiveTimerBanner />

              {/* Page Routes */}
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/sessions" element={<Sessions />} />
                <Route path="/syllabus" element={<Syllabus />} />
                <Route path="/performance" element={<Performance />} />
                <Route path="/schedule" element={<WeeklySchedule />} />
                <Route path="/history" element={<History />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      </BrowserRouter>
    </TimerProvider>
  );
}
