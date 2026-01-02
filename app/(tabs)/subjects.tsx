import React, { useState } from 'react';
import { Alert, FlatList, Modal, Platform, SafeAreaView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, FAB, IconButton, Text, TextInput } from 'react-native-paper';
import { useSubjects } from '../../hooks/useSubjects';
import { supabase } from '../../lib/supabase';

// SUNDAY REMOVED as requested
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function SubjectsScreen() {
  const { subjects, refreshSubjects, addSubject, deleteSubject } = useSubjects();
  const [visible, setVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [target, setTarget] = useState('75');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const toggleDay = (day: string) => {
    selectedDays.includes(day) 
      ? setSelectedDays(selectedDays.filter(d => d !== day)) 
      : setSelectedDays([...selectedDays, day]);
  };

  // Open modal for NEW subject
  const openNew = () => {
    setEditingId(null);
    setName('');
    setTarget('75');
    setSelectedDays([]);
    setVisible(true);
  }

  // Open modal for EDITING subject (CRASH FIXED HERE)
  const openEdit = (subject: any) => {
    setEditingId(subject.id);
    setName(subject.name);
    
    // SAFETY CHECK: If target_percentage is missing, use '75'
    const safeTarget = subject.target_percentage !== null && subject.target_percentage !== undefined 
      ? subject.target_percentage.toString() 
      : '75';
      
    setTarget(safeTarget);
    setSelectedDays(subject.days || []);
    setVisible(true);
  }

  const handleSave = async () => {
    if (!name) return;

    // Convert string input to number safely
    const finalTarget = parseInt(target) || 75;

    if (editingId) {
      // UPDATE Existing
      const { error } = await supabase
        .from('subjects')
        .update({ 
          name, 
          target_percentage: finalTarget, 
          days: selectedDays 
        })
        .eq('id', editingId);
        
      if (error) Alert.alert('Error', error.message);
    } else {
      // CREATE New
      await addSubject(name, target, selectedDays);
    }
    
    refreshSubjects();
    setVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Manage Subjects</Text>

        <FlatList
          data={subjects}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => openEdit(item)} activeOpacity={0.8}>
              <View style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardSubtitle}>
                    {item.days && item.days.length > 0 ? item.days.join(', ') : 'No schedule'}
                  </Text>
                  <Text style={{color: '#64748B', fontSize: 10, marginTop: 4}}>Tap to edit</Text>
                </View>
                <IconButton icon="trash-can-outline" iconColor="#EF4444" onPress={() => deleteSubject(item.id)} />
              </View>
            </TouchableOpacity>
          )}
        />

        <FAB icon="plus" style={styles.fab} color="white" onPress={openNew} />

        {/* DARK MODE MODAL */}
        <Modal visible={visible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingId ? 'Edit Subject' : 'New Subject'}</Text>
              
              <TextInput 
                label="Subject Name" 
                value={name} 
                onChangeText={setName} 
                style={styles.input} 
                mode="outlined"
                textColor="white"
                theme={{ colors: { background: '#111827', placeholder: '#9CA3AF', outline: '#374151' }}}
              />
              <TextInput 
                label="Target %" 
                value={target} 
                keyboardType="numeric" 
                onChangeText={setTarget} 
                style={styles.input} 
                mode="outlined"
                textColor="white"
                theme={{ colors: { background: '#111827', placeholder: '#9CA3AF', outline: '#374151' }}}
              />

              <Text style={styles.label}>Timetable (Sunday is Holiday):</Text>
              <View style={styles.dayContainer}>
                {DAYS.map(day => (
                  <TouchableOpacity 
                    key={day} 
                    onPress={() => toggleDay(day)}
                    style={[styles.dayChip, selectedDays.includes(day) && styles.dayChipSelected]}
                  >
                    <Text style={{color: selectedDays.includes(day) ? 'white' : '#9CA3AF', fontSize: 12}}>{day}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalButtons}>
                <Button onPress={() => setVisible(false)} textColor="#9CA3AF">Cancel</Button>
                <Button mode="contained" onPress={handleSave} buttonColor="#4F46E5">
                  {editingId ? 'Update' : 'Save'}
                </Button>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F172A', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  container: { flex: 1, padding: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#F3F4F6', marginBottom: 20 },
  
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#374151'
  },
  cardTitle: { color: '#F3F4F6', fontSize: 18, fontWeight: '600' },
  cardSubtitle: { color: '#9CA3AF', marginTop: 4 },
  
  fab: { position: 'absolute', margin: 20, right: 0, bottom: 0, backgroundColor: '#4F46E5' },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1F2937', padding: 24, borderRadius: 20, borderColor: '#374151', borderWidth: 1 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 20 },
  input: { marginBottom: 16, backgroundColor: '#111827' },
  label: { color: '#E5E7EB', marginBottom: 10, fontWeight: '600' },
  dayContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  dayChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#111827', borderWidth: 1, borderColor: '#374151' },
  dayChipSelected: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
});