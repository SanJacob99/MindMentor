import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../navigation/RootNavigator';
import { useInsightsSummary, usePatterns, useTagAnalysis, useTextAnalysis } from '../hooks/useInsights';
import { Sparkles } from 'lucide-react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import Header from '../components/Header';
import PatternCard from '../components/PatternCard';
import TrendChart from '../components/TrendChart';
import StreakBadge from '../components/StreakBadge';
import TagImpactChart from '../components/TagImpactChart';
import EmotionBreakdown from '../components/EmotionBreakdown';
import KeywordCloud from '../components/KeywordCloud';
import InsightsList from '../components/InsightsList';

type TabType = 'mood' | 'stress' | 'energy';
type SectionType = 'overview' | 'patterns' | 'tags' | 'journal';

const SCREEN_WIDTH = Dimensions.get('window').width;

const SCATTER_DATA = [
    { id: 'ENV', label: 'Environment', values: [2, 3, 2.5, 3.5, 1.5] },
    { id: 'REL', label: 'Social', values: [7, 8, 7.5, 9] },
    { id: 'ACH', label: 'Work', values: [6, 7, 6.5, 8, 7.5] },
];

export default function InsightsScreen() {
    const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
    const [activeSection, setActiveSection] = useState<SectionType>('overview');
    const [activeTab, setActiveTab] = useState<TabType>('mood');
    const [range, setRange] = useState<'30d' | '90d'>('30d');

    const { data, isLoading: loading } = useInsightsSummary('7d');
    const { data: patternsData, isLoading: patternsLoading } = usePatterns(range);
    const { data: tagsData, isLoading: tagsLoading } = useTagAnalysis(range);
    const { data: textData, isLoading: textLoading } = useTextAnalysis(range);

    if (loading) return (
        <View className="flex-1 bg-slate-950 justify-center items-center" style={{ backgroundColor: '#020617', minHeight: '100%' }}>
            <ActivityIndicator size="large" color="#3b82f6" />
        </View>
    );

    if (!data || !data.dataset) {
        return (
            <View className="flex-1 bg-slate-950 justify-center items-center px-8" style={{ backgroundColor: '#020617', minHeight: '100%' }}>
                <View className="bg-slate-900 p-6 rounded-full mb-6 border border-slate-800 items-center justify-center">
                    <Sparkles size={40} color="#3b82f6" />
                </View>
                <Text className="text-white text-xl font-bold mb-2">No insights yet</Text>
                <Text className="text-slate-400 text-center leading-6 mb-8">
                    Keep checking in! Your patterns and insights will appear here once you've logged a few more entries.
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
        );
    }

    // Chart configuration
    const chartHeight = 150;
    const chartWidth = Platform.OS === 'web' ? Math.min(SCREEN_WIDTH - 40, 600) : SCREEN_WIDTH - 40;
    const maxVal = 10;

    const getPath = (values: number[]) => {
        if (!values || values.length === 0) return '';
        const stepX = chartWidth / (values.length - 1);
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

    const currentData = data.dataset[activeTab] || [];
    const avg = currentData.length > 0 ? (currentData.reduce((a: number, b: number) => a + b, 0) / currentData.length).toFixed(1) : '0';
    const max = currentData.length > 0 ? Math.max(...currentData) : 0;
    const min = currentData.length > 0 ? Math.min(...currentData) : 0;
    const chartDescription = `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} chart. Average: ${avg}. Minimum: ${min}. Maximum: ${max}.`;

    const getScatterAccessibilityLabel = () => {
        const summaries = SCATTER_DATA.map(category => {
            const catAvg = (category.values.reduce((a: number, b: number) => a + b, 0) / category.values.length).toFixed(1);
            return `${category.label} average mood: ${catAvg}/10`;
        });
        return `Scatter chart comparing stimulus vs mood. ${summaries.join('. ')}.`;
    };

    const renderSectionLoading = () => (
        <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#3b82f6" />
            <Text style={{ color: '#64748b', marginTop: 8, fontSize: 13 }}>Loading...</Text>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-slate-950" edges={['top', 'right', 'left']} style={{ flex: 1, backgroundColor: '#020617' }}>
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
                style={{ flex: 1 }}
            >
                <View style={{ flex: 1 }}>
                    <Header title="Insights" showDate={true} />

                    <Text style={{ color: '#94a3b8', textAlign: 'center', marginBottom: 16 }}>What's been changing lately</Text>

                    {/* Section Picker */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, marginBottom: 24 }}
                    >
                        {([
                            { key: 'overview', label: 'Overview' },
                            { key: 'patterns', label: 'Patterns' },
                            { key: 'tags', label: 'Tags' },
                            { key: 'journal', label: 'Journal' },
                        ] as { key: SectionType; label: string }[]).map((section) => (
                            <TouchableOpacity
                                key={section.key}
                                onPress={() => setActiveSection(section.key)}
                                accessibilityRole="tab"
                                accessibilityState={{ selected: activeSection === section.key }}
                                accessibilityLabel={section.label}
                                style={{
                                    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                                    backgroundColor: activeSection === section.key ? '#3b82f6' : 'transparent',
                                    borderWidth: 1,
                                    borderColor: activeSection === section.key ? '#3b82f6' : '#1e293b',
                                }}
                            >
                                <Text style={{
                                    color: activeSection === section.key ? 'white' : '#94a3b8',
                                    fontWeight: activeSection === section.key ? '600' : '400',
                                    fontSize: 14,
                                }}>
                                    {section.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Range Picker (for non-overview sections) */}
                    {activeSection !== 'overview' && (
                        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
                            {(['30d', '90d'] as const).map((r) => (
                                <TouchableOpacity
                                    key={r}
                                    onPress={() => setRange(r)}
                                    accessibilityRole="tab"
                                    accessibilityState={{ selected: range === r }}
                                    style={{
                                        paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8,
                                        backgroundColor: range === r ? '#1e293b' : 'transparent',
                                        borderWidth: 1, borderColor: range === r ? '#475569' : '#1e293b',
                                    }}
                                >
                                    <Text style={{ color: range === r ? 'white' : '#64748b', fontSize: 12 }}>
                                        {r === '30d' ? '30 Days' : '90 Days'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* === OVERVIEW SECTION === */}
                    {activeSection === 'overview' && (
                        <>
                            {/* Metric Tabs */}
                            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, paddingHorizontal: 20, marginBottom: 32 }}>
                                <TabButton label="Mood" active={activeTab === 'mood'} onPress={() => setActiveTab('mood')} color="#3b82f6" />
                                <TabButton label="Stress" active={activeTab === 'stress'} onPress={() => setActiveTab('stress')} color="#f97316" />
                                <TabButton label="Energy" active={activeTab === 'energy'} onPress={() => setActiveTab('energy')} color="#2dd4bf" />
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
                                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 20, justifyContent: 'space-between', paddingVertical: 8, pointerEvents: 'none' }}>
                                        <View style={{ height: 1, backgroundColor: '#1e293b', width: '100%' }} />
                                        <View style={{ height: 1, backgroundColor: '#1e293b', width: '100%' }} />
                                        <View style={{ height: 1, backgroundColor: '#1e293b', width: '100%' }} />
                                    </View>

                                    <Svg height={chartHeight} width={chartWidth} style={{ position: 'absolute', top: 10 }}>
                                        <Path d={stressPath} stroke={activeTab === 'stress' ? '#f97316' : '#334155'} strokeWidth={activeTab === 'stress' ? 3 : 2} fill="none" opacity={activeTab === 'stress' ? 1 : 0.5} />
                                        <Path d={energyPath} stroke={activeTab === 'energy' ? '#2dd4bf' : '#334155'} strokeWidth={activeTab === 'energy' ? 3 : 2} fill="none" opacity={activeTab === 'energy' ? 1 : 0.5} />
                                        <Path d={moodPath} stroke={activeTab === 'mood' ? '#3b82f6' : '#334155'} strokeWidth={activeTab === 'mood' ? 3 : 2} fill="none" opacity={activeTab === 'mood' ? 1 : 0.5} />
                                        {activeTab === 'mood' && getDots(data.dataset.mood, '#3b82f6')}
                                        {activeTab === 'stress' && getDots(data.dataset.stress, '#f97316')}
                                        {activeTab === 'energy' && getDots(data.dataset.energy, '#2dd4bf')}
                                    </Svg>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, marginTop: 8 }}>
                                    <Text style={{ color: '#475569', fontSize: 12 }}>Low</Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                                    {data.labels.map((l: string, i: number) => {
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
                                    Your energy levels remained steady this week, peaking on Wednesday. While stress showed a slight increase towards the weekend, your overall mood trended upwards, reaching its highest point today.
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
                                <View
                                    style={{ height: 180, width: chartWidth }}
                                    accessibilityRole="image"
                                    accessibilityLabel={getScatterAccessibilityLabel()}
                                >
                                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 150, justifyContent: 'space-between', paddingVertical: 8, pointerEvents: 'none' }}>
                                        <View style={{ height: 1, backgroundColor: '#1e293b', width: '100%' }} />
                                        <View style={{ height: 1, backgroundColor: '#1e293b', width: '100%' }} />
                                        <View style={{ height: 1, backgroundColor: '#1e293b', width: '100%' }} />
                                    </View>
                                    <Svg height={150} width={chartWidth}>
                                        {SCATTER_DATA.map((cat, colIndex) => {
                                            const colWidth = chartWidth / 3;
                                            const centerX = colIndex * colWidth + colWidth / 2;
                                            return cat.values.map((val, vIndex) => {
                                                const y = 150 - (val / 10) * 150;
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
                        </>
                    )}

                    {/* === PATTERNS SECTION === */}
                    {activeSection === 'patterns' && (
                        <View style={{ paddingHorizontal: 20, gap: 20 }}>
                            {patternsLoading ? renderSectionLoading() : patternsData?.message ? (
                                <View style={{ backgroundColor: '#0f172a', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#1e293b' }}>
                                    <Text style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center' }}>{patternsData.message}</Text>
                                </View>
                            ) : patternsData ? (
                                <>
                                    <PatternCard
                                        hourlyBuckets={patternsData.timeOfDay.buckets}
                                        bestBucket={patternsData.timeOfDay.bestBucket}
                                        worstBucket={patternsData.timeOfDay.worstBucket}
                                        weekdayDays={patternsData.weekday.days}
                                        bestDay={patternsData.weekday.bestDay}
                                        worstDay={patternsData.weekday.worstDay}
                                    />
                                    <TrendChart
                                        weeks={patternsData.trends.weeks}
                                        direction={patternsData.trends.direction}
                                        slopes={patternsData.trends.slopes}
                                    />
                                    <StreakBadge
                                        currentStreaks={patternsData.streaks.current}
                                        bestStreaks={patternsData.streaks.best}
                                        volatility={patternsData.streaks.volatility}
                                    />
                                    {patternsData.insights?.length > 0 && (
                                        <InsightsList insights={patternsData.insights} title="PATTERN INSIGHTS" />
                                    )}
                                </>
                            ) : null}
                        </View>
                    )}

                    {/* === TAGS SECTION === */}
                    {activeSection === 'tags' && (
                        <View style={{ paddingHorizontal: 20, gap: 20 }}>
                            {tagsLoading ? renderSectionLoading() : tagsData?.message ? (
                                <View style={{ backgroundColor: '#0f172a', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#1e293b' }}>
                                    <Text style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center' }}>{tagsData.message}</Text>
                                </View>
                            ) : tagsData ? (
                                <>
                                    <TagImpactChart tagAnalysis={tagsData.tagAnalysis || []} />
                                    {tagsData.combinations?.length > 0 && (
                                        <View style={{ backgroundColor: '#0f172a', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#1e293b' }}>
                                            <Text style={{ color: 'white', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                                                Tag Combinations
                                            </Text>
                                            {tagsData.combinations.slice(0, 5).map((combo: { tags: string[]; coOccurrences: number; moodDeviation: number }, i: number) => (
                                                <View key={i} style={{
                                                    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                                                    paddingVertical: 8, borderBottomWidth: i < Math.min(tagsData.combinations.length, 5) - 1 ? 1 : 0,
                                                    borderBottomColor: '#1e293b',
                                                }}>
                                                    <Text style={{ color: '#cbd5e1', fontSize: 13 }}>
                                                        {combo.tags[0]} + {combo.tags[1]}
                                                    </Text>
                                                    <Text style={{
                                                        color: combo.moodDeviation > 0 ? '#22c55e' : '#ef4444',
                                                        fontSize: 13, fontWeight: '600',
                                                    }}>
                                                        {combo.moodDeviation > 0 ? '+' : ''}{Math.round(combo.moodDeviation)}%
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                    {tagsData.insights?.length > 0 && (
                                        <InsightsList insights={tagsData.insights} title="TAG INSIGHTS" />
                                    )}
                                </>
                            ) : null}
                        </View>
                    )}

                    {/* === JOURNAL SECTION === */}
                    {activeSection === 'journal' && (
                        <View style={{ paddingHorizontal: 20, gap: 20 }}>
                            {textLoading ? renderSectionLoading() : textData?.message ? (
                                <View style={{ backgroundColor: '#0f172a', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#1e293b' }}>
                                    <Text style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center' }}>{textData.message}</Text>
                                </View>
                            ) : textData ? (
                                <>
                                    {/* Sentiment overview */}
                                    <View style={{ backgroundColor: '#0f172a', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#1e293b' }}>
                                        <Text style={{ color: 'white', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                                            Sentiment
                                        </Text>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                                            <View style={{ alignItems: 'center' }}>
                                                <Text style={{
                                                    color: textData.sentiment.overall > 0.1 ? '#22c55e' : textData.sentiment.overall < -0.1 ? '#ef4444' : '#94a3b8',
                                                    fontSize: 28, fontWeight: 'bold',
                                                }}>
                                                    {textData.sentiment.overall > 0 ? '+' : ''}{textData.sentiment.overall.toFixed(2)}
                                                </Text>
                                                <Text style={{ color: '#64748b', fontSize: 11 }}>Overall</Text>
                                            </View>
                                            <View style={{ alignItems: 'center' }}>
                                                <Text style={{
                                                    color: textData.sentiment.direction === 'improving' ? '#22c55e' : textData.sentiment.direction === 'declining' ? '#ef4444' : '#94a3b8',
                                                    fontSize: 16, fontWeight: '600',
                                                }}>
                                                    {textData.sentiment.direction === 'improving' ? 'Improving' : textData.sentiment.direction === 'declining' ? 'Declining' : 'Stable'}
                                                </Text>
                                                <Text style={{ color: '#64748b', fontSize: 11 }}>Trend</Text>
                                            </View>
                                            <View style={{ alignItems: 'center' }}>
                                                <Text style={{ color: '#94a3b8', fontSize: 16, fontWeight: '600' }}>
                                                    {textData.entriesWithText}
                                                </Text>
                                                <Text style={{ color: '#64748b', fontSize: 11 }}>Entries</Text>
                                            </View>
                                        </View>
                                    </View>

                                    <EmotionBreakdown
                                        breakdown={textData.emotions?.breakdown || []}
                                        primary={textData.emotions?.primary || 'neutral'}
                                    />
                                    <KeywordCloud
                                        keywords={textData.keywords || []}
                                        baselineMood={textData.sentiment?.overall != null ? 5 + textData.sentiment.overall * 5 : 5}
                                    />
                                    {textData.insights?.length > 0 && (
                                        <InsightsList insights={textData.insights} title="JOURNAL INSIGHTS" />
                                    )}
                                </>
                            ) : null}
                        </View>
                    )}
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
            accessibilityLabel={`${label} chart`}
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
