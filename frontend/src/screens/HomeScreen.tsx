import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, Alert, TouchableOpacity, TextInput } from 'react-native';
import { api } from '../api/client';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAuthStore } from '../store/authStore';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const logout = useAuthStore(state => state.logout);

  // Form State
  const [mood, setMood] = useState(5);
  const [stress, setStress] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [text, setText] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Recs State
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  const fetchRecs = async () => {
    setLoadingRecs(true);
    try {
      const data = await api.get('/recommendations/today');
      setRecommendations(data.recommendations);
    } catch (error) {
      console.log('Failed to fetch recs', error);
    } finally {
      setLoadingRecs(false);
    }
  };

  useEffect(() => {
    fetchRecs();
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post('/entries', { mood, stress, energy, text, tags });
      Alert.alert('Success', 'Check-in saved!');
      setText('');
      // Refresh recs
      fetchRecs();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFeedback = async (id: string, outcome: 'HELPED' | 'NOT_HELPED') => {
    try {
      await api.post(`/recommendations/${id}/feedback`, { outcome });
      Alert.alert('Thanks', 'Feedback recorded.');
      fetchRecs(); // Update UI
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const renderSlider = (label: string, value: number, setValue: (v: number) => void) => (
    <View style={styles.sliderContainer}>
      <Text>{label}: {value}</Text>
      <View style={styles.buttonRow}>
        {[1, 3, 5, 7, 9].map(v => (
          <TouchableOpacity
            key={v}
            style={[styles.valueBtn, value === v && styles.valueBtnSelected]}
            onPress={() => setValue(v)}>
            <Text style={[styles.btnText, value === v && { color: '#fff' }]}>{v}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Check-in</Text>
        <Button title="Logout" onPress={logout} />
      </View>

      <View style={styles.card}>
        {renderSlider('Mood', mood, setMood)}
        {renderSlider('Stress', stress, setStress)}
        {renderSlider('Energy', energy, setEnergy)}

        <TextInput
          style={styles.textInput}
          placeholder="How are you feeling properly?"
          value={text}
          onChangeText={setText}
          multiline
        />

        <Button title={submitting ? "Saving..." : "Check In"} onPress={handleSubmit} disabled={submitting} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Guidance</Text>
        {loadingRecs ? <Text>Loading...</Text> : recommendations.length === 0 ? (
          <Text style={{ fontStyle: 'italic' }}>Keep checking in to unlock recommendations.</Text>
        ) : (
          recommendations.map(rec => (
            <View key={rec.id} style={styles.recCard}>
              <Text style={styles.recType}>{rec.type}</Text>
              <Text>{rec.rationale}</Text>
              {rec.status === 'PENDING' && (
                <View style={styles.feedbackRow}>
                  <Button title="Helped" onPress={() => handleFeedback(rec.id, 'HELPED')} />
                  <Button title="Didn't Help" color="red" onPress={() => handleFeedback(rec.id, 'NOT_HELPED')} />
                </View>
              )}
            </View>
          ))
        )}
      </View>

      <View style={styles.navRow}>
        <Button title="Insights" onPress={() => navigation.navigate('Insights')} />
        <Button title="History" onPress={() => navigation.navigate('History')} />
      </View>
    </ScrollView>
  );
}

// TODO: Move styles to nativewind or separete file

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold' },
  card: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginBottom: 20 },
  sliderContainer: { marginBottom: 15 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  valueBtn: { padding: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 5, width: 40, alignItems: 'center' },
  valueBtnSelected: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  btnText: { color: '#333' },
  textInput: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, marginBottom: 15, height: 80, textAlignVertical: 'top' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 20, marginBottom: 10 },
  recCard: { backgroundColor: '#eef', padding: 15, borderRadius: 10, marginBottom: 10 },
  recType: { fontWeight: 'bold', marginBottom: 5 },
  feedbackRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  navRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
});
