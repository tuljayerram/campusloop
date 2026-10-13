// src/app/(tabs)/home.tsx
import { useFocusEffect, useRouter } from "expo-router";
import {
  collection,
  doc, getDoc,
  getDocs,
  limit,
  orderBy,
  query
} from "firebase/firestore";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { auth, db } from "../../../firebase/config";

export default function HomeScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [me, setMe] = useState<any>(null);

  async function load() {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // 1. Load my profile (for avatar + joined communities)
      const uSnap = await getDoc(doc(db, "users", user.uid));
      const me: any = uSnap.exists() ? uSnap.data() : {};
      setMe(me);
      const joined: string[] = me.joinedCommunities || [];

      // 2. Load recent posts
      const q = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc"),
        limit(100)
      );
      const snap = await getDocs(q);
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 3. Filter: general + lostfound + market are public; others need membership
      const filtered = all.filter((p: any) => {
        if (p.communityId === "general") return true;
        if (p.communityType === "lostfound") return true;
        if (p.communityType === "market") return true;
        return joined.includes(p.communityId);
      });

      setPosts(filtered);
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
        <TouchableOpacity onPress={() => router.push("/profile")}>
          {me?.avatarUrl ? (
            <Image source={{ uri: me.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: "#eee" }]} />
          )}
        </TouchableOpacity>

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
          <Text style={styles.emptySub}>
            Join some spaces or post to General to see things here.
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => router.push("/(tabs)/communities")}
          >
            <Text style={styles.emptyBtnText}>Browse spaces</Text>
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
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#f0f0f0" },
  title: { fontSize: 20, fontWeight: "bold", color: "#4f46e5" },
  newBtn: { backgroundColor: "#4f46e5", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  newBtnText: { color: "#fff", fontWeight: "600" },
  card: { padding: 16, borderBottomWidth: 1, borderColor: "#eee" },
  communityTag: { color: "#4f46e5", fontSize: 12, fontWeight: "600", marginBottom: 4 },
  postTitle: { fontSize: 17, fontWeight: "600", color: "#111" },
  postBody: { fontSize: 14, color: "#555", marginTop: 4 },
  meta: { fontSize: 12, color: "#999", marginTop: 8 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyText: { fontSize: 18, fontWeight: "600", color: "#111" },
  emptySub: { fontSize: 14, color: "#666", marginTop: 6, textAlign: "center" },
  emptyBtn: { backgroundColor: "#4f46e5", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, marginTop: 20 },
  emptyBtnText: { color: "#fff", fontWeight: "600" }
});