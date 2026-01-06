import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, Text } from 'react-native';
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
      <Stack.Navigator 
        id={undefined} 
        initialRouteName={token ? 'Home' : 'SignIn'}
        detachInactiveScreens={false}
      >
        {token ? (
          <>
             <Stack.Screen name="Home" component={HomeScreen} /> 
             <Stack.Screen name="Insights" component={InsightsScreen} /> 
             <Stack.Screen name="History" component={HistoryScreen} /> 
             <Stack.Screen name="Onboarding" component={OnboardingScreen} /> 
          </>
        ) : (
          <>
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
