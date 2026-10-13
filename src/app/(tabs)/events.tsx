// src/app/(tabs)/events.tsx
import { useFocusEffect, useRouter } from "expo-router";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { db } from "../../../firebase/config";

function formatDate(ts: any) {
  if (!ts?.seconds) return "Date TBD";
  const d = new Date(ts.seconds * 1000);
  return d.toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit"
  });
}

export default function EventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const q = query(collection(db, "events"), orderBy("dateTime", "asc"));
      const snap = await getDocs(q);
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.log("LOAD EVENTS ERR", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#4f46e5" size="large" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Events</Text>
          <Text style={styles.subtitle}>What's happening on campus</Text>
        </View>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => router.push("/create-event")}
        >
          <Text style={styles.newBtnText}>+ Event</Text>
        </TouchableOpacity>
      </View>

      {events.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No events yet</Text>
          <Text style={styles.emptySub}>Be the first to post one.</Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => router.push("/create-event")}
          >
            <Text style={styles.emptyBtnText}>Create event</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
          }
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/event/${item.id}`)}
            >
              <View style={styles.dateBadge}>
                <Text style={styles.dateBadgeDay}>
                  {item.dateTime?.seconds ? new Date(item.dateTime.seconds * 1000).getDate() : "?"}
                </Text>
                <Text style={styles.dateBadgeMonth}>
                  {item.dateTime?.seconds
                    ? new Date(item.dateTime.seconds * 1000).toLocaleString("en-IN", { month: "short" }).toUpperCase()
                    : "—"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                {item.venue ? (
                  <Text style={styles.eventMeta}>📍 {item.venue}</Text>
                ) : null}
                <Text style={styles.eventMeta}>{formatDate(item.dateTime)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 60 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: "bold", color: "#111" },
  subtitle: { fontSize: 14, color: "#666", marginTop: 2 },
  newBtn: { backgroundColor: "#4f46e5", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  newBtnText: { color: "#fff", fontWeight: "600" },
  card: { flexDirection: "row", padding: 16, borderBottomWidth: 1, borderColor: "#eee", alignItems: "center" },
  dateBadge: { width: 56, height: 56, borderRadius: 12, backgroundColor: "#eef2ff", justifyContent: "center", alignItems: "center", marginRight: 14 },
  dateBadgeDay: { fontSize: 20, fontWeight: "bold", color: "#4f46e5" },
  dateBadgeMonth: { fontSize: 11, color: "#4f46e5", fontWeight: "600" },
  eventTitle: { fontSize: 16, fontWeight: "600", color: "#111" },
  eventMeta: { fontSize: 13, color: "#666", marginTop: 4 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#111" },
  emptySub: { fontSize: 14, color: "#666", marginTop: 6, textAlign: "center" },
  emptyBtn: { backgroundColor: "#4f46e5", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, marginTop: 20 },
  emptyBtnText: { color: "#fff", fontWeight: "600" }
});