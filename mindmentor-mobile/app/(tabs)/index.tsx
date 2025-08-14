import { useEffect, useState } from "react";
import { View, Text, Button, TextInput, FlatList } from "react-native";
import { api } from "../../src/lib/api";
import { useAuth } from "../../src/store/auth";

export default function Home() {
  const token = useAuth((s) => s.token);
  const [content, setContent] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    if (!token) {
      setMsg("Log in first");
      return;
    }
    const r = await api.get("/journals");
    setItems(r.data);
  };

  const create = async () => {
    if (!token) {
      setMsg("Log in first");
      return;
    }
    await api.post("/journals", { content, mood: 7, tags: ["daily"] });
    setContent("");
    await load();
  };

  useEffect(() => {
    load();
  }, [token]);

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ color: "#e5e7eb", fontSize: 20, fontWeight: "600" }}>
        Journals
      </Text>
      <TextInput
        value={content}
        onChangeText={setContent}
        placeholder="Write something…"
        style={{ backgroundColor: "#fff", padding: 10, borderRadius: 8 }}
      />
      <Button title="Save entry" onPress={create} />
      {msg && <Text style={{ color: "#9ca3af" }}>{msg}</Text>}
      <FlatList
        data={items}
        keyExtractor={(i) => i.journal_id}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: "#0f172a",
              padding: 10,
              borderRadius: 10,
              marginTop: 8,
            }}
          >
            <Text style={{ color: "#e5e7eb" }}>{item.content}</Text>
            <Text style={{ color: "#94a3b8" }}>mood: {item.mood ?? "-"}</Text>
          </View>
        )}
      />
    </View>
  );
}
