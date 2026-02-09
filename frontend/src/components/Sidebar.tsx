import React, { useEffect } from 'react';
import { Dimensions, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { useSidebarStore } from '../store/sidebarStore';
import PreferencesScreen from '../screens/PreferencesScreen';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SIDEBAR_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 320);

export default function Sidebar() {
  const isOpen = useSidebarStore((state) => state.isOpen);
  const close = useSidebarStore((state) => state.close);

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(isOpen ? 1 : 0, {
      duration: 280,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [isOpen]);

  const sidebarStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(progress.value, [0, 1], [-SIDEBAR_WIDTH, 0]),
      },
    ],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 0.5]),
    pointerEvents: isOpen ? ('auto' as const) : ('none' as const),
  }));

  return (
    <>
      {/* Dark overlay behind the sidebar */}
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>

      {/* Sidebar panel */}
      <Animated.View style={[styles.sidebar, { width: SIDEBAR_WIDTH }, sidebarStyle]}>
        <PreferencesScreen />
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 40,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 50,
    backgroundColor: '#020617', // slate-950
    borderRightWidth: 1,
    borderRightColor: '#1e293b', // slate-800
  },
});
