// src/app/(tabs)/communities.tsx
import { useFocusEffect, useRouter } from "expo-router";
import { collection, getDocs, query } from "firebase/firestore";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { db } from "../../../firebase/config";

const TYPE_EMOJI: Record<string, string> = {
  year: "📅",
  department: "🏛️",
  class: "📚",
  canteen: "🍔",
  transport: "🚌",
  general: "💬"
};

export default function CommunitiesScreen() {
  const router = useRouter();
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const q = query(collection(db, "communities"));
      const snap = await getDocs(q);
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      const filtered = rows.filter((c: any) =>
        c.id !== "lostfound" && c.id !== "market"
      );

      filtered.sort((a: any, b: any) =>
        (a.name || a.id).localeCompare(b.name || b.id)
      );

      setCommunities(filtered);
    } catch (e) {
      console.log("LOAD COMMUNITIES ERR", e);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#4f46e5" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Spaces</Text>
      <Text style={styles.subtitle}>Join your communities</Text>

      <FlatList
        data={communities}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/community/${item.id}`)}
          >
            <Text style={styles.emoji}>{TYPE_EMOJI[item.type] || "💬"}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name || item.id}</Text>
              {item.description ? (
                <Text style={styles.desc} numberOfLines={1}>{item.description}</Text>
              ) : null}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 60, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 28, fontWeight: "bold", color: "#111" },
  subtitle: { fontSize: 14, color: "#666", marginTop: 4, marginBottom: 20 },
  card: { flexDirection: "row", alignItems: "center", padding: 16, borderWidth: 1, borderColor: "#eee", borderRadius: 12, marginBottom: 12, backgroundColor: "#fafafa" },
  emoji: { fontSize: 28, marginRight: 14 },
  name: { fontSize: 16, fontWeight: "600", color: "#111" },
  desc: { fontSize: 13, color: "#666", marginTop: 2 }
});