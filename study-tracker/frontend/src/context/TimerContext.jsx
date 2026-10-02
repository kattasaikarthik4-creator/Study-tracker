import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { studySessionApi } from '../api/studySessionApi';

const TimerContext = createContext(null);

const STORAGE_KEY = 'study_tracker_active_timer';

export const TimerProvider = ({ children }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime, setStartTime] = useState(null); // ISO string or timestamp
  const [category, setCategory] = useState(null); // { id, name }
  const [subject, setSubject] = useState(null);   // { id, name }
  const [chapter, setChapter] = useState(null);   // { id, name }
  const [topic, setTopic] = useState(null);       // { id, name }
  const [saveStatus, setSaveStatus] = useState({ loading: false, success: null, error: null });

  const intervalRef = useRef(null);
  const lastTickRef = useRef(Date.now());

  // Recover state from localStorage on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isRunning) {
          setIsRunning(true);
          setIsPaused(parsed.isPaused || false);
          setStartTime(parsed.startTime);
          setCategory(parsed.category || null);
          setSubject(parsed.subject || null);
          setChapter(parsed.chapter || null);
          setTopic(parsed.topic || null);

          let calculatedElapsed = parsed.elapsedSeconds || 0;
          if (!parsed.isPaused && parsed.lastSavedAt) {
            const extra = Math.floor((Date.now() - parsed.lastSavedAt) / 1000);
            if (extra > 0) {
              calculatedElapsed += extra;
            }
          }
          setElapsedSeconds(calculatedElapsed);
          lastTickRef.current = Date.now();
        }
      }
    } catch (e) {
      console.error('Failed to restore timer state:', e);
    }
  }, []);

  // Timer tick interval
  useEffect(() => {
    if (isRunning && !isPaused) {
      lastTickRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const delta = Math.floor((now - lastTickRef.current) / 1000);
        if (delta >= 1) {
          setElapsedSeconds((prev) => {
            const next = prev + delta;
            // Sync to localStorage
            try {
              localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                  isRunning: true,
                  isPaused: false,
                  startTime,
                  elapsedSeconds: next,
                  lastSavedAt: now,
                  category,
                  subject,
                  chapter,
                  topic,
                })
              );
            } catch {}
            return next;
          });
          lastTickRef.current = now;
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, startTime, category, subject, chapter, topic]);

  // Persist paused state
  useEffect(() => {
    if (isRunning && isPaused) {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            isRunning: true,
            isPaused: true,
            startTime,
            elapsedSeconds,
            lastSavedAt: Date.now(),
            category,
            subject,
            chapter,
            topic,
          })
        );
      } catch {}
    }
  }, [isRunning, isPaused, startTime, elapsedSeconds, category, subject, chapter, topic]);

  const startTimer = ({ category, subject, chapter, topic }) => {
    const nowIso = new Date().toISOString();
    setIsRunning(true);
    setIsPaused(false);
    setElapsedSeconds(0);
    setStartTime(nowIso);
    setCategory(category);
    setSubject(subject);
    setChapter(chapter);
    setTopic(topic);
    setSaveStatus({ loading: false, success: null, error: null });
    lastTickRef.current = Date.now();

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          isRunning: true,
          isPaused: false,
          startTime: nowIso,
          elapsedSeconds: 0,
          lastSavedAt: Date.now(),
          category,
          subject,
          chapter,
          topic,
        })
      );
    } catch {}
  };

  const pauseTimer = () => {
    if (isRunning && !isPaused) {
      setIsPaused(true);
    }
  };

  const resumeTimer = () => {
    if (isRunning && isPaused) {
      lastTickRef.current = Date.now();
      setIsPaused(false);
    }
  };

  const stopTimer = async (notes = '') => {
    if (!isRunning) return null;

    const finalDuration = Math.max(1, elapsedSeconds);
    const startDt = startTime ? new Date(startTime) : new Date(Date.now() - finalDuration * 1000);
    const endDt = new Date();

    setSaveStatus({ loading: true, success: null, error: null });

    const payload = {
      category_id: category?.id,
      subject_id: subject?.id,
      chapter_id: chapter?.id,
      topic_id: topic?.id,
      session_type: 'LIVE',
      start_time: startDt.toISOString(),
      end_time: endDt.toISOString(),
      duration_seconds: finalDuration,
      study_date: startDt.toISOString().split('T')[0],
      notes: notes || null,
    };

    try {
      const savedSession = await studySessionApi.create(payload);
      
      // Clean up timer state
      setIsRunning(false);
      setIsPaused(false);
      setElapsedSeconds(0);
      setStartTime(null);
      setCategory(null);
      setSubject(null);
      setChapter(null);
      setTopic(null);
      localStorage.removeItem(STORAGE_KEY);

      setSaveStatus({
        loading: false,
        success: 'Study session saved successfully.',
        error: null,
      });

      // Dispatch custom event so pages can re-fetch updated data
      window.dispatchEvent(new CustomEvent('study-session-saved', { detail: savedSession }));

      return savedSession;
    } catch (err) {
      setSaveStatus({
        loading: false,
        success: null,
        error: err.message || 'Failed to save study session',
      });
      throw err;
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsPaused(false);
    setElapsedSeconds(0);
    setStartTime(null);
    setCategory(null);
    setSubject(null);
    setChapter(null);
    setTopic(null);
    localStorage.removeItem(STORAGE_KEY);
    setSaveStatus({ loading: false, success: null, error: null });
  };

  const formatTimerDigits = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0'),
    ].join(':');
  };

  return (
    <TimerContext.Provider
      value={{
        isRunning,
        isPaused,
        elapsedSeconds,
        formattedTime: formatTimerDigits(elapsedSeconds),
        startTime,
        category,
        subject,
        chapter,
        topic,
        saveStatus,
        setSaveStatus,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        resetTimer,
        formatTimerDigits,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
