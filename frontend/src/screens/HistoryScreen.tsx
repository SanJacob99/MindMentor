import React, { useEffect, useState } from 'react';
import { View, Text, SectionList, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Menu } from 'lucide-react-native';
import { api } from '../api/client';
import HistoryCard from '../components/HistoryCard';
import EntryDetailModal from '../components/EntryDetailModal';
import { Entry } from '../types/entry';
import Header from '../components/Header';

export default function HistoryScreen() {
  const [sections, setSections] = useState<{ title: string; data: Entry[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      let data: Entry[] = [];
      try {
        data = await api.get('/entries');
      } catch (e) {
        console.warn('API request failed', e);
        // In a real app, we might show an error state here.
        // For development/demo purposes, we could fall back to mock data if needed,
        // but for production correctness, we should handle the error.
      }

      const grouped = groupEntries(data || []);
      setSections(grouped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const groupEntries = (entries: Entry[]) => {
    const groups: { [key: string]: Entry[] } = {
      'Today': [],
      'Yesterday': [],
    };
    const otherGroups: { [key: string]: Entry[] } = {};

    const todayStr = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    entries.forEach(entry => {
      const date = new Date(entry.createdAt);
      const dateStr = date.toDateString();

      if (dateStr === todayStr) {
        groups['Today'].push(entry);
      } else if (dateStr === yesterdayStr) {
        groups['Yesterday'].push(entry);
      } else {
        // Group by Month Year
        const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (!otherGroups[monthYear]) otherGroups[monthYear] = [];
        otherGroups[monthYear].push(entry);
      }
    });

    const sections = [
      { title: 'Today', data: groups['Today'] },
      { title: 'Yesterday', data: groups['Yesterday'] },
      ...Object.keys(otherGroups).map(key => ({ title: key, data: otherGroups[key] }))
    ].filter(section => section.data.length > 0);

    return sections;
  };

  const handleEntryPress = (entry: Entry) => {
    setSelectedEntry(entry);
    setModalVisible(true);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-900 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#020617' }}>
      {/* Header */}
      <Header title="History" showDate={true} />

      <View className="px-6 pb-2">
        <Text className="text-slate-400 text-center">Your journey so far</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <HistoryCard entry={item} onPress={handleEntryPress} />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text className="text-slate-200 text-lg font-bold mt-6 mb-3">{title}</Text>
        )}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
        stickySectionHeadersEnabled={false}
      />

      <EntryDetailModal
        visible={modalVisible}
        entry={selectedEntry}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}
