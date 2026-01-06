import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../store/authStore';

// Screens (Placeholders/Imports) - We will create these next
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import InsightsScreen from '../screens/InsightsScreen';
import HistoryScreen from '../screens/HistoryScreen';

export type RootStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  Onboarding: undefined;
  Home: undefined;
  Insights: undefined;
  History: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { token, isLoading, loadToken } = useAuthStore();

  useEffect(() => {
    loadToken();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Insights" component={InsightsScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
            {/* Onboarding might be needed if user has token but hasn't finished onboarding. 
                For MVP, we assume Onboarding flows from Signup only, or we add a check. 
                We add it here to be accessible just in case or assume completed if token exists? 
                Better: Setup 'Onboarding' as a screen available if token exists but param 'onboardingCompleted' is false. 
                For now, we place it in Auth flow or part of main stack.
             */}
             <Stack.Screen name="Onboarding" component={OnboardingScreen} /> 
          </>
        ) : (
          <>
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            {/* Onboarding is usually after SignUp. So we enable it here or allow explicit nav. */}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
