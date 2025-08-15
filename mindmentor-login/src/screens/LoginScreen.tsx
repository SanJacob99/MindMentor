import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import axios from "axios";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../state/AuthContext";

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

type RootStackParamList = {
  Login: undefined;
  AppTabs: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState("alice@example.com");
  const [password, setPassword] = useState("Password123!");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onLogin = async () => {
    setMsg(null);
    setLoading(true);
    try {
      const r = await axios.post(`${API_BASE}/auth/login`, { email, password });
      const t = r.data?.access_token;
      if (!t) throw new Error("No access_token in response");
      await login(t);
      navigation.replace("AppTabs");
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      const text = detail ? `Error: ${detail}` : "Login failed";
      setMsg(text);
      if (Platform.OS !== "web") Alert.alert("Login", text);
      else console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#f6f7fb",
        padding: 20,
        paddingTop: 60,
        gap: 16,
      }}
    >
      <Text style={{ fontSize: 28, fontWeight: "700" }}>
        MindMentor — Login
      </Text>

      <View style={{ gap: 8 }}>
        <Text>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
          style={{
            backgroundColor: "#fff",
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderWidth: 1,
            borderColor: "#e5e7eb",
          }}
        />
      </View>

      <View style={{ gap: 8 }}>
        <Text>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          style={{
            backgroundColor: "#fff",
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderWidth: 1,
            borderColor: "#e5e7eb",
          }}
        />
      </View>

      <Pressable
        onPress={onLogin}
        disabled={loading}
        style={{
          backgroundColor: loading ? "#94a3b8" : "#111827",
          paddingVertical: 14,
          borderRadius: 10,
          alignItems: "center",
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: "#fff", fontWeight: "600" }}>Sign in</Text>
        )}
      </Pressable>

      {msg && <Text style={{ color: "#374151" }}>{msg}</Text>}
    </View>
  );
}
