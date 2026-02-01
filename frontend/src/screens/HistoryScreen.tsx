import React, { useState, useMemo } from 'react';
import { View, Text, SectionList, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Menu, PenLine } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useEntries } from '../hooks/useEntries';
import HistoryCard from '../components/HistoryCard';
import EntryDetailModal from '../components/EntryDetailModal';
import { Entry } from '../types/entry';
import Header from '../components/Header';

export default function HistoryScreen() {
  const navigation = useNavigation<any>();
  const { data: entries = [], isLoading: loading } = useEntries();
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

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

  const sections = useMemo(() => groupEntries(entries), [entries]);

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
        style={{ flex: 1 }}
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <HistoryCard entry={item} onPress={handleEntryPress} />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text className="text-slate-200 text-lg font-bold mt-6 mb-3">{title}</Text>
        )}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100, flexGrow: 1 }}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center mt-10">
            <View className="bg-slate-900 p-6 rounded-full mb-6 border border-slate-800">
              <PenLine size={40} color="#3b82f6" />
            </View>
            <Text className="text-white text-xl font-bold mb-2">No entries yet</Text>
            <Text className="text-slate-400 text-center mb-8 px-8 leading-6">
              Track your first mood to start building your personal history.
            </Text>
            <TouchableOpacity
              className="bg-blue-600 px-8 py-4 rounded-xl active:bg-blue-700"
              onPress={() => navigation.navigate('Home')}
              accessibilityRole="button"
              accessibilityLabel="Check-in Now"
            >
              <Text className="text-white font-bold text-lg">Check-in Now</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <EntryDetailModal
        visible={modalVisible}
        entry={selectedEntry}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}
