import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInsightsSummary } from '../hooks/useInsights';
import { Menu, Sparkles } from 'lucide-react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import Header from '../components/Header';

type TabType = 'mood' | 'stress' | 'energy';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function InsightsScreen() {
    const { data, isLoading: loading } = useInsightsSummary('7d');
    const [activeTab, setActiveTab] = useState<TabType>('mood');

    if (loading) return (
        <View className="flex-1 bg-slate-950 justify-center items-center" style={{ backgroundColor: '#020617', minHeight: '100%' }}>
            <ActivityIndicator size="large" color="#3b82f6" />
        </View>
    );

    if (!data || !data.dataset) {
        return (
            <View className="flex-1 bg-slate-950 justify-center items-center" style={{ backgroundColor: '#020617', minHeight: '100%' }}>
                <Text className="text-white">No data available</Text>
            </View>
        );
    }

    // Chart configuration
    const chartHeight = 150;
    const chartWidth = Platform.OS === 'web' ? Math.min(SCREEN_WIDTH - 40, 600) : SCREEN_WIDTH - 40; // Max width on web
    const maxVal = 10; // Mood is 1-10

    const getPath = (values: number[]) => {
        if (!values || values.length === 0) return '';
        const stepX = chartWidth / (values.length - 1);

        // Normalize y
        const points = values.map((v, i) => ({
            x: i * stepX,
            y: chartHeight - (v / maxVal) * chartHeight
        }));

        if (points.length === 1) {
            return `M 0 ${points[0].y} L ${chartWidth} ${points[0].y}`;
        }

        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];
            const cx = (p0.x + p1.x) / 2;
            d += ` C ${cx} ${p0.y} ${cx} ${p1.y} ${p1.x} ${p1.y}`;
        }
        return d;
    };

    const getDots = (values: number[], color: string) => {
        if (!values) return null;
        const stepX = chartWidth / (values.length - 1);
        return values.map((v, i) => {
            const x = i * stepX;
            const y = chartHeight - (v / maxVal) * chartHeight;
            return <Circle key={i} cx={x} cy={y} r="3" fill="#0f172a" stroke={color} strokeWidth="2" />;
        });
    };

    const moodPath = getPath(data.dataset.mood);
    const stressPath = getPath(data.dataset.stress);
    const energyPath = getPath(data.dataset.energy);

    // Analysis Text Logic
    const analysisText = `Your energy levels remained steady this week, peaking on Wednesday. While stress showed a slight increase towards the weekend, your overall mood trended upwards, reaching its highest point today.`;

    // Accessibility Summary for Chart
    const currentData = data.dataset[activeTab] || [];
    const avg = currentData.length > 0 ? (currentData.reduce((a, b) => a + b, 0) / currentData.length).toFixed(1) : '0';
    const max = currentData.length > 0 ? Math.max(...currentData) : 0;
    const min = currentData.length > 0 ? Math.min(...currentData) : 0;
    const chartDescription = `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} chart. Average: ${avg}. Minimum: ${min}. Maximum: ${max}.`;

    return (
        <SafeAreaView className="flex-1 bg-slate-950" edges={['top', 'right', 'left']} style={{ flex: 1, backgroundColor: '#020617' }}>
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
                style={{ flex: 1 }}
            >
                <View style={{ flex: 1 }}>
                    {/* Header */}
                    <Header title="Insights" showDate={true} />

                    <Text style={{ color: '#94a3b8', textAlign: 'center', marginBottom: 24 }}>What's been changing lately</Text>

                    {/* Tabs */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, paddingHorizontal: 20, marginBottom: 32 }}>
                        <TabButton
                            label="Mood"
                            active={activeTab === 'mood'}
                            onPress={() => setActiveTab('mood')}
                            color="#3b82f6"
                        />
                        <TabButton
                            label="Stress"
                            active={activeTab === 'stress'}
                            onPress={() => setActiveTab('stress')}
                            color="#f97316"
                        />
                        <TabButton
                            label="Energy"
                            active={activeTab === 'energy'}
                            onPress={() => setActiveTab('energy')}
                            color="#2dd4bf"
                        />
                    </View>

                    {/* Line Chart */}
                    <View style={{ marginHorizontal: 20, marginBottom: 32 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text style={{ color: '#475569', fontSize: 12 }}>High</Text>
                        </View>
                        <View
                            style={{ height: chartHeight + 20, width: chartWidth }}
                            accessibilityRole="image"
                            accessibilityLabel={chartDescription}
                        >
                            {/* Grid Lines */}
                            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 20, justifyContent: 'space-between', paddingVertical: 8, pointerEvents: 'none' }}>
                                <View style={{ height: 1, backgroundColor: '#1e293b', width: '100%' }} />
                                <View style={{ height: 1, backgroundColor: '#1e293b', width: '100%' }} />
                                <View style={{ height: 1, backgroundColor: '#1e293b', width: '100%' }} />
                            </View>

                            <Svg height={chartHeight} width={chartWidth} style={{ position: 'absolute', top: 10 }}>
                                {/* Draw inactive lines first */}
                                <Path d={stressPath} stroke={activeTab === 'stress' ? '#f97316' : '#334155'} strokeWidth={activeTab === 'stress' ? 3 : 2} fill="none" opacity={activeTab === 'stress' ? 1 : 0.5} />
                                <Path d={energyPath} stroke={activeTab === 'energy' ? '#2dd4bf' : '#334155'} strokeWidth={activeTab === 'energy' ? 3 : 2} fill="none" opacity={activeTab === 'energy' ? 1 : 0.5} />
                                <Path d={moodPath} stroke={activeTab === 'mood' ? '#3b82f6' : '#334155'} strokeWidth={activeTab === 'mood' ? 3 : 2} fill="none" opacity={activeTab === 'mood' ? 1 : 0.5} />

                                {/* Draw Dots for active tab */}
                                {activeTab === 'mood' && getDots(data.dataset.mood, '#3b82f6')}
                                {activeTab === 'stress' && getDots(data.dataset.stress, '#f97316')}
                                {activeTab === 'energy' && getDots(data.dataset.energy, '#2dd4bf')}
                            </Svg>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, marginTop: 8 }}>
                            <Text style={{ color: '#475569', fontSize: 12 }}>Low</Text>
                        </View>

                        {/* X-Axis Labels */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                            {data.labels.map((l: string, i: number) => {
                                // Assuming labels are YYYY-MM-DD
                                const parts = l.split('-');
                                const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                                const day = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                                return <Text key={i} style={{ color: '#64748b', fontSize: 10, width: 30, textAlign: 'center' }}>{day}</Text>;
                            })}
                        </View>
                    </View>

                    {/* Analysis Card */}
                    <View style={{ marginHorizontal: 20, backgroundColor: '#0f172a', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#1e293b', marginBottom: 32 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <Sparkles size={20} color="#94a3b8" />
                            <Text style={{ color: 'white', fontWeight: 'bold', letterSpacing: 0.5 }}>ANALYSIS</Text>
                        </View>
                        <Text style={{ color: '#cbd5e1', fontSize: 16, lineHeight: 24, marginBottom: 24 }}>
                            {analysisText}
                        </Text>
                        <View style={{ height: 1, backgroundColor: '#1e293b', width: '100%', marginBottom: 16 }} />
                        <Text style={{ color: '#64748b', fontStyle: 'italic', fontSize: 14 }}>
                            Tip: You often report higher mood on days with recorded walks.
                        </Text>
                    </View>

                    {/* Scatter Chart */}
                    <View style={{ marginHorizontal: 20, marginBottom: 40 }}>
                        <Text style={{ color: 'white', fontWeight: 'bold', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>Stimulus vs Mood</Text>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text style={{ color: '#475569', fontSize: 12 }}>High</Text>
                        </View>

                        <View style={{ height: 180, width: chartWidth }}>
                            {/* Grid Lines */}
                            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 150, justifyContent: 'space-between', paddingVertical: 8, pointerEvents: 'none' }}>
                                <View style={{ height: 1, backgroundColor: '#1e293b', width: '100%' }} />
                                <View style={{ height: 1, backgroundColor: '#1e293b', width: '100%' }} />
                                <View style={{ height: 1, backgroundColor: '#1e293b', width: '100%' }} />
                            </View>

                            <Svg height={150} width={chartWidth}>
                                {/* Mock Data: ENV, REL, ACH */}
                                {[
                                    { id: 'ENV', values: [2, 3, 2.5, 3.5, 1.5] },
                                    { id: 'REL', values: [7, 8, 7.5, 9] },
                                    { id: 'ACH', values: [6, 7, 6.5, 8, 7.5] },
                                ].map((cat, colIndex) => {
                                    const colWidth = chartWidth / 3;
                                    const centerX = colIndex * colWidth + colWidth / 2;
                                    return cat.values.map((val, vIndex) => {
                                        const y = 150 - (val / 10) * 150;
                                        // Deterministic pseudo-random jitter
                                        const jitter = ((vIndex * 13) % 20) - 10;
                                        return <Circle key={`${cat.id}-${vIndex}`} cx={centerX + jitter} cy={y} r="4" fill="#3b82f6" />;
                                    });
                                })}
                            </Svg>

                            <View style={{ flexDirection: 'row', marginTop: 8 }}>
                                <View style={{ width: chartWidth / 3, alignItems: 'center' }}>
                                    <Text style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: 12 }}>ENV</Text>
                                    <Text style={{ color: '#475569', fontSize: 10 }}>Environment</Text>
                                </View>
                                <View style={{ width: chartWidth / 3, alignItems: 'center' }}>
                                    <Text style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: 12 }}>REL</Text>
                                    <Text style={{ color: '#475569', fontSize: 10 }}>Social</Text>
                                </View>
                                <View style={{ width: chartWidth / 3, alignItems: 'center' }}>
                                    <Text style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: 12 }}>ACH</Text>
                                    <Text style={{ color: '#475569', fontSize: 10 }}>Work</Text>
                                </View>
                            </View>
                        </View>
                        <Text style={{ color: '#475569', fontSize: 12, marginTop: -20 }}>Low</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function TabButton({ label, active, onPress, color }: { label: string, active: boolean, onPress: () => void, color: string }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${label} chart${active ? ', selected' : ''}`}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 9999,
                borderWidth: 1,
                borderColor: active ? '#475569' : '#1e293b',
                backgroundColor: active ? '#1e293b' : 'transparent'
            }}
        >
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginRight: 8 }} />
            <Text style={{ fontWeight: '500', color: active ? 'white' : '#94a3b8' }}>{label}</Text>
        </TouchableOpacity>
    );
}
