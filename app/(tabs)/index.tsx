import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Platform, RefreshControl, SafeAreaView, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Button, Divider, IconButton, ProgressBar, Surface, Text, TextInput } from 'react-native-paper';
import { SubjectStats, useAttendanceStats } from '../../hooks/useAttendanceStats';
import { supabase } from '../../lib/supabase';

// CRITICAL: Legacy Import to prevent crash
// @ts-ignore
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import AttendanceChart from '../../components/AttendanceChart';
import Bunkometer from '../../components/Bunkometer';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function DashboardScreen() {
  const { stats, loading, refreshStats } = useAttendanceStats();
  const [simSubject, setSimSubject] = useState<SubjectStats | null>(null);
  const [bunkometerVisible, setBunkometerVisible] = useState(false);
  
  // User Profile State
  const [userName, setUserName] = useState('Student');
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Today's Operations State
  const [todayLogs, setTodayLogs] = useState<any[]>([]);
  const [loggingLoad, setLoggingLoad] = useState<string | null>(null);

  useEffect(() => {
    getProfile();
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshStats();
      fetchTodaysLogs();
    }, [])
  );

  const getProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.user_metadata?.full_name) {
      setUserName(user.user_metadata.full_name);
    }
  };

  const fetchTodaysLogs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from('attendance_logs').select('*').eq('user_id', user.id).eq('date', todayStr);
    setTodayLogs(data || []);
  };

  // --- LOGIC: Mark Attendance (Widget) ---
  const markQuickAttendance = async (subjectId: string, status: 'present' | 'absent' | 'cancelled') => {
    setLoggingLoad(subjectId);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const todayStr = new Date().toISOString().split('T')[0];

    const existing = todayLogs.find(l => l.subject_id === subjectId);

    if (existing) {
      if (existing.status === status) {
        await supabase.from('attendance_logs').delete().eq('id', existing.id);
      } else {
        await supabase.from('attendance_logs').update({ status }).eq('id', existing.id);
      }
    } else {
      await supabase.from('attendance_logs').insert({
        user_id: user.id,
        subject_id: subjectId,
        date: todayStr,
        status
      });
    }

    await fetchTodaysLogs();
    await refreshStats(); 
    setLoggingLoad(null);
  };

  // --- LOGIC: Global Settings ---
  const [newTarget, setNewTarget] = useState('75');
  const [newName, setNewName] = useState('');

  const saveSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (newName) {
      await supabase.auth.updateUser({ data: { full_name: newName } });
      setUserName(newName);
    }

    if (newTarget) {
      const targetNum = parseInt(newTarget);
      await supabase.from('subjects').update({ target_percentage: targetNum }).eq('user_id', user.id);
    }

    Alert.alert("System", "Configuration saved successfully.");
    setSettingsVisible(false);
    refreshStats();
  };

  // --- LOGIC: Export CSV ---
  const exportData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: logs } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      const { data: allSubjects } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', user.id);

      if (!logs || logs.length === 0) {
        Alert.alert("System", "No data available to export.");
        return;
      }

      let csvHeader = "Date,Subject,Status\n";
      const csvRows = logs.map(log => {
        const subject = allSubjects?.find(s => s.id === log.subject_id);
        const subName = subject ? subject.name : 'Deleted Subject';
        return `${log.date},${subName},${log.status}`;
      });

      const csvString = csvHeader + csvRows.join('\n');
      const fileName = `Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = (FileSystem.documentDirectory || '') + fileName;

      await FileSystem.writeAsStringAsync(fileUri, csvString, {
        encoding: 'utf8' as any, 
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("System", "Sharing is not available on this device simulator.");
      }

    } catch (error) {
      console.error(error);
      Alert.alert("System Error", "Export failed. Check console for details.");
    }
  };

  // --- Derived Data ---
  const currentDayIndex = new Date().getDay();
  const currentDayName = DAYS[currentDayIndex];
  const todaysClasses = stats.filter(s => s.days && s.days.includes(currentDayName));
  const atRiskSubjects = stats.filter(s => s.status === 'AT_RISK');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>{greeting},</Text>
            <Text style={styles.usernameText}>{userName}</Text>
          </View>
          <IconButton 
            icon="cog" 
            iconColor="#94A3B8" 
            size={24} 
            style={styles.iconBtn}
            onPress={() => {
                setNewName(userName);
                setSettingsVisible(true);
            }} 
          />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { refreshStats(); fetchTodaysLogs(); }} tintColor="#4F46E5" />}
        >
          
          {/* 1. TODAY'S OPERATIONS WIDGET */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>TODAY'S SCHEDULE • {currentDayName.toUpperCase()}</Text>
                <Text style={styles.dateBadge}>{new Date().getDate()}</Text>
            </View>
            
            {todaysClasses.length === 0 ? (
                <Surface style={styles.emptyCard}>
                    <MaterialCommunityIcons name="coffee-outline" size={24} color="#64748B" />
                    <Text style={styles.emptyText}>No operations scheduled.</Text>
                </Surface>
            ) : (
                todaysClasses.map((item) => {
                    const log = todayLogs.find(l => l.subject_id === item.subjectId);
                    const status = log?.status; // 'present', 'absent', 'cancelled'
                    const isLoading = loggingLoad === item.subjectId;

                    return (
                        <Surface key={item.subjectId} style={styles.todayCard}>
                            <View style={{flex: 1}}>
                                <Text style={styles.todayCardTitle}>{item.subjectName}</Text>
                                <Text style={styles.todayCardTime}>
                                    {status === 'present' ? 'MARKED PRESENT' : status === 'absent' ? 'MARKED ABSENT' : status === 'cancelled' ? 'CANCELLED' : 'PENDING'}
                                </Text>
                            </View>
                            
                            <View style={styles.actionRow}>
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#4F46E5" />
                                ) : (
                                    <>
                                        <TouchableOpacity 
                                            onPress={() => markQuickAttendance(item.subjectId, 'present')}
                                            style={[styles.quickBtn, status === 'present' && styles.btnActiveGreen]}
                                        >
                                            <MaterialCommunityIcons name="check" size={18} color={status === 'present' ? 'white' : '#4B5563'} />
                                        </TouchableOpacity>

                                        <TouchableOpacity 
                                            onPress={() => markQuickAttendance(item.subjectId, 'absent')}
                                            style={[styles.quickBtn, status === 'absent' && styles.btnActiveRed]}
                                        >
                                            <MaterialCommunityIcons name="close" size={18} color={status === 'absent' ? 'white' : '#4B5563'} />
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                        </Surface>
                    );
                })
            )}
          </View>

          {/* 2. MAIN CHART */}
          {!loading && stats.length > 0 && (
            <View style={styles.chartWrapper}>
               <AttendanceChart data={stats} />
            </View>
          )}

          {/* 3. ALERTS */}
          {atRiskSubjects.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>SYSTEM ALERTS</Text>
              {atRiskSubjects.map((item) => (
                <Surface key={item.subjectId} style={styles.alertCard}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.cardTitle}>{item.subjectName}</Text>
                      <Text style={styles.alertSubtext}>Target: {item.target}%</Text>
                    </View>
                    <Text style={styles.alertPercent}>{item.percentage.toFixed(0)}%</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.actionRowFull}>
                    <Text style={styles.actionText}>
                       Requires <Text style={{fontWeight: 'bold', color: '#EF4444'}}>{item.classesToRecover}</Text> sessions to stabilize.
                    </Text>
                    <Button 
                      mode="text" 
                      compact 
                      textColor="#EF4444"
                      onPress={() => { setSimSubject(item); setBunkometerVisible(true); }}
                    >
                      Analyze
                    </Button>
                  </View>
                </Surface>
              ))}
            </View>
          )}

          {/* 4. SUBJECT LIST */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ALL METRICS</Text>
            {stats.map((item) => (
              <Surface key={item.subjectId} style={styles.subjectCard}>
                <View style={styles.subjectRow}>
                  <View style={[styles.ring, { borderColor: item.status === 'AT_RISK' ? '#EF4444' : '#22C55E' }]}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#E2E8F0' }}>
                      {item.percentage.toFixed(0)}
                    </Text>
                  </View>
                  <View style={{ marginLeft: 14, flex: 1 }}>
                    <Text style={styles.subjectName}>{item.subjectName}</Text>
                    <Text style={styles.subjectMeta}>{item.present} / {item.totalClasses} Sessions</Text>
                  </View>
                  <IconButton 
                    icon="calculator" 
                    iconColor="#64748B" 
                    size={20} 
                    onPress={() => { setSimSubject(item); setBunkometerVisible(true); }} 
                  />
                </View>
                <ProgressBar 
                  progress={item.percentage / 100} 
                  color={item.status === 'AT_RISK' ? '#EF4444' : '#22C55E'} 
                  style={styles.progressBar}
                />
              </Surface>
            ))}
          </View>

          {/* 5. OPERATIONAL MANUAL (HOW TO USE) */}
          <View style={styles.section}>
             <Text style={styles.sectionTitle}>OPERATIONAL MANUAL</Text>
             <Surface style={styles.guideCard}>
                <View style={styles.guideRow}>
                    <MaterialCommunityIcons name="check-circle-outline" size={20} color="#4F46E5" />
                    <Text style={styles.guideText}>Use <Text style={{fontWeight: 'bold', color: '#fff'}}>Today's Schedule</Text> (Top) for quick daily check-ins.</Text>
                </View>
                <View style={styles.guideRow}>
                    <MaterialCommunityIcons name="calendar-month" size={20} color="#4F46E5" />
                    <Text style={styles.guideText}>Use <Text style={{fontWeight: 'bold', color: '#fff'}}>Calendar Tab</Text> to log backdated attendance, mark holidays, or add extra classes.</Text>
                </View>
                <View style={styles.guideRow}>
                    <MaterialCommunityIcons name="calculator" size={20} color="#4F46E5" />
                    <Text style={styles.guideText}>Tap the <Text style={{fontWeight: 'bold', color: '#fff'}}>Calculator Icon</Text> on any subject to simulate "Bunk" scenarios.</Text>
                </View>
                <View style={styles.guideRow}>
                    <MaterialCommunityIcons name="cog" size={20} color="#4F46E5" />
                    <Text style={styles.guideText}>Tap <Text style={{fontWeight: 'bold', color: '#fff'}}>Gear Icon</Text> to export CSV data or edit your profile.</Text>
                </View>
             </Surface>
          </View>

          {/* 6. FOOTER */}
          <View style={styles.footer}>
             <Text style={styles.footerText}>System Architect: Aditya Kate</Text>
             <Text style={styles.footerSubText}>v1.0.0 • Enterprise Edition</Text>
          </View>

          <View style={{height: 60}} /> 
        </ScrollView>

        <Bunkometer visible={bunkometerVisible} onDismiss={() => setBunkometerVisible(false)} subject={simSubject} />
        
        {/* SETTINGS MODAL */}
        <Modal visible={settingsVisible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>System Configuration</Text>
                    <Button onPress={() => setSettingsVisible(false)} textColor="#4F46E5">Done</Button>
                </View>
                <ScrollView style={styles.modalContent}>
                    
                    <Text style={styles.formLabel}>IDENTITY</Text>
                    <TextInput 
                        value={newName}
                        onChangeText={setNewName}
                        placeholder="User Name"
                        placeholderTextColor="#64748B"
                        style={styles.input}
                        textColor="white"
                        mode="flat"
                        activeUnderlineColor="#4F46E5"
                        theme={{ colors: { background: '#1F2937' }}}
                    />

                    <Text style={[styles.formLabel, { marginTop: 20 }]}>GLOBAL THRESHOLD</Text>
                    <View style={styles.settingRow}>
                        <View style={{flex: 1}}>
                            <Text style={{color: 'white', fontSize: 16}}>Target Percentage</Text>
                            <Text style={{color: '#94A3B8', fontSize: 12}}>Applies to all subjects on save</Text>
                        </View>
                        <TextInput 
                            value={newTarget}
                            onChangeText={setNewTarget}
                            keyboardType="numeric"
                            style={[styles.input, {width: 60, textAlign: 'center'}]}
                            textColor="white"
                            theme={{ colors: { background: '#1F2937' }}}
                        />
                    </View>

                    <Text style={[styles.formLabel, { marginTop: 30 }]}>DATA MANAGEMENT</Text>
                    <TouchableOpacity style={styles.menuItem} onPress={exportData}>
                        <MaterialCommunityIcons name="database-export" size={22} color="#4F46E5" />
                        <Text style={styles.menuText}>Export CSV Payload</Text>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#4B5563" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.menuItem} onPress={saveSettings}>
                        <MaterialCommunityIcons name="content-save" size={22} color="#10B981" />
                        <Text style={styles.menuText}>Save Configuration</Text>
                    </TouchableOpacity>

                    <Divider style={{ marginVertical: 30, backgroundColor: '#374151' }} />

                    <Button 
                        mode="contained" 
                        onPress={async () => {
                            await supabase.auth.signOut();
                            setSettingsVisible(false);
                        }} 
                        buttonColor="#EF4444" 
                        style={{borderRadius: 8}}
                    >
                        Terminate Session
                    </Button>

                </ScrollView>
            </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F172A', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  container: { flex: 1, backgroundColor: '#0F172A' },
  
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingText: { color: '#94A3B8', fontSize: 14, fontWeight: '500' },
  usernameText: { color: '#F8FAFC', fontSize: 24, fontWeight: '700' },
  iconBtn: { backgroundColor: '#1E293B', margin: 0 },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 50 },
  
  chartWrapper: { marginBottom: 30 },
  section: { marginBottom: 25 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { color: '#475569', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginLeft: 4 },
  dateBadge: { backgroundColor: '#334155', color: '#F1F5F9', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },

  todayCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },
  todayCardTitle: { color: '#F1F5F9', fontSize: 16, fontWeight: '600' },
  todayCardTime: { color: '#64748B', fontSize: 10, marginTop: 4, fontWeight: 'bold', letterSpacing: 0.5 },
  actionRow: { flexDirection: 'row', gap: 8 },
  quickBtn: {
      width: 36, height: 36, borderRadius: 18, backgroundColor: '#374151',
      justifyContent: 'center', alignItems: 'center'
  },
  btnActiveGreen: { backgroundColor: '#22C55E' },
  btnActiveRed: { backgroundColor: '#EF4444' },

  emptyCard: { backgroundColor: '#1E293B', padding: 20, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 },
  emptyText: { color: '#64748B', fontStyle: 'italic' },

  alertCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { color: '#F1F5F9', fontSize: 18, fontWeight: '700' },
  alertSubtext: { color: '#64748B', fontSize: 12, marginTop: 2 },
  alertPercent: { color: '#EF4444', fontSize: 28, fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#334155', marginVertical: 15 },
  actionRowFull: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionText: { color: '#CBD5E1', fontSize: 13, flex: 1 },

  subjectCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  subjectRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  ring: { 
    width: 42, height: 42, borderRadius: 21, borderWidth: 2.5, 
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' 
  },
  subjectName: { color: '#F1F5F9', fontSize: 16, fontWeight: '600' },
  subjectMeta: { color: '#64748B', fontSize: 12, marginTop: 2 },
  progressBar: { height: 4, borderRadius: 2, backgroundColor: '#334155' },

  // Guide Styles
  guideCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#334155' },
  guideRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 15, gap: 12 },
  guideText: { color: '#94A3B8', fontSize: 13, flex: 1, lineHeight: 20 },

  // Footer Styles
  footer: { alignItems: 'center', paddingVertical: 20 },
  footerText: { color: '#475569', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  footerSubText: { color: '#334155', fontSize: 10, marginTop: 4 },

  modalContainer: { flex: 1, backgroundColor: '#0F172A' },
  modalHeader: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#374151' },
  modalTitle: { color: '#F3F4F6', fontSize: 18, fontWeight: 'bold' },
  modalContent: { padding: 20 },
  formLabel: { color: '#64748B', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 10 },
  input: { backgroundColor: '#1F2937', marginBottom: 15, borderRadius: 8 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1F2937', padding: 15, borderRadius: 12, marginBottom: 15 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F2937', padding: 15, borderRadius: 12, marginBottom: 10 },
  menuText: { color: 'white', fontSize: 16, marginLeft: 15, flex: 1 },
});