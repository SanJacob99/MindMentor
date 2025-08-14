import { useState } from "react";
import { View, Text, TextInput, Button } from "react-native";
import { api } from "../../src/lib/api";
import { useAuth } from "../../src/store/auth";

export default function Login() {
  const setToken = useAuth((s) => s.setToken);
  const [email, setEmail] = useState("alice@example.com");
  const [password, setPassword] = useState("password123");
  const [msg, setMsg] = useState<string | null>(null);

  const onLogin = async () => {
    try {
      const r = await api.post("/auth/login", { email, password });
      setToken(r.data.access_token);
      setMsg("Logged in!");
    } catch (e: any) {
      setMsg(e?.response?.data?.detail || "Login failed");
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ color: "#e5e7eb", fontSize: 20, fontWeight: "600" }}>
        Login
      </Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="email"
        autoCapitalize="none"
        style={{ backgroundColor: "#fff", padding: 10, borderRadius: 8 }}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="password"
        secureTextEntry
        style={{ backgroundColor: "#fff", padding: 10, borderRadius: 8 }}
      />
      <Button title="Sign in" onPress={onLogin} />
      {msg && <Text style={{ color: "#9ca3af" }}>{msg}</Text>}
    </View>
  );
}
