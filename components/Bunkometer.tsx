import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { Button, Divider, IconButton, Text } from 'react-native-paper';
import { SubjectStats } from '../hooks/useAttendanceStats';

interface BunkometerProps {
  visible: boolean;
  onDismiss: () => void;
  subject: SubjectStats | null;
}

export default function Bunkometer({ visible, onDismiss, subject }: BunkometerProps) {
  // Simulation States
  const [attendCount, setAttendCount] = useState(0);
  const [bunkCount, setBunkCount] = useState(0);
  
  useEffect(() => {
    setAttendCount(0);
    setBunkCount(0);
  }, [subject]);

  if (!subject) return null;

  // --- MATH ENGINE ---
  const currentPresent = subject.present;
  const currentTotal = subject.totalClasses;

  const newPresent = currentPresent + attendCount;
  const newTotal = currentTotal + attendCount + bunkCount;
  
  const newPercentage = newTotal > 0 ? (newPresent / newTotal) * 100 : 100;
  const isSafe = newPercentage >= subject.target;

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          
          {/* 1. HEADER */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Simulator</Text>
              <Text style={styles.headerSubtitle}>{subject.subjectName}</Text>
            </View>
            <IconButton icon="close" iconColor="#94A3B8" size={20} onPress={onDismiss} />
          </View>

          <Divider style={styles.divider} />

          {/* 2. RESULT PREVIEW (Dark Mode Style) */}
          <View style={[
            styles.resultBox, 
            { 
              borderColor: isSafe ? '#22C55E' : '#EF4444',
              backgroundColor: isSafe ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'
            }
          ]}>
            <Text style={styles.predictionLabel}>PREDICTED ATTENDANCE</Text>
            <Text style={[
              styles.percentageText, 
              { color: isSafe ? '#22C55E' : '#EF4444' }
            ]}>
              {newPercentage.toFixed(1)}%
            </Text>
            <Text style={styles.targetLabel}>Target: {subject.target}%</Text>
          </View>

          {/* 3. CONTROLS: Attend Next */}
          <View style={styles.controlRow}>
            <View>
                <Text style={styles.controlTitle}>Attend Next</Text>
                <Text style={styles.controlSub}>Classes you go to</Text>
            </View>
            <View style={styles.counter}>
                <IconButton 
                  mode="contained" 
                  containerColor="#334155" 
                  iconColor="white" 
                  icon="minus" 
                  size={18} 
                  onPress={() => setAttendCount(Math.max(0, attendCount - 1))} 
                />
                <Text style={styles.countText}>{attendCount}</Text>
                <IconButton 
                  mode="contained" 
                  containerColor="#4F46E5" 
                  iconColor="white" 
                  icon="plus" 
                  size={18} 
                  onPress={() => setAttendCount(attendCount + 1)} 
                />
            </View>
          </View>

          {/* 4. CONTROLS: Bunk Next */}
          <View style={styles.controlRow}>
            <View>
                <Text style={styles.controlTitle}>Bunk Next</Text>
                <Text style={styles.controlSub}>Classes you miss</Text>
            </View>
            <View style={styles.counter}>
                <IconButton 
                  mode="contained" 
                  containerColor="#334155" 
                  iconColor="white" 
                  icon="minus" 
                  size={18} 
                  onPress={() => setBunkCount(Math.max(0, bunkCount - 1))} 
                />
                <Text style={styles.countText}>{bunkCount}</Text>
                <IconButton 
                  mode="contained" 
                  containerColor="#EF4444" 
                  iconColor="white" 
                  icon="plus" 
                  size={18} 
                  onPress={() => setBunkCount(bunkCount + 1)} 
                />
            </View>
          </View>

          <Button 
            mode="contained" 
            onPress={onDismiss} 
            style={styles.closeBtn}
            contentStyle={{ height: 48 }}
            labelStyle={{ fontWeight: 'bold' }}
            buttonColor="#1E293B"
            textColor="#94A3B8"
          >
            Close Simulator
          </Button>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  container: { 
    backgroundColor: '#1E293B', // Dark Card
    borderRadius: 24, 
    padding: 24, 
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 10 
  },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { color: '#94A3B8', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' },
  headerSubtitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  divider: { backgroundColor: '#334155', marginBottom: 20 },

  // Result Box
  resultBox: { 
    alignItems: 'center', 
    padding: 24, 
    borderRadius: 16, 
    marginBottom: 24,
    borderWidth: 1,
  },
  predictionLabel: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold', marginBottom: 4, letterSpacing: 1 },
  percentageText: { fontSize: 42, fontWeight: 'bold' },
  targetLabel: { color: '#94A3B8', fontSize: 13, marginTop: 4 },

  // Controls
  controlRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  controlTitle: { color: '#F1F5F9', fontSize: 16, fontWeight: '600' },
  controlSub: { color: '#64748B', fontSize: 12 },
  
  counter: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 12, padding: 4 },
  countText: { color: 'white', fontSize: 18, fontWeight: 'bold', width: 30, textAlign: 'center' },

  closeBtn: { marginTop: 10, borderRadius: 12, borderColor: '#334155', borderWidth: 1 }
});