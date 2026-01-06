import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { api } from '../api/client';

export default function HistoryScreen() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/entries')
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator style={{flex:1}} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>History</Text>
      <FlatList
        data={entries}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.date}>{new Date(item.createdAt).toDateString()}</Text>
            <View style={styles.row}>
              <Text>Mood: {item.mood}</Text>
              <Text>Stress: {item.stress}</Text>
              <Text>Energy: {item.energy}</Text>
            </View>
            {item.text ? <Text style={styles.text}>{item.text}</Text> : null}
            <Text style={styles.tags}>{item.tags.join(', ')}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  item: { backgroundColor: '#f0f0f0', padding: 15, borderRadius: 10, marginBottom: 10 },
  date: { fontWeight: 'bold', marginBottom: 5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  text: { fontStyle: 'italic', marginBottom: 5 },
  tags: { color: '#666', fontSize: 12 },
});
