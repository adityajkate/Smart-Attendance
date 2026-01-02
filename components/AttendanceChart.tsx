import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { SubjectStats } from '../hooks/useAttendanceStats';

interface AttendanceChartProps {
  data: SubjectStats[];
}

// Professional Palette (Distinct but Muted)
const PALETTE = [
  '#6366F1', // Indigo
  '#10B981', // Emerald
  '#F43F5E', // Rose
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#8B5CF6', // Violet
];

export default function AttendanceChart({ data }: AttendanceChartProps) {
  if (data.length === 0) return null;

  // Calculations
  const totalClassesAll = data.reduce((sum, item) => sum + item.totalClasses, 0);
  const totalPresentAll = data.reduce((sum, item) => sum + item.present, 0);
  const overallPercentage = totalClassesAll > 0 
    ? Math.round((totalPresentAll / totalClassesAll) * 100) 
    : 0;

  // Chart Data
  const pieData = data.map((item, index) => ({
    value: item.totalClasses > 0 ? item.totalClasses : 1,
    color: PALETTE[index % PALETTE.length],
    focused: false, 
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Attendance Overview</Text>

      <View style={styles.contentRow}>
        {/* CHART SECTION */}
        <View style={styles.chartContainer}>
          <PieChart
            data={pieData}
            donut
            radius={70}
            innerRadius={55}
            innerCircleColor="#1E293B"
            centerLabelComponent={() => (
              <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                <Text style={styles.centerValue}>{overallPercentage}%</Text>
                <Text style={styles.centerLabel}>Overall</Text>
              </View>
            )}
          />
        </View>

        {/* DATA BREAKDOWN SECTION */}
        <View style={styles.legendContainer}>
          {data.map((item, index) => (
            <View key={item.subjectId} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: PALETTE[index % PALETTE.length] }]} />
              <View>
                <Text style={styles.legendTitle} numberOfLines={1}>{item.subjectName}</Text>
                <Text style={styles.legendSubtitle}>{item.percentage.toFixed(0)}%</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B', // Dark Card
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartContainer: {
    marginRight: 20,
  },
  centerValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  centerLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  
  // Right Side Legend
  legendContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
    marginTop: 2,
  },
  legendTitle: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '500',
  },
  legendSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
  },
});