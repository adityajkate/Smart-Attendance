import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, Linking, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Divider, Text } from 'react-native-paper';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// FIX: Added 'as const' to satisfy LinearGradient's strict tuple requirement
const theme = {
  bg: ['#0F172A', '#1E1B4B'] as const, 
  cardBg: ['#1E293B', '#272953'] as const,
  primary: '#6366F1',
  accentGreen: '#22C55E',
  accentRed: '#EF4444',
  accentYellow: '#EAB308',
  accentPink: '#EC4899',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  borderColor: '#334155',
};

// Reusable Animated "Neon" Card Component
const NeonCard = ({ icon, color, title, children, index }: any) => (
  <Animated.View entering={FadeInDown.delay(index * 150).springify()}>
    {/* The Glowing Border Container */}
    <LinearGradient
      colors={[color, 'transparent'] as const} // Explicit casting here too
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardBorderGradient}
    >
      {/* The Inner Card Content */}
      <LinearGradient colors={theme.cardBg} style={styles.cardInner}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
             <MaterialCommunityIcons name={icon} size={24} color={color} />
          </View>
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
        <Text style={styles.cardBody}>{children}</Text>
      </LinearGradient>
    </LinearGradient>
  </Animated.View>
);

// Reusable Social Button Component
const SocialButton = ({ icon, color, url, index }: any) => (
  <Animated.View entering={FadeInUp.delay(600 + (index * 100)).springify()}>
    <TouchableOpacity onPress={() => Linking.openURL(url).catch(e => console.error(e))} activeOpacity={0.8}>
      <LinearGradient colors={['#334155', '#1E293B'] as const} style={styles.socialBtnBorder}>
         <View style={styles.socialBtnInner}>
           <MaterialCommunityIcons name={icon} size={26} color={color} />
         </View>
      </LinearGradient>
    </TouchableOpacity>
  </Animated.View>
);

export default function ManualScreen() {
  return (
    // Background Gradient for the whole screen
    <LinearGradient colors={theme.bg} style={styles.mainContainer}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* Animated Header */}
          <Animated.View style={styles.header} entering={FadeInDown.duration(500)}>
            <MaterialCommunityIcons name="book-open-variant" size={32} color={theme.primary} style={{marginBottom: 10}} />
            <Text style={styles.headerTitle}>System Guide</Text>
            <Text style={styles.headerSubtitle}>Maximize your academic efficiency.</Text>
          </Animated.View>

          <Divider style={{ backgroundColor: theme.borderColor, marginBottom: 25, opacity: 0.5 }} />

          {/* --- GUIDE SECTIONS (Staggered Animations) --- */}
          
          <NeonCard icon="view-dashboard-outline" color={theme.primary} title="1. Daily Operations" index={1}>
            • Open the <Text style={styles.highlight}>Dashboard</Text> every morning.{"\n"}
            • Use the "Today's Schedule" widget.{"\n"}
            • Tap <Text style={{color: theme.accentGreen, fontWeight:'bold'}}>✔ Present</Text> or <Text style={{color: theme.accentRed, fontWeight:'bold'}}>✖ Absent</Text> as you go.
          </NeonCard>

          <NeonCard icon="calendar-month-outline" color={theme.accentYellow} title="2. Managing Exceptions" index={2}>
            • Missed marking yesterday? Go to the <Text style={styles.highlight}>Calendar</Text>.{"\n"}
            • Select past dates to fix logs.{"\n"}
            • <Text style={{fontWeight: 'bold'}}>Extra Class?</Text> Use the "Log Extra Class" button for weekends.
          </NeonCard>

          <NeonCard icon="calculator-variant-outline" color={theme.accentPink} title="3. The Bunkometer" index={3}>
            • Can you skip tomorrow?{"\n"}
            • Tap the <Text style={styles.highlight}>Calculator Icon</Text> on any subject.{"\n"}
            • It calculates exactly how many classes you can bunk or must attend.
          </NeonCard>


          {/* --- DEVELOPER SECTION (Upward Animation) --- */}
          <View style={styles.devSectionContainer}>
            <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.devHeader}>
                 <Text style={styles.devTitle}>Designed & Engineered by</Text>
                 <Text style={styles.devName}>Aditya Kate</Text>
                 {/* A subtle gradient text effect for the role */}
                 <LinearGradient colors={[theme.primary, theme.accentPink] as const} start={{x:0, y:0}} end={{x:1, y:0}}>
                    <Text style={styles.devRole}>Future Data Scientist</Text>
                 </LinearGradient>
            </Animated.View>

            <View style={styles.socialRow}>
                <SocialButton icon="instagram" color="#E1306C" url="https://instagram.com/adiikate/" index={1} />
                <SocialButton icon="linkedin" color="#0A66C2" url="https://www.linkedin.com/in/adityajkate/" index={2} />
                <SocialButton icon="github" color="#F3F4F6" url="https://github.com/adityajkate" index={3} />
                <SocialButton icon="email-outline" color="#10B981" url="mailto:adityakate11@gmail.com" index={4} />
            </View>
          </View>

          <View style={{height: 80}} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 10 : 0 },
  content: { padding: 20 },
  
  // Header Styles
  header: { alignItems: 'flex-start', marginBottom: 20, paddingHorizontal: 4 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: theme.textPrimary, letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 16, color: theme.textSecondary, marginTop: 4 },
  
  introText: { color: theme.textSecondary, fontSize: 16, marginBottom: 24, lineHeight: 24 },
  highlight: { color: theme.primary, fontWeight: 'bold' },

  // Neon Card Styles
  cardBorderGradient: {
    borderRadius: 20,
    padding: 1.5, // The thickness of the glowing border
    marginBottom: 16,
  },
  cardInner: {
    borderRadius: 19, // Slightly less than outer border
    padding: 20,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconContainer: { padding: 8, borderRadius: 12, marginRight: 12 },
  cardTitle: { color: theme.textPrimary, fontSize: 18, fontWeight: '700' },
  cardBody: { color: '#CBD5E1', fontSize: 15, lineHeight: 26 },

  // Developer Section Styles
  devSectionContainer: { marginTop: 40, alignItems: 'center' },
  devHeader: { alignItems: 'center', marginBottom: 25 },
  devTitle: { color: theme.textSecondary, fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
  devName: { color: theme.textPrimary, fontSize: 26, fontWeight: '900', marginBottom: 2 },
  devRole: { fontSize: 16, fontWeight: '600', opacity: 0.9 },
  
  // Social Buttons Styles
  socialRow: { flexDirection: 'row', gap: 15 },
  socialBtnBorder: {
    width: 56, height: 56, borderRadius: 28,
    padding: 1, // Border thickness
    justifyContent: 'center', alignItems: 'center',
  },
  socialBtnInner: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: '#1E293B', // Solid inner color
    justifyContent: 'center', alignItems: 'center',
  },
});