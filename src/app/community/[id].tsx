// src/app/community/[id].tsx
import { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert
} from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect, Stack } from "expo-router";
import {
  collection, query, where, getDocs, doc, getDoc, updateDoc,
  arrayUnion, arrayRemove
} from "firebase/firestore";
import { auth, db } from "../../../firebase/config";

export default function CommunityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [community, setCommunity] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!id) return;
    try {
      const cSnap = await getDoc(doc(db, "communities", id));
      if (cSnap.exists()) setCommunity({ id: cSnap.id, ...cSnap.data() });

      const q = query(collection(db, "posts"), where("communityId", "==", id));
      const snap = await getDocs(q);
      const rows: any[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rows.sort((a, b) => {
        const at = a.createdAt?.seconds ?? 0;
        const bt = b.createdAt?.seconds ?? 0;
        return bt - at;
      });
      setPosts(rows);

      // Check membership
      const uid = auth.currentUser?.uid;
      if (uid) {
        const uSnap = await getDoc(doc(db, "users", uid));
        if (uSnap.exists()) {
          const joinedList: string[] = uSnap.data().joinedCommunities || [];
          setJoined(joinedList.includes(id));
        }
      }
    } catch (e) {
      console.log("LOAD COMMUNITY ERR", e);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(useCallback(() => { load(); }, [id]));

  async function toggleJoin() {
    const uid = auth.currentUser?.uid;
    if (!uid || !id) return;
    try {
      const ref = doc(db, "users", uid);
      if (joined) {
        await updateDoc(ref, { joinedCommunities: arrayRemove(id) });
        setJoined(false);
      } else {
        await updateDoc(ref, { joinedCommunities: arrayUnion(id) });
        setJoined(true);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#4f46e5" size="large" /></View>;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: community?.name || "Community" }} />

      {community?.description ? (
        <Text style={styles.desc}>{community.description}</Text>
      ) : null}

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.joinBtn, joined && styles.joinBtnActive]}
          onPress={toggleJoin}
        >
          <Text style={[styles.joinText, joined && styles.joinTextActive]}>
            {joined ? "✓ Joined" : "+ Join"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => router.push({
            pathname: "/create-post",
            params: { communityId: id, communityName: community?.name }
          })}
        >
          <Text style={styles.newBtnText}>+ New post</Text>
        </TouchableOpacity>
      </View>

      {posts.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ color: "#666" }}>No posts in this space yet.</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/post/${item.id}`)}
            >
              <Text style={styles.postTitle}>{item.title}</Text>
              {item.body ? <Text style={styles.postBody} numberOfLines={2}>{item.body}</Text> : null}
              <Text style={styles.meta}>
                {item.authorName || "Anon"} · {item.upvotes || 0} upvotes
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  desc: { paddingHorizontal: 16, paddingTop: 12, color: "#666", fontSize: 13 },
  actionsRow: { flexDirection: "row", padding: 16, gap: 10 },
  joinBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: "#4f46e5" },
  joinBtnActive: { backgroundColor: "#4f46e5" },
  joinText: { color: "#4f46e5", fontWeight: "600" },
  joinTextActive: { color: "#fff", fontWeight: "600" },
  newBtn: { backgroundColor: "#4f46e5", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, flex: 1, alignItems: "center" },
  newBtnText: { color: "#fff", fontWeight: "600" },
  card: { padding: 16, borderBottomWidth: 1, borderColor: "#eee" },
  postTitle: { fontSize: 16, fontWeight: "600", color: "#111" },
  postBody: { fontSize: 14, color: "#555", marginTop: 4 },
  meta: { fontSize: 12, color: "#999", marginTop: 8 }
});