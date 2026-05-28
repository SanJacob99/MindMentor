import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { api } from '../api/client';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import MindMentorLogo from '../../assets/MindMentorLogo.svg';
import { Mail, Lock, Eye, EyeOff, X } from 'lucide-react-native';

type SignInScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SignIn'>;

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<'email' | 'password' | null>(null);
  const setToken = useAuthStore((state) => state.setToken);
  const navigation = useNavigation<SignInScreenNavigationProp>();
  const passwordRef = useRef<TextInput>(null);

  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const data = await api.post('/auth/login', { email, password });
      await setToken(data.accessToken);
    } catch (error) {
      Alert.alert('Login Failed', error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{flexGrow: 1, justifyContent: 'center', padding: 24}}
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center mb-8">
            <MindMentorLogo width={80} height={80} />
            <Text className="text-white text-3xl font-bold mt-4">MindMentor</Text>
            <Text className="text-white text-2xl font-semibold mt-2">Welcome back</Text>
            <Text className="text-slate-400 text-center mt-2">
              Sign in to continue your journey towards clarity and calm.
            </Text>
          </View>

          <View>
            <Text className="text-slate-300 font-bold mb-2">Email Address</Text>
            <View
              className={`flex-row items-center bg-slate-800 rounded-lg border px-4 py-3 mb-4 ${focusedInput === 'email' ? 'border-blue-500' : 'border-slate-700'}`}
              style={Platform.OS === 'web' && focusedInput === 'email' ? { boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)' } as any : undefined}
            >
              <Mail color={focusedInput === 'email' ? '#3b82f6' : '#94a3b8'} size={20} />
              <TextInput
                className="flex-1 text-white ml-3"
                style={Platform.OS === 'web' ? { outlineStyle: 'none' } as any : undefined}
                placeholder="you@example.com"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                autoCorrect={false}
                accessibilityLabel="Email Address"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
              />
              {email.length > 0 && (
                <TouchableOpacity
                  onPress={() => setEmail('')}
                  accessibilityRole="button"
                  accessibilityLabel="Clear email"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X color="#94a3b8" size={20} />
                </TouchableOpacity>
              )}
            </View>

            <Text className="text-slate-300 font-bold mb-2">Password</Text>
            <View
              className={`flex-row items-center bg-slate-800 rounded-lg border px-4 py-3 mb-2 ${focusedInput === 'password' ? 'border-blue-500' : 'border-slate-700'}`}
              style={Platform.OS === 'web' && focusedInput === 'password' ? { boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)' } as any : undefined}
            >
              <Lock color={focusedInput === 'password' ? '#3b82f6' : '#94a3b8'} size={20} />
              <TextInput
                ref={passwordRef}
                className="flex-1 text-white ml-3"
                style={Platform.OS === 'web' ? { outlineStyle: 'none' } as any : undefined}
                placeholder="••••••••"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                textContentType="password"
                autoCorrect={false}
                accessibilityLabel="Password"
                returnKeyType="go"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showPassword ? (
                  <EyeOff color="#94a3b8" size={20} />
                ) : (
                  <Eye color="#94a3b8" size={20} />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              className="self-end mb-6"
              onPress={() => Alert.alert('Forgot Password', 'Not implemented')}
              accessibilityRole="button"
              accessibilityLabel="Forgot Password"
              accessibilityHint="Navigates to password recovery"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text className="text-blue-500 font-semibold">Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`bg-blue-500 rounded-lg py-4 items-center mb-6 ${loading ? 'opacity-70' : ''}`}
              onPress={handleLogin}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Sign In"
              accessibilityState={{ disabled: loading }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row justify-center p-2"
              onPress={() => navigation.navigate('SignUp')}
              accessibilityRole="link"
              accessibilityLabel="Don't have an account? Sign Up"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text className="text-slate-400">Don't have an account? </Text>
              <Text className="text-blue-500 font-bold">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
