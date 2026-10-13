// src/app/(tabs)/lostfound.tsx
import { useFocusEffect, useRouter } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
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

const STATUS_COLORS: Record<string, string> = {
  lost: "#dc2626",
  found: "#16a34a",
  resolved: "#666"
};

export default function LostFoundScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const q = query(
        collection(db, "posts"),
        where("communityId", "==", "lostfound")
      );
      const snap = await getDocs(q);
      const rows: any[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rows.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      setPosts(rows);
    } catch (e) {
      console.log("LOAD L&F ERR", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Lost & Found</Text>
          <Text style={styles.subtitle}>Report or reclaim items</Text>
        </View>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => router.push("/create-lostfound")}
        >
          <Text style={styles.newBtnText}>+ Report</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#4f46e5" />
      ) : posts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Nothing here yet</Text>
          <Text style={styles.emptySub}>Lost or found something? Report it.</Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => router.push("/create-lostfound")}
          >
            <Text style={styles.emptyBtnText}>Report item</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/post/${item.id}`)}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.status, { color: STATUS_COLORS[item.itemStatus] || "#dc2626" }]}>
                  {(item.itemStatus || "lost").toUpperCase()}
                </Text>
                {item.location ? (
                  <Text style={styles.location}>📍 {item.location}</Text>
                ) : null}
              </View>
              <Text style={styles.postTitle}>{item.title}</Text>
              {item.body ? <Text style={styles.postBody} numberOfLines={2}>{item.body}</Text> : null}
              <Text style={styles.meta}>by {item.authorName || "Anon"}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 60 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: "bold", color: "#111" },
  subtitle: { fontSize: 13, color: "#666", marginTop: 2 },
  newBtn: { backgroundColor: "#4f46e5", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  newBtnText: { color: "#fff", fontWeight: "600" },
  card: { padding: 16, borderBottomWidth: 1, borderColor: "#eee" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  status: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  location: { fontSize: 12, color: "#666" },
  postTitle: { fontSize: 16, fontWeight: "600", color: "#111" },
  postBody: { fontSize: 14, color: "#555", marginTop: 4 },
  meta: { fontSize: 12, color: "#999", marginTop: 8 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyText: { fontSize: 18, fontWeight: "600", color: "#111" },
  emptySub: { fontSize: 14, color: "#666", marginTop: 6, textAlign: "center" },
  emptyBtn: { backgroundColor: "#4f46e5", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, marginTop: 20 },
  emptyBtnText: { color: "#fff", fontWeight: "600" }
});