import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Switch } from 'react-native';
import { api } from '../api/client';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';

type OnboardingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Onboarding'>;

export default function OnboardingScreen() {
  const [reminderTime, setReminderTime] = useState('09:00');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<OnboardingScreenNavigationProp>();

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const preferences = {
        reminderTime,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        onboardingCompleted: true
      };
      
      await api.post('/users/preferences', preferences);
      
      // Navigate to Home. Since Onboarding is in RootNavigator as a conditionally shown screen 
      // or part of the stack, we can navigate or reset.
      // If RootNavigator only checks token, we are already authenticated. 
      // If we used a state 'onboardingCompleted' in store, we would update it.
      // For now, we assume user can navigate to Home manually or we replace stack.
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
      
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to MindMentor</Text>
      <Text style={styles.subtitle}>Let's set you up for success.</Text>

      <View style={styles.field}>
        <Text>Daily Reminder Time (HH:MM)</Text>
        <TextInput
          style={styles.input}
          value={reminderTime}
          onChangeText={setReminderTime}
          placeholder="09:00"
        />
      </View>

      <Button title={loading ? "Saving..." : "Get Started"} onPress={handleSubmit} disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, marginBottom: 20, textAlign: 'center', color: '#666' },
  field: { marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginTop: 5, borderRadius: 5 },
});
