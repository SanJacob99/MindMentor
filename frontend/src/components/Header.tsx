import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Menu } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { useUser } from '../hooks/useUser';
import { useSidebarStore } from '../store/sidebarStore';

interface HeaderProps {
    title?: string;
    showDate?: boolean;
    onMenuPress?: () => void;
}

export default function Header({ title = 'Today', showDate = true, onMenuPress }: HeaderProps) {
    const logout = useAuthStore(state => state.logout);
    const { data: user } = useUser();
    const openSidebar = useSidebarStore(state => state.open);

    const handleMenuPress = onMenuPress ?? openSidebar;

    const handleLogoutPress = () => {
        Alert.alert(
            "Log Out",
            "Are you sure you want to log out?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Log Out",
                    onPress: logout,
                    style: "destructive"
                }
            ]
        );
    };

    // Get initials from user email or default to 'JD'
    const getInitials = () => {
        if (!user?.email) return 'JD';
        const parts = user.email.split('@')[0].split('.');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return user.email.substring(0, 2).toUpperCase();
    };

    const formatDate = () => {
        const d = new Date();
        // Format: "Today, Oct 24"
        return `Today, ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    };

    return (
        <View className="flex-row justify-between items-center px-5 pt-4 pb-6">
            <TouchableOpacity
                onPress={handleMenuPress}
                accessibilityRole="button"
                accessibilityLabel="Open menu"
            >
                <Menu color="#fff" size={24} />
            </TouchableOpacity>

            <View className="items-center">
                <Text className="text-white text-2xl font-bold">{title}</Text>
                {showDate && (
                    <Text className="text-blue-500 font-medium">{formatDate()}</Text>
                )}
            </View>

            <TouchableOpacity
                onPress={handleLogoutPress}
                className="bg-blue-900 w-10 h-10 rounded-full justify-center items-center"
                accessibilityRole="button"
                accessibilityLabel={`Signed in as ${user?.email || 'User'}. Double tap to log out.`}
                accessibilityHint="Logs you out of the application"
            >
                <Text className="text-blue-300 font-bold">{getInitials()}</Text>
            </TouchableOpacity>
        </View>
    );
}
