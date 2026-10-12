// src/app/(tabs)/home.tsx
import { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import {
  collection, query, orderBy, limit, getDocs
} from "firebase/firestore";
import { db } from "../../../firebase/config";

export default function HomeScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const q = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      const snap = await getDocs(q);
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.log("LOAD POSTS ERR", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>CampusLoop</Text>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => router.push("/create-post")}
        >
          <Text style={styles.newBtnText}>+ Post</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#4f46e5" />
      ) : posts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No posts yet.</Text>
          <Text style={styles.emptySub}>Be the first to post something!</Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => router.push("/create-post")}
          >
            <Text style={styles.emptyBtnText}>Create post</Text>
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
              <Text style={styles.communityTag}>#{item.communityName || "general"}</Text>
              <Text style={styles.postTitle}>{item.title}</Text>
              {item.body ? <Text style={styles.postBody} numberOfLines={2}>{item.body}</Text> : null}
              <Text style={styles.meta}>
                {item.authorName || "Anonymous"} · {item.upvotes || 0} upvotes
              </Text>
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
  title: { fontSize: 28, fontWeight: "bold", color: "#4f46e5" },
  newBtn: { backgroundColor: "#4f46e5", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  newBtnText: { color: "#fff", fontWeight: "600" },
  card: { padding: 16, borderBottomWidth: 1, borderColor: "#eee" },
  communityTag: { color: "#4f46e5", fontSize: 12, fontWeight: "600", marginBottom: 4 },
  postTitle: { fontSize: 17, fontWeight: "600", color: "#111" },
  postBody: { fontSize: 14, color: "#555", marginTop: 4 },
  meta: { fontSize: 12, color: "#999", marginTop: 8 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyText: { fontSize: 18, fontWeight: "600", color: "#111" },
  emptySub: { fontSize: 14, color: "#666", marginTop: 6 },
  emptyBtn: { backgroundColor: "#4f46e5", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, marginTop: 20 },
  emptyBtnText: { color: "#fff", fontWeight: "600" }
});