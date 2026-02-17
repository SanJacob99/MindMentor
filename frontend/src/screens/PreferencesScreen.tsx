import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { User, Bell, Clock, Moon, Info, LogOut, ChevronRight, X } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { useUser } from '../hooks/useUser';
import { useSidebarStore } from '../store/sidebarStore';

interface SettingsRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
}

function SettingsRow({ icon, label, value, onPress }: SettingsRowProps) {
  const content = (
    <>
      <View className="w-9 h-9 rounded-lg bg-slate-800 items-center justify-center mr-3">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-white text-base">{label}</Text>
        {value && <Text className="text-slate-400 text-sm mt-0.5">{value}</Text>}
      </View>
      {onPress && <ChevronRight size={18} color="#64748b" />}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        className="flex-row items-center py-4 border-b border-slate-800"
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={value ? `${label}, ${value}` : label}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View
      className="flex-row items-center py-4 border-b border-slate-800"
      accessible={true}
      accessibilityLabel={value ? `${label}, ${value}` : label}
    >
      {content}
    </View>
  );
}

export default function PreferencesScreen() {
  const logout = useAuthStore((state) => state.logout);
  const close = useSidebarStore((state) => state.close);
  const { data: user } = useUser();

  const getInitials = () => {
    if (!user?.email) return 'JD';
    const parts = user.email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.email.substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    close();
    logout();
  };

  return (
    <View className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
        <Text className="text-white text-lg font-bold">Settings</Text>
        <TouchableOpacity
          onPress={close}
          className="p-1"
          accessibilityRole="button"
          accessibilityLabel="Close settings"
        >
          <X size={22} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View
          className="items-center py-6 border-b border-slate-800 mb-2"
          accessible={true}
          accessibilityLabel={`Signed in as ${user?.email ?? 'User'}`}
        >
          <View className="bg-blue-900 w-16 h-16 rounded-full justify-center items-center mb-3">
            <Text className="text-blue-300 text-xl font-bold">{getInitials()}</Text>
          </View>
          <Text className="text-white text-base font-semibold">{user?.email ?? 'User'}</Text>
        </View>

        {/* Preferences */}
        <Text className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-4 mb-1">
          Preferences
        </Text>
        <SettingsRow
          icon={<Bell size={18} color="#3b82f6" />}
          label="Notifications"
          value="Enabled"
        />
        <SettingsRow
          icon={<Clock size={18} color="#3b82f6" />}
          label="Reminder Time"
          value={user?.preferences?.reminderTime ?? 'Not set'}
        />
        <SettingsRow
          icon={<Moon size={18} color="#3b82f6" />}
          label="Appearance"
          value="Dark"
        />

        {/* Account */}
        <Text className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-6 mb-1">
          Account
        </Text>
        <SettingsRow
          icon={<User size={18} color="#3b82f6" />}
          label="Profile"
          value={user?.email}
        />
        <SettingsRow
          icon={<Info size={18} color="#3b82f6" />}
          label="About MindMentor"
          value="v1.0.0"
        />

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center py-4 mt-4 mb-8"
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Log Out"
        >
          <View className="w-9 h-9 rounded-lg bg-red-900/30 items-center justify-center mr-3">
            <LogOut size={18} color="#ef4444" />
          </View>
          <Text className="text-red-400 text-base font-medium">Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
