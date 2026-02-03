import React from 'react';
import { View, Text } from 'react-native';
import Slider from '@react-native-community/slider';

const getLabel = (value: number, type: 'mood' | 'stress' | 'energy') => {
    if (type === 'mood') return value > 7 ? 'Good' : value > 4 ? 'Okay' : 'Low';
    if (type === 'stress') return value > 7 ? 'High' : value > 4 ? 'Moderate' : 'Low';
    if (type === 'energy') return value > 7 ? 'High' : value > 4 ? 'Moderate' : 'Low';
    return '';
};

const getColor = (type: 'mood' | 'stress' | 'energy') => {
    if (type === 'mood') return '#3b82f6'; // blue-500
    if (type === 'stress') return '#f97316'; // orange-500
    if (type === 'energy') return '#2dd4bf'; // teal-400
    return '#fff';
};

interface CustomSliderProps {
    label: string;
    value: number;
    setValue: (v: number) => void;
    icon: any;
    type: 'mood' | 'stress' | 'energy';
}

const CustomSlider = ({ label, value, setValue, icon: Icon, type }: CustomSliderProps) => {
    const textLabel = getLabel(value, type);

    return (
        <View className="mb-6">
            <View className="flex-row justify-between items-center mb-2">
                <View className="flex-row items-center gap-2">
                    <Icon size={20} color={getColor(type)} />
                    <Text className="text-slate-200 text-base font-medium">{label}</Text>
                </View>
                <Text className="text-slate-400 font-medium bg-slate-800 px-2 py-1 rounded text-xs">{textLabel}</Text>
            </View>
            <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={1}
                maximumValue={10}
                step={0.1}
                value={value}
                onValueChange={setValue}
                minimumTrackTintColor={getColor(type)}
                maximumTrackTintColor="#334155"
                thumbTintColor="#fff"
                accessibilityLabel={label}
                accessibilityRole="adjustable"
                accessibilityValue={{ min: 1, max: 10, now: value, text: textLabel }}
            />
        </View>
    );
};

export default CustomSlider;
