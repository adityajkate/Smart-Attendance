import { supabase } from '@/lib/supabase';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { Button, Dialog, Paragraph, Portal, Text, TextInput, useTheme } from 'react-native-paper';

export default function LoginScreen() {
  const theme = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Dialog State
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const showDialog = (title: string, message: string, success: boolean = false) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setIsSuccess(success);
    setDialogVisible(true);
  };

  const handleDialogDismiss = () => {
    setDialogVisible(false);
    if (isSuccess && !isLogin) {
      setIsLogin(true); // Switch to Login view after success
    }
  };

  async function handleAuth() {
    if (!email || !password) return showDialog('Missing Fields', 'Please fill in all fields.');
    if (!isLogin && password !== confirmPassword) return showDialog('Password Error', 'Passwords do not match.');

    setLoading(true);

    if (isLogin) {
      // Login
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) showDialog('Login Failed', error.message);
    } else {
      // Signup
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { data: { full_name: fullName } } 
      });

      if (error) {
        showDialog('Signup Failed', error.message);
      } else {
        // Stop auto-login so they see the message
        await supabase.auth.signOut();
        showDialog('Success', 'Signup Successful! Login to continue.', true);
      }
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{ marginBottom: 40, alignItems: 'center' }}>
            <Text variant="displaySmall" style={{ color: theme.colors.onSurface, fontWeight: 'bold', marginBottom: 8 }}>
              {isLogin ? 'Welcome Back' : 'Join Us'}
            </Text>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
              {isLogin ? 'Login to continue.' : 'Create an account.'}
            </Text>
          </View>

          {/* Form */}
          <View style={{ width: '100%' }}>
            {!isLogin && (
              <TextInput
                mode="outlined"
                label="Full Name"
                value={fullName}
                onChangeText={setFullName}
                style={styles.input}
                theme={{ colors: { background: theme.colors.surface } }}
                left={<TextInput.Icon icon="account" color={theme.colors.onSurfaceVariant} />}
              />
            )}

            <TextInput
              mode="outlined"
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              theme={{ colors: { background: theme.colors.surface } }}
              left={<TextInput.Icon icon="email" color={theme.colors.onSurfaceVariant} />}
            />

            <TextInput
              mode="outlined"
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={styles.input}
              theme={{ colors: { background: theme.colors.surface } }}
              left={<TextInput.Icon icon="lock" color={theme.colors.onSurfaceVariant} />}
              right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} />}
            />

            {!isLogin && (
              <TextInput
                mode="outlined"
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                style={styles.input}
                theme={{ colors: { background: theme.colors.surface } }}
                left={<TextInput.Icon icon="lock-check" color={theme.colors.onSurfaceVariant} />}
              />
            )}

            <Button 
              mode="contained" 
              onPress={handleAuth} 
              loading={loading} 
              style={styles.mainButton}
              contentStyle={{ height: 50 }}
            >
              {isLogin ? 'Log In' : 'Sign Up'}
            </Button>
          </View>

          {/* Toggle */}
          <View style={styles.footer}>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </Text>
            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
              <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                {isLogin ? 'Sign Up' : 'Log In'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={handleDialogDismiss} style={{ backgroundColor: '#1F2937' }}>
          <View style={{ alignItems: 'center', paddingTop: 20 }}>
            <Dialog.Icon icon={isSuccess ? "check-circle" : "alert-circle"} size={40} color={isSuccess ? theme.colors.secondaryContainer : theme.colors.error} />
          </View>
          <Dialog.Title style={{ textAlign: 'center', color: '#F3F4F6' }}>{dialogTitle}</Dialog.Title>
          <Dialog.Content>
            <Paragraph style={{ textAlign: 'center', color: '#9CA3AF' }}>{dialogMessage}</Paragraph>
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: 'center', paddingBottom: 20 }}>
            <Button mode="contained" onPress={handleDialogDismiss} buttonColor={isSuccess ? theme.colors.primary : '#374151'}>
              {isSuccess ? "Login Now" : "Try Again"}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  input: { marginBottom: 16, backgroundColor: '#111827' },
  mainButton: { borderRadius: 12, marginTop: 10 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
});