import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { api } from "../../src/lib/api";

export default function Health() {
  const [ok, setOk] = useState<boolean | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get("/health/db");
        console.log(r.data);
        setOk(!!r.data?.ok);
      } catch (e: any) {
        setErr(e.message ?? "Request failed");
        setOk(false);
      }
    })();
  }, []);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ color: "#e5e7eb", fontSize: 20, fontWeight: "600" }}>
        Database Health
      </Text>
      {ok === null && !err && <ActivityIndicator />}
      {ok === true && <Text style={{ color: "#86efac" }}>✅ OK</Text>}
      {ok === false && <Text style={{ color: "#fda4af" }}>❌ Not OK</Text>}
      {err && <Text style={{ color: "#fda4af" }}>{err}</Text>}
    </View>
  );
}
