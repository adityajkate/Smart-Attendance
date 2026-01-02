import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Modal, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { ActivityIndicator, Button, Divider, IconButton, Provider, Text } from 'react-native-paper';
import { useSubjects } from '../../hooks/useSubjects';
import { supabase } from '../../lib/supabase';

const getDayName = (dateString: string) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day); 
  return days[date.getDay()];
};

export default function CalendarScreen() {
  const { subjects, refreshSubjects } = useSubjects(); 
  const [selectedDate, setSelectedDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [extraClassModalVisible, setExtraClassModalVisible] = useState(false);
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false); // New loading state for actions

  useFocusEffect(useCallback(() => { refreshSubjects(); }, []));

  const handleDayPress = async (day: any) => {
    setSelectedDate(day.dateString);
    setModalVisible(true);
    fetchLogsForDate(day.dateString);
  };

  const fetchLogsForDate = async (date: string) => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('attendance_logs').select('*').eq('user_id', user.id).eq('date', date);
    setDailyLogs(data || []);
    setLoading(false);
  };

  // --- BULK ACTIONS ---
  const markWholeDay = async (status: 'cancelled' | 'absent') => {
    setActionLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const dayName = getDayName(selectedDate);
    const scheduledSubjects = subjects.filter(sub => sub.days && sub.days.includes(dayName));

    if (scheduledSubjects.length === 0) {
      Alert.alert("System", "No classes scheduled for this date.");
      setActionLoading(false);
      return;
    }

    const updates = scheduledSubjects.map(async (sub) => {
        const existingLog = dailyLogs.find(l => l.subject_id === sub.id);
        if (existingLog) {
            return supabase.from('attendance_logs').update({ status }).eq('id', existingLog.id);
        } else {
            return supabase.from('attendance_logs').insert({ 
                user_id: user.id, 
                subject_id: sub.id, 
                date: selectedDate, 
                status 
            });
        }
    });

    await Promise.all(updates);
    await fetchLogsForDate(selectedDate);
    setActionLoading(false);
    
    if (status === 'cancelled') {
        Alert.alert("System", "All classes marked as Cancelled/Holiday.");
    } else {
        Alert.alert("System", "All classes marked as Absent (Leave).");
    }
  };

  // --- SINGLE TOGGLE ---
  const toggleMainAttendance = async (subjectId: string, status: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const subjectLogs = dailyLogs.filter(l => l.subject_id === subjectId);
    const primaryLog = subjectLogs[0]; 

    if (primaryLog) {
      if (primaryLog.status === status) {
        await supabase.from('attendance_logs').delete().eq('id', primaryLog.id);
      } else {
        await supabase.from('attendance_logs').update({ status }).eq('id', primaryLog.id);
      }
    } else {
      await supabase.from('attendance_logs').insert({ user_id: user.id, subject_id: subjectId, date: selectedDate, status });
    }
    await fetchLogsForDate(selectedDate);
  };

  // --- EXTRA CLASS ---
  const addExtraClass = async (subjectId: string, status: 'present' | 'absent') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // INSERT NEW ROW (Do not check for existing)
      // This ensures 2 classes on the same day are possible.
      const { error } = await supabase.from('attendance_logs').insert({
        user_id: user.id,
        subject_id: subjectId,
        date: selectedDate, // Uses the currently selected calendar date
        status: status
      });

      if (error) throw error;
      
      setExtraClassModalVisible(false);
      await fetchLogsForDate(selectedDate); // Refresh UI list
      
      // OPTIONAL: Trigger a global refresh if you use context, 
      // but FocusEffect in Dashboard will handle the stats update.

      Alert.alert("System", `Extra class logged: ${status.toUpperCase()}`);

    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const deleteExtraLog = async (logId: string) => {
    await supabase.from('attendance_logs').delete().eq('id', logId);
    await fetchLogsForDate(selectedDate);
  };

  const getSubjectLogs = (subjectId: string) => {
    return dailyLogs.filter(l => l.subject_id === subjectId);
  };

  const dayName = selectedDate ? getDayName(selectedDate) : '';
  const scheduledSubjects = subjects.filter(sub => sub.days && sub.days.includes(dayName));

  const allExtraLogs = dailyLogs.filter(log => {
    const isScheduledSubject = scheduledSubjects.find(s => s.id === log.subject_id);
    if (!isScheduledSubject) return true; // It is extra because subject isn't scheduled today
    
    // If subject IS scheduled, check if this is a duplicate log (Extra)
    const subjectLogs = dailyLogs.filter(l => l.subject_id === log.subject_id);
    // Sort by ID to ensure consistent order, assume first ID is main, rest are extra
    subjectLogs.sort((a, b) => a.id - b.id);
    
    return log.id !== subjectLogs[0].id; 
  });

  return (
    <Provider>
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Calendar</Text>
        
        <Calendar
          onDayPress={handleDayPress}
          markedDates={{ [selectedDate]: { selected: true, selectedColor: '#4F46E5', selectedTextColor: '#ffffff' } }}
          theme={{
            backgroundColor: '#1F2937',
            calendarBackground: '#1F2937',
            textSectionTitleColor: '#9CA3AF',
            selectedDayBackgroundColor: '#4F46E5',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#4F46E5',
            dayTextColor: '#F3F4F6',
            textDisabledColor: '#374151',
            arrowColor: '#4F46E5',
            monthTextColor: '#F3F4F6',
            indicatorColor: '#4F46E5',
            textDayFontWeight: '600',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '600',
          }}
          style={styles.calendar}
        />
        
        <Text style={styles.hint}>Select a date to manage logs</Text>

        {/* MAIN MODAL */}
        <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalDate}>{selectedDate}</Text>
                <Text style={styles.modalDay}>{dayName}</Text>
              </View>
              <Button onPress={() => setModalVisible(false)} textColor="#4F46E5">Done</Button>
            </View>

            {loading || actionLoading ? ( <ActivityIndicator color="#4F46E5" style={{marginTop: 50}} /> ) : (
              <ScrollView style={styles.modalContent}>
                
                {/* 0. QUICK ACTIONS */}
                {scheduledSubjects.length > 0 && (
                  <View style={styles.quickActions}>
                    <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#374151', borderColor: '#EAB308', borderWidth: 1}]} onPress={() => markWholeDay('cancelled')}>
                        <MaterialCommunityIcons name="calendar-remove" size={16} color="#EAB308" style={{marginRight: 6}} />
                        <Text style={[styles.actionBtnText, {color: '#EAB308'}]}>Holiday</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#374151', borderColor: '#EF4444', borderWidth: 1}]} onPress={() => markWholeDay('absent')}>
                        <MaterialCommunityIcons name="account-off" size={16} color="#EF4444" style={{marginRight: 6}} />
                        <Text style={[styles.actionBtnText, {color: '#EF4444'}]}>Leave</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <Divider style={{ marginBottom: 20, backgroundColor: '#374151' }} />
                
                {/* 1. SCHEDULED */}
                <Text style={styles.sectionLabel}>SCHEDULED</Text>
                {scheduledSubjects.length === 0 ? (
                  <Text style={styles.emptyText}>No classes scheduled.</Text>
                ) : (
                  scheduledSubjects.map((sub) => {
                    const subLogs = getSubjectLogs(sub.id);
                    const mainLog = subLogs[0]; 
                    const status = mainLog?.status;

                    return (
                      <View key={sub.id} style={styles.logItem}>
                        <View style={{flex: 1}}>
                            <Text style={styles.logTitle}>{sub.name}</Text>
                            {status === 'cancelled' && <Text style={{color: '#EAB308', fontSize: 10, fontWeight: 'bold'}}>CANCELLED</Text>}
                            {status === 'absent' && <Text style={{color: '#EF4444', fontSize: 10, fontWeight: 'bold'}}>ABSENT</Text>}
                        </View>
                        <View style={styles.actionRow}>
                          <TouchableOpacity 
                            onPress={() => toggleMainAttendance(sub.id, 'cancelled')}
                            style={[styles.statusBtn, status === 'cancelled' ? {backgroundColor: '#EAB308'} : {backgroundColor: '#374151'}]}
                          >
                            <Text style={{fontSize: 10, color: 'white'}}>Free</Text>
                          </TouchableOpacity>

                          <IconButton 
                            icon="check" 
                            containerColor={status === 'present' ? '#22C55E' : '#374151'} 
                            iconColor="white" 
                            size={20} 
                            onPress={() => toggleMainAttendance(sub.id, 'present')} 
                          />

                          <IconButton 
                            icon="close" 
                            containerColor={status === 'absent' ? '#EF4444' : '#374151'} 
                            iconColor="white" 
                            size={20} 
                            onPress={() => toggleMainAttendance(sub.id, 'absent')} 
                          />
                        </View>
                      </View>
                    );
                  })
                )}

                <Divider style={{ marginVertical: 20, backgroundColor: '#374151' }} />

                {/* 2. EXTRA CLASSES */}
                <Text style={styles.sectionLabel}>UNSCHEDULED / EXTRA</Text>
                {allExtraLogs.length === 0 && <Text style={styles.emptyText}>No extra logs found.</Text>}
                
                {allExtraLogs.map(log => {
                    const subName = subjects.find(s => s.id === log.subject_id)?.name;
                    return (
                        <View key={log.id} style={styles.logItem}>
                            <View>
                              <Text style={styles.logTitle}>{subName}</Text>
                              <Text style={{color: log.status === 'present' ? '#22C55E' : '#EF4444', fontSize: 10, fontWeight:'bold'}}>
                                {log.status.toUpperCase()}
                              </Text>
                            </View>
                            <IconButton 
                              icon="trash-can-outline" 
                              iconColor="#EF4444" 
                              size={20} 
                              onPress={() => deleteExtraLog(log.id)} 
                            /> 
                        </View>
                    )
                })}

                <Button 
                    mode="outlined" 
                    icon="plus" 
                    style={{marginTop: 20, borderColor: '#4F46E5'}} 
                    textColor="#4F46E5"
                    onPress={() => setExtraClassModalVisible(true)}
                >
                    Log Extra Class
                </Button>

                <View style={{height: 50}} />
              </ScrollView>
            )}
          </View>

          {/* EXTRA CLASS PICKER (Fixed Logic) */}
          <Modal visible={extraClassModalVisible} transparent animationType="fade">
            <View style={styles.pickerOverlay}>
                <View style={styles.pickerContainer}>
                    <Text style={styles.pickerTitle}>Log Extra Class</Text>
                    <Text style={{color: '#9CA3AF', marginBottom: 15, fontSize: 12}}>Select status:</Text>
                    
                    <ScrollView style={{maxHeight: 300}}>
                        {subjects.map(sub => (
                            <View key={sub.id} style={styles.pickerRow}>
                                <Text style={styles.pickerSubject}>{sub.name}</Text>
                                <View style={{flexDirection: 'row', gap: 10}}>
                                    <IconButton 
                                      icon="check" 
                                      containerColor="#22C55E" 
                                      iconColor="white" 
                                      size={20} 
                                      onPress={() => addExtraClass(sub.id, 'present')} 
                                    />
                                    <IconButton 
                                      icon="close" 
                                      containerColor="#EF4444" 
                                      iconColor="white" 
                                      size={20} 
                                      onPress={() => addExtraClass(sub.id, 'absent')} 
                                    />
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                    <Button onPress={() => setExtraClassModalVisible(false)} textColor="#9CA3AF" style={{marginTop: 10}}>Cancel</Button>
                </View>
            </View>
          </Modal>

        </Modal>
      </View>
    </SafeAreaView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F172A', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  container: { flex: 1, padding: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#F3F4F6', marginBottom: 20 },
  calendar: { borderRadius: 16, overflow: 'hidden', paddingBottom: 10 },
  hint: { color: '#9CA3AF', textAlign: 'center', marginTop: 20, fontSize: 12 },
  
  modalContainer: { flex: 1, backgroundColor: '#0F172A' },
  modalHeader: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#374151' },
  modalDate: { color: '#F3F4F6', fontSize: 20, fontWeight: 'bold' },
  modalDay: { color: '#9CA3AF', fontSize: 14 },
  modalContent: { padding: 20 },
  
  // Quick Actions
  quickActions: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { fontWeight: '600', fontSize: 13 },

  sectionLabel: { color: '#64748B', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' },
  emptyText: { color: '#475569', fontStyle: 'italic', marginBottom: 10, fontSize: 13 },

  logItem: {
    backgroundColor: '#1F2937',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151'
  },
  logTitle: { color: '#F3F4F6', fontSize: 15, fontWeight: '500' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  
  statusBtn: {
      paddingHorizontal: 12,
      paddingVertical: 0,
      borderRadius: 6,
      justifyContent: 'center',
      alignItems: 'center',
      height: 36,
      borderWidth: 1,
      borderColor: '#4B5563'
  },

  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 30 },
  pickerContainer: { backgroundColor: '#1E293B', borderRadius: 12, padding: 24, borderWidth: 1, borderColor: '#334155' },
  pickerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  
  pickerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#334155' 
  },
  pickerSubject: { color: '#F3F4F6', fontSize: 15 },
});