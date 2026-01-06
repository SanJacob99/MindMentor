import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { api } from '../api/client';

export default function InsightsScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/insights/summary?range=7d')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator style={{flex:1}} />;
  if (!data) return <Text style={{padding:20}}>No data available</Text>;

  const maxVal = Math.max(...(data.data || [0]), 10);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Last 7 Days (Mood)</Text>
      
      <View style={styles.chartContainer}>
        {data.labels.map((label: string, index: number) => {
          const value = data.data[index];
          const heightPct = (value / maxVal) * 100;
          return (
            <View key={index} style={styles.barWrapper}>
              <View style={[styles.bar, { height: `${heightPct}%`, backgroundColor: value < 5 ? '#f88' : '#8d8' }]} />
              <Text style={styles.label}>{label.slice(5)}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.stats}>
        <Text>Count: {data.count}</Text>
        <Text>Average Mood: {data.averageMood.toFixed(1)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50 },
  title: { fontSize: 24, marginBottom: 30, textAlign: 'center' },
  chartContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 200, marginBottom: 20 },
  barWrapper: { alignItems: 'center', width: 30 },
  bar: { width: 20, borderRadius: 5 },
  label: { fontSize: 10, marginTop: 5 },
  stats: { alignItems: 'center' },
});
