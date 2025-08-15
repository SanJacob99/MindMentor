import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  RefreshControl, // ⬅️ add this
} from "react-native";
import axios from "axios";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useAuth } from "../state/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

type Journal = {
  journal_id: string;
  content: string;
  mood?: number | null;
  created_at: string;
  tags?: string[];
};

export default function JournalsScreen() {
  const { token, logout } = useAuth();
  const [items, setItems] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string>("");
  const tabBarHeight = useBottomTabBarHeight();

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // 5, 10, 20...

  // Derived pagination
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const start = (page - 1) * pageSize;
  const visible = useMemo(
    () => items.slice(start, start + pageSize),
    [items, start, pageSize]
  );

  // Clamp page when items or pageSize change
  useEffect(() => {
    const max = Math.max(1, Math.ceil(items.length / pageSize));
    if (page > max) setPage(max);
  }, [items.length, page, pageSize]);

  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const load = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API_BASE}/journals`, { headers });
      setItems(r.data ?? []);
    } catch (e: any) {
      const msg = e?.response?.data?.detail ?? e?.message ?? "Failed to load";
      if (Platform.OS !== "web") Alert.alert("Journals", msg);
      else console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!content.trim()) return;
    setCreating(true);
    try {
      const body = {
        content,
        mood: mood ? Number(mood) : undefined,
        tags: [] as string[],
      };
      await axios.post(`${API_BASE}/journals`, body, { headers });
      setContent("");
      setMood("");
      setPage(1); // go back to first page so new item is visible if API returns newest first
      await load();
    } catch (e: any) {
      const msg = e?.response?.data?.detail ?? e?.message ?? "Failed to create";
      if (Platform.OS !== "web") Alert.alert("Create Journal", msg);
      else console.error(e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: "#f6f7fb" }}
        contentContainerStyle={{
          padding: 16,
          paddingTop: 16,
          paddingBottom: tabBarHeight + 16,
        }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} />
        }
      >
        {/* Create */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 10,
            padding: 12,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            marginBottom: 12,
            gap: 8,
          }}
        >
          <Text>New entry</Text>

          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="How are you feeling today?"
            multiline
            style={{
              backgroundColor: "#fafafa",
              borderRadius: 8,
              padding: 10,
              minHeight: 60,
              borderWidth: 1,
              borderColor: "#eee",
            }}
          />

          {/* Mood picker (centered, single row wrapping if needed) */}
          <View style={{ marginVertical: 10, alignItems: "center" }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {Array.from({ length: 10 }, (_, i) => {
                const num = i + 1;
                const faces = [
                  "😢",
                  "😟",
                  "🙁",
                  "😕",
                  "😐",
                  "🙂",
                  "😊",
                  "😃",
                  "😄",
                  "😁",
                ];
                const isSelected = String(num) === mood;

                return (
                  <Pressable
                    key={num}
                    onPress={() => setMood(String(num))}
                    style={{
                      backgroundColor: isSelected ? "#111827" : "#fafafa",
                      borderRadius: 8,
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderWidth: 1,
                      borderColor: isSelected ? "#111827" : "#eee",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 50,
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>{faces[i]}</Text>
                    <Text style={{ color: isSelected ? "#fff" : "#000" }}>
                      {num}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Pressable
            onPress={create}
            disabled={creating}
            style={{
              backgroundColor: creating ? "#94a3b8" : "#111827",
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: "center",
            }}
          >
            {creating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "600" }}>Save</Text>
            )}
          </Pressable>
        </View>

        {/* Pagination controls (top) */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <Pressable
            onPress={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              opacity: page === 1 ? 0.5 : 1,
              backgroundColor: "#111827",
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#fff" }}>Prev</Text>
          </Pressable>

          <Text style={{ fontWeight: "600" }}>
            Page {page} / {totalPages}
          </Text>

          <Pressable
            onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              opacity: page === totalPages ? 0.5 : 1,
              backgroundColor: "#111827",
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#fff" }}>Next</Text>
          </Pressable>
        </View>

        {/* Page size selector */}
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            marginBottom: 8,
            flexWrap: "wrap",
          }}
        >
          {/* {[5, 10, 20].map((sz) => {
          const selected = pageSize === sz;
          return (
            <Pressable
              key={sz}
              onPress={() => {
                setPageSize(sz);
                setPage(1);
              }}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: selected ? "#111827" : "#e5e7eb",
                backgroundColor: selected ? "#111827" : "#fff",
              }}
            >
              <Text style={{ color: selected ? "#fff" : "#111827" }}>
                {sz} / page
              </Text>
            </Pressable>
          );
        })} */}
        </View>

        {/* Visible items (scrolls with the whole screen) */}
        {loading && items.length === 0 ? (
          <ActivityIndicator />
        ) : visible.length === 0 ? (
          <Text style={{ color: "#6b7280" }}>No entries yet.</Text>
        ) : (
          visible.map((item) => (
            <View
              key={item.journal_id}
              style={{
                backgroundColor: "#fff",
                borderRadius: 10,
                padding: 12,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                marginBottom: 10,
              }}
            >
              <Text style={{ fontWeight: "600" }}>
                {new Date(item.created_at).toLocaleString()}
              </Text>
              {item.mood != null && <Text>Mood: {item.mood}</Text>}
              <Text style={{ marginTop: 6 }}>{item.content}</Text>
            </View>
          ))
        )}

        {/* Pagination controls (bottom) */}
        {visible.length > 0 && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 8,
            }}
          >
            <Pressable
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                opacity: page === 1 ? 0.5 : 1,
                backgroundColor: "#111827",
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#fff" }}>Prev</Text>
            </Pressable>

            <Text style={{ fontWeight: "600" }}>
              Page {page} / {totalPages}
            </Text>

            <Pressable
              onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                opacity: page === totalPages ? 0.5 : 1,
                backgroundColor: "#111827",
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#fff" }}>Next</Text>
            </Pressable>
          </View>
        )}

        {/* Logout */}
        <Pressable
          onPress={logout}
          style={{
            marginTop: 12,
            padding: 12,
            backgroundColor: "#ef4444",
            borderRadius: 8,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Logout</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
