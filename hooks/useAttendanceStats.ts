import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface SubjectStats {
  subjectId: string;
  subjectName: string;
  totalClasses: number;
  present: number;
  absent: number;
  percentage: number;
  target: number;
  status: 'SAFE' | 'AT_RISK' | 'ON_TRACK';
  classesToRecover: number;
  days: string[];
}

// Helper: Get strictly local YYYY-MM-DD
const getSafeDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const useAttendanceStats = () => {
  const [stats, setStats] = useState<SubjectStats[]>([]);
  const [loading, setLoading] = useState(true);

  const calculateStats = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: subjects } = await supabase.from('subjects').select('*').eq('user_id', user.id);
    const { data: logs } = await supabase.from('attendance_logs').select('*').eq('user_id', user.id);

    if (!subjects || !logs) {
      setLoading(false);
      return;
    }

    // "Today" is the cutoff. We don't count future scheduled classes as "Absent" yet.
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const newStats: SubjectStats[] = subjects.map((sub) => {
      let totalClasses = 0;
      let presentCount = 0;
      let absentCount = 0;

      // 1. Determine Start Date (Earliest of Creation Date OR First Log Date)
      // This fixes the "Backdated Extra Class" issue.
      const subjectLogs = logs.filter(l => l.subject_id === sub.id);
      let startDate = new Date(sub.created_at);
      
      if (subjectLogs.length > 0) {
        // Sort logs to find the earliest one
        const sortedLogs = [...subjectLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const firstLogDate = new Date(sortedLogs[0].date);
        if (firstLogDate < startDate) {
          startDate = firstLogDate;
        }
      }
      startDate.setHours(0, 0, 0, 0);

      const scheduledDays = sub.days || [];
      const cursorDate = new Date(startDate);

      // 2. Walk through history day-by-day
      while (cursorDate <= today) {
        const dateStr = getSafeDateString(cursorDate);
        const dayName = cursorDate.toLocaleDateString('en-US', { weekday: 'short' });

        const dayLogs = logs.filter(l => l.subject_id === sub.id && l.date === dateStr);
        const activeLogs = dayLogs.filter(l => l.status !== 'cancelled');
        const isCancelledDay = dayLogs.some(l => l.status === 'cancelled');
        
        const isScheduled = scheduledDays.includes(dayName);
        let theoreticalClasses = (isScheduled && !isCancelledDay) ? 1 : 0;

        // MATH: Max of Theoretical vs Actual Logs
        const classesThisDay = Math.max(theoreticalClasses, activeLogs.length);
        totalClasses += classesThisDay;

        // COUNTING LOGIC
        if (activeLogs.length > 0) {
          // Explicit Logs (User clicked Present/Absent)
          activeLogs.forEach(log => {
            if (log.status === 'present') presentCount++;
            else if (log.status === 'absent') absentCount++;
          });
        } else {
          // Implicit Logs (User did NOTHING on a scheduled day)
          if (classesThisDay > 0) {
            // It was scheduled, not cancelled, and no logs exist.
            // This is an "Implicit Absent".
            absentCount++; 
          }
        }

        // Next Day
        cursorDate.setDate(cursorDate.getDate() + 1);
      }

      // 3. Stats Calculation
      const percentage = totalClasses > 0 
        ? (presentCount / totalClasses) * 100 
        : 100;

      const target = sub.target_percentage || 75;
      let status: SubjectStats['status'] = 'ON_TRACK';
      if (percentage < target) status = 'AT_RISK';
      else if (percentage > target + 10) status = 'SAFE';

      let classesToRecover = 0;
      if (percentage < target) {
        let p = presentCount;
        let t = totalClasses;
        while ((p / t) * 100 < target) {
          p++;
          t++;
          classesToRecover++;
        }
      }

      return {
        subjectId: sub.id,
        subjectName: sub.name,
        totalClasses,
        present: presentCount,
        absent: absentCount,
        percentage,
        target,
        status,
        classesToRecover,
        days: sub.days
      };
    });

    setStats(newStats);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      calculateStats();
    }, [])
  );

  return { stats, loading, refreshStats: calculateStats };
};