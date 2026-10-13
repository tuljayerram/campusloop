// src/app/create-post.tsx
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  addDoc,
  collection,
  doc, getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView, Platform,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from "react-native";
import { auth, db } from "../../firebase/config";

export default function CreatePostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ communityId?: string; communityName?: string }>();
  const [communities, setCommunities] = useState<any[]>([]);
  const [communityId, setCommunityId] = useState<string | null>(params.communityId || null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadCommunities() {
      const q = query(collection(db, "communities"), orderBy("name"));
      const snap = await getDocs(q);
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Exclude L&F and Market — those have dedicated screens
      const filtered = rows.filter((c: any) =>
        c.id !== "lostfound" && c.id !== "market"
      );
      setCommunities(filtered);
    }
    loadCommunities();
  }, []);

  async function submit() {
    if (!communityId) {
      Alert.alert("Pick a space", "Choose which community to post in.");
      return;
    }
    if (title.trim().length < 3) {
      Alert.alert("Title too short");
      return;
    }
    const user = auth.currentUser;
    if (!user) return;

    setSaving(true);
    try {
      const userSnap = await getDoc(doc(db, "users", user.uid));
      const authorName = userSnap.exists() ? userSnap.data().name : "Anonymous";
      const authorAvatar = userSnap.exists() ? userSnap.data().avatarUrl : "";

      const comm = communities.find(c => c.id === communityId);

      await addDoc(collection(db, "posts"), {
        communityId,
        communityName: comm?.name || "",
        communityType: comm?.type || "general",
        authorId: user.uid,
        authorName,
        authorAvatar,
        title: title.trim(),
        body: body.trim(),
        upvotes: 0,
        votedBy: [],
        createdAt: serverTimestamp()
      });

      router.back();
    } catch (e: any) {
      console.log("POST ERR", e);
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen options={{ headerShown: true, title: "New post" }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Space</Text>
        {communities.length === 0 ? (
          <Text style={{ color: "#999", marginBottom: 12 }}>Loading spaces…</Text>
        ) : (
          <View style={styles.chipsRow}>
            {communities.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.chip, communityId === c.id && styles.chipActive]}
                onPress={() => setCommunityId(c.id)}
              >
                <Text style={[styles.chipText, communityId === c.id && styles.chipTextActive]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="What's this about?"
          placeholderTextColor="#999"
          maxLength={120}
        />

        <Text style={styles.label}>Body (optional)</Text>
        <TextInput
          style={[styles.input, { height: 140, textAlignVertical: "top" }]}
          value={body}
          onChangeText={setBody}
          placeholder="Say more…"
          placeholderTextColor="#999"
          multiline
        />

        <TouchableOpacity
          style={[styles.button, saving && { opacity: 0.7 }]}
          onPress={submit}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Post</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
  label: { fontSize: 14, fontWeight: "600", color: "#333", marginTop: 16, marginBottom: 8 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: "#f0f0f0", marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: "#4f46e5" },
  chipText: { color: "#333", fontSize: 13 },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 14, fontSize: 15, backgroundColor: "#fafafa" },
  button: { backgroundColor: "#4f46e5", padding: 16, borderRadius: 10, alignItems: "center", marginTop: 24 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 }
});