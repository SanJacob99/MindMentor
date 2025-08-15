import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
} from "react-native";
import { Calendar } from "react-native-calendars";
import type { DateData } from "react-native-calendars";
import axios from "axios";
import { useAuth } from "../state/AuthContext";

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

const MOOD_COLORS: Record<number, string> = {
  1: "#ef4444",
  2: "#f97316",
  3: "#f59e0b",
  4: "#eab308",
  5: "#84cc16",
  6: "#22c55e",
  7: "#16a34a",
  8: "#10b981",
  9: "#059669",
  10: "#22d3ee", // adjust if you prefer a deeper green
};

type Journal = {
  journal_id: string;
  content: string;
  mood?: number | null;
  created_at: string; // ISO
};

function startOfMonth(year: number, m1: number) {
  return new Date(year, m1 - 1, 1);
}
function endOfMonth(year: number, m1: number) {
  return new Date(year, m1, 0, 23, 59, 59, 999);
}
function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function MoodCalendarScreen() {
  const { token } = useAuth();

  // safe, stable headers
  const headers = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : undefined),
    [token]
  );

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1..12
  const [loading, setLoading] = useState(false);
  const [journals, setJournals] = useState<Journal[]>([]);

  const currentMonthStr = `${year}-${String(month).padStart(2, "0")}`;

  // Load once on mount (fetch all + filter client-side)
  // If you want per-month fetch, see commented block below.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const r = await axios.get(`${API_BASE}/journals`, { headers });
        if (!cancelled) setJournals(r.data ?? []);
      } catch (e: any) {
        const msg = e?.response?.data?.detail ?? e?.message ?? "Failed to load";
        if (Platform.OS !== "web") Alert.alert("Calendar", msg);
        else console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
    // 🔑 Depend only on things that actually change the request
  }, [headers]); // NOT on a changing object/function

  // --- If you prefer per-month fetch (server-side range), use this instead of the effect above:
  // useEffect(() => {
  //   let cancelled = false;
  //   const run = async () => {
  //     setLoading(true);
  //     try {
  //       const from = startOfMonth(year, month).toISOString().slice(0, 10);
  //       const to = endOfMonth(year, month).toISOString().slice(0, 10);
  //       const r = await axios.get(`${API_BASE}/journals`, { headers, params: { from, to } });
  //       if (!cancelled) setJournals(r.data ?? []);
  //     } catch (e: any) {
  //       const msg = e?.response?.data?.detail ?? e?.message ?? "Failed to load";
  //       if (Platform.OS !== "web") Alert.alert("Calendar", msg);
  //       else console.error(e);
  //     } finally {
  //       if (!cancelled) setLoading(false);
  //     }
  //   };
  //   run();
  //   return () => { cancelled = true; };
  // }, [headers, year, month]);

  // Build markedDates for the visible month
  const { markedDates, legend } = useMemo(() => {
    const from = startOfMonth(year, month);
    const to = endOfMonth(year, month);

    const byDay: Record<string, number[]> = {};
    for (const j of journals) {
      if (j.mood == null) continue;
      const d = new Date(j.created_at);
      if (d < from || d > to) continue;
      const key = isoDate(d);
      (byDay[key] ??= []).push(j.mood);
    }

    const marks: Record<string, any> = {};
    Object.entries(byDay).forEach(([day, arr]) => {
      const avg = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
      const n = Math.min(10, Math.max(1, avg));
      const color = MOOD_COLORS[n] || "#e5e7eb";
      marks[day] = {
        customStyles: {
          container: { backgroundColor: color, borderRadius: 8 },
          text: { color: "#fff", fontWeight: "700" },
        },
      };
    });

    const lg = Array.from({ length: 10 }, (_, i) => ({
      n: i + 1,
      c: MOOD_COLORS[i + 1],
    }));

    return { markedDates: marks, legend: lg };
  }, [journals, year, month]);

  const onMonthChange = (m: DateData) => {
    // This only updates local state; it won’t retrigger the fetch unless you use the per-month effect.
    if (m.year !== year) setYear(m.year);
    if (m.month !== month) setMonth(m.month);
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <View style={styles.centerWrapper}>
          <Text style={styles.title}>Mood Calendar</Text>

          <Calendar
            current={`${currentMonthStr}-01`}
            onMonthChange={onMonthChange}
            markingType="custom"
            markedDates={markedDates}
            theme={{
              calendarBackground: "#ffffff",
              textSectionTitleColor: "#374151",
              dayTextColor: "#111827",
              monthTextColor: "#111827",
              textMonthFontWeight: "700",
              arrowColor: "#111827",
              todayTextColor: "#2563eb",
            }}
            style={{
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#e5e7eb",
              width: 350, // ancho fijo para mejor centrado
            }}
            hideExtraDays={false}
            firstDay={1}
          />

          <View style={styles.legendRow}>
            {legend.map((l) => (
              <View key={l.n} style={styles.legendItem}>
                <View style={[styles.legendSwatch, { backgroundColor: l.c }]} />
                <Text style={styles.legendText}>{l.n}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.hint}>
            Cada día se pinta por el promedio de “mood” de las entradas de ese
            día.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f7fb",
  },
  centerWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    justifyContent: "center",
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendSwatch: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  legendText: { color: "#374151" },
  hint: { marginTop: 10, color: "#6b7280", textAlign: "center" },
});
