// src/app/post/[id].tsx
import { useEffect, useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Alert
} from "react-native";
import { useLocalSearchParams, useFocusEffect, useRouter, Stack } from "expo-router";
import {
  doc, getDoc, collection, addDoc, query, orderBy, getDocs,
  updateDoc, increment, arrayUnion, arrayRemove, serverTimestamp, deleteDoc
} from "firebase/firestore";
import { auth, db } from "../../../firebase/config";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);

  async function load() {
    if (!id) return;
    try {
      const pSnap = await getDoc(doc(db, "posts", id));
      if (pSnap.exists()) {
        const data: any = pSnap.data();
        setPost({ id: pSnap.id, ...data });

        const uid = auth.currentUser?.uid;
        const voters: string[] = data.votedBy || [];
        setHasVoted(uid ? voters.includes(uid) : false);
        setIsAuthor(uid === data.authorId);
      }

      const q = query(
        collection(db, "posts", id, "comments"),
        orderBy("createdAt", "asc")
      );
      const snap = await getDocs(q);
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.log("LOAD POST ERR", e);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(useCallback(() => { load(); }, [id]));

  async function upvote() {
    if (!id) return;
    const user = auth.currentUser;
    if (!user) return;

    try {
      const ref = doc(db, "posts", id);
      if (hasVoted) {
        await updateDoc(ref, {
          votedBy: arrayRemove(user.uid),
          upvotes: increment(-1)
        });
      } else {
        await updateDoc(ref, {
          votedBy: arrayUnion(user.uid),
          upvotes: increment(1)
        });
      }
      load();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  }

  async function sendComment() {
    if (comment.trim().length < 1) return;
    const user = auth.currentUser;
    if (!user) return;
    setSending(true);
    try {
      const uSnap = await getDoc(doc(db, "users", user.uid));
      const authorName = uSnap.exists() ? uSnap.data().name : "Anon";
      await addDoc(collection(db, "posts", id!, "comments"), {
        authorId: user.uid,
        authorName,
        body: comment.trim(),
        createdAt: serverTimestamp()
      });
      setComment("");
      load();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSending(false);
    }
  }

  function handleDelete() {
    Alert.alert("Delete post?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "posts", id!));
            router.back();
          } catch (e: any) {
            Alert.alert("Error", e.message);
          }
        }
      }
    ]);
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#4f46e5" size="large" /></View>;
  }
  if (!post) {
    return <View style={styles.center}><Text>Post not found.</Text></View>;
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen options={{ headerShown: true, title: post.communityName || "Post" }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.tag}>#{post.communityName}</Text>
        <Text style={styles.title}>{post.title}</Text>
        <Text style={styles.meta}>by {post.authorName}</Text>
        {post.body ? <Text style={styles.body}>{post.body}</Text> : null}

        {post.communityType === "lostfound" && (
          <View style={styles.specialBox}>
            <View style={styles.specialRow}>
              <Text style={styles.specialKey}>Status</Text>
              <Text style={[styles.specialVal, { color: post.itemStatus === "resolved" ? "#16a34a" : "#dc2626" }]}>
                {(post.itemStatus || "lost").toUpperCase()}
              </Text>
            </View>
            {post.location ? (
              <View style={styles.specialRow}>
                <Text style={styles.specialKey}>Location</Text>
                <Text style={styles.specialVal}>{post.location}</Text>
              </View>
            ) : null}
            {post.contact ? (
              <View style={styles.specialRow}>
                <Text style={styles.specialKey}>Contact</Text>
                <Text style={styles.specialVal}>{post.contact}</Text>
              </View>
            ) : null}
          </View>
        )}

        {post.communityType === "market" && (
          <View style={styles.specialBox}>
            <View style={styles.specialRow}>
              <Text style={styles.specialKey}>Status</Text>
              <Text style={[styles.specialVal, { color: post.itemStatus === "sold" ? "#dc2626" : "#16a34a" }]}>
                {(post.itemStatus || "available").toUpperCase()}
              </Text>
            </View>
            {post.price ? (
              <View style={styles.specialRow}>
                <Text style={styles.specialKey}>Price</Text>
                <Text style={styles.specialVal}>₹{post.price}</Text>
              </View>
            ) : null}
            {post.condition ? (
              <View style={styles.specialRow}>
                <Text style={styles.specialKey}>Condition</Text>
                <Text style={styles.specialVal}>{post.condition}</Text>
              </View>
            ) : null}
            {post.contact ? (
              <View style={styles.specialRow}>
                <Text style={styles.specialKey}>Contact</Text>
                <Text style={styles.specialVal}>{post.contact}</Text>
              </View>
            ) : null}
          </View>
        )}

        <TouchableOpacity
          style={[styles.upvote, hasVoted && styles.upvoteActive]}
          onPress={upvote}
        >
          <Text style={[styles.upvoteText, hasVoted && styles.upvoteTextActive]}>
            {hasVoted ? "⬆ Upvoted" : "⬆ Upvote"} · {post.upvotes || 0}
          </Text>
        </TouchableOpacity>

        {isAuthor && (
          <View style={styles.authorRow}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => router.push(`/edit-post/${id}`)}
            >
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.section}>Comments ({comments.length})</Text>
        {comments.map((c) => (
          <View key={c.id} style={styles.comment}>
            <Text style={styles.commentAuthor}>{c.authorName}</Text>
            <Text style={styles.commentBody}>{c.body}</Text>
          </View>
        ))}

        <TextInput
          style={styles.input}
          value={comment}
          onChangeText={setComment}
          placeholder="Add a comment…"
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          style={[styles.send, sending && { opacity: 0.6 }]}
          onPress={sendComment}
          disabled={sending}
        >
          {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendText}>Send</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { padding: 20, paddingBottom: 80 },
  tag: { color: "#4f46e5", fontWeight: "600", fontSize: 13 },
  title: { fontSize: 22, fontWeight: "bold", color: "#111", marginTop: 6 },
  meta: { fontSize: 13, color: "#666", marginTop: 4 },
  body: { fontSize: 15, color: "#333", marginTop: 16, lineHeight: 22 },
  upvote: { alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: "#eef2ff", marginTop: 20 },
  upvoteText: { color: "#4f46e5", fontWeight: "600" },
  upvoteActive: { backgroundColor: "#4f46e5" },
  upvoteTextActive: { color: "#fff" },
  authorRow: { flexDirection: "row", marginTop: 16, gap: 10 },
  editBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: "#4f46e5" },
  editText: { color: "#4f46e5", fontWeight: "600" },
  deleteBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: "#ef4444" },
  deleteText: { color: "#ef4444", fontWeight: "600" },
  specialBox: { backgroundColor: "#f9fafb", borderRadius: 12, padding: 14, marginTop: 16, borderWidth: 1, borderColor: "#eee" },
  specialRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  specialKey: { color: "#666", fontSize: 13 },
  specialVal: { color: "#111", fontWeight: "600", fontSize: 14, flexShrink: 1, textAlign: "right", marginLeft: 12 },
  section: { fontSize: 16, fontWeight: "700", marginTop: 30, marginBottom: 12, color: "#111" },
  comment: { backgroundColor: "#fafafa", padding: 12, borderRadius: 10, marginBottom: 8 },
  commentAuthor: { fontWeight: "600", color: "#4f46e5", fontSize: 13 },
  commentBody: { color: "#222", marginTop: 4 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 14, marginTop: 16, backgroundColor: "#fafafa" },
  send: { backgroundColor: "#4f46e5", padding: 14, borderRadius: 10, alignItems: "center", marginTop: 10 },
  sendText: { color: "#fff", fontWeight: "600" }
});