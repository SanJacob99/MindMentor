import { useState, useMemo, useCallback } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import axios from "axios";
import { useAuth } from "../state/AuthContext";

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export default function HealthScreen() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<any>(null);
  const [status, setStatus] = useState<string>("—");
  const url = useMemo(() => `${API_BASE}/health`, []);

  const check = useCallback(async () => {
    setLoading(true);
    try {
      const r = await axios.get(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setPayload(r.data);
      setStatus(`OK (${r.status})`);
    } catch (e: any) {
      setPayload(null);
      setStatus(`ERR (${e?.response?.status ?? "?"})`);
    } finally {
      setLoading(false);
    }
  }, [token, url]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#f6f7fb",
        padding: 16,
        paddingTop: 16,
        gap: 12,
      }}
    >
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Server Health</Text>
      <Text>Endpoint: {url}</Text>
      <Text>Status: {status}</Text>
      <Pressable
        onPress={check}
        disabled={loading}
        style={{
          backgroundColor: "#111827",
          paddingVertical: 12,
          borderRadius: 8,
          alignItems: "center",
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: "#fff" }}>Check now</Text>
        )}
      </Pressable>
      {payload && (
        <Text style={{ fontFamily: "monospace" }}>
          {JSON.stringify(payload, null, 2)}
        </Text>
      )}
    </View>
  );
}
