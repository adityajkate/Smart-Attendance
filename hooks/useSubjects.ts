import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';

export interface Subject {
  id: string;
  name: string;
  target_attendance: number;
  color_hex: string;
  days: string[]; // <--- NEW: Stores ['Mon', 'Fri']
}

export const useSubjects = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubjects = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) Alert.alert('Error', error.message);
    else setSubjects(data || []);
    setLoading(false);
  };

  // UPDATED: Now accepts 'days' array
  const addSubject = async (name: string, target: string, days: string[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const targetDecimal = parseFloat(target) / 100;

    const { error } = await supabase.from('subjects').insert({
      user_id: user.id,
      name: name,
      target_attendance: targetDecimal || 0.75,
      color_hex: '#' + Math.floor(Math.random()*16777215).toString(16),
      days: days // <--- Saving the days
    });

    if (error) Alert.alert('Error', error.message);
    else fetchSubjects();
  };

  const deleteSubject = async (id: string) => {
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) Alert.alert('Error', error.message);
    else fetchSubjects();
  };

  useEffect(() => { fetchSubjects(); }, []);

  return { subjects, loading, addSubject, deleteSubject, refreshSubjects: fetchSubjects };
};