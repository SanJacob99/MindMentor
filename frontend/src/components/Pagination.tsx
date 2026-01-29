import React from 'react';
import { View, Dimensions } from 'react-native';
import Animated, {
    useAnimatedStyle,
    interpolate,
    Extrapolation,
    SharedValue,
    interpolateColor
} from 'react-native-reanimated';

type PaginationProps = {
    data: any[];
    scrollX: SharedValue<number>;
    screenWidth: number;
};

const Pagination = ({ data, scrollX, screenWidth }: PaginationProps) => {
    return (
        <View className="flex-row mb-5 justify-center items-center">
            {/* This might have problem in dynamic number of pages */}
            {data.map((_, index) => {
                const animatedStyle = useAnimatedStyle(() => {
                    const inputRange = [
                        (index - 1) * screenWidth,
                        index * screenWidth,
                        (index + 1) * screenWidth,
                    ];

                    const width = interpolate(
                        scrollX.value,
                        inputRange,
                        [8, 24, 8], // w-2 (8px) -> w-6 (24px) -> w-2 (8px)
                        Extrapolation.CLAMP
                    );

                    const backgroundColor = interpolateColor(
                        scrollX.value,
                        inputRange,
                        ['#334155', '#3B82F6', '#334155'] // slate-700 -> blue-500 -> slate-700
                    );

                    return {
                        width,
                        backgroundColor,
                    };
                });

                return (
                    <Animated.View
                        key={index}
                        style={[
                            { height: 8, borderRadius: 4, marginHorizontal: 4 }, // h-2 rounded-full mx-1
                            animatedStyle,
                        ]}
                    />
                );
            })}
        </View>
    );
};

export default Pagination;
