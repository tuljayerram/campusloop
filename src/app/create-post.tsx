// src/app/create-post.tsx
import { useEffect, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform
} from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import {
  collection, addDoc, serverTimestamp, getDocs, query, orderBy, doc, getDoc
} from "firebase/firestore";
import { auth, db } from "../../firebase/config";

const LOSTFOUND_STATUS = ["lost", "found", "resolved"];
const MARKET_STATUS = ["available", "sold"];

export default function CreatePostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ communityId?: string; communityName?: string }>();
  const [communities, setCommunities] = useState<any[]>([]);
  const [communityId, setCommunityId] = useState<string | null>(params.communityId || null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  // Extra fields for special communities
  const [status, setStatus] = useState<string>("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("");
  const [contact, setContact] = useState("");

  const selectedCommunity = communities.find(c => c.id === communityId);
  const isLostFound = selectedCommunity?.type === "lostfound";
  const isMarket = selectedCommunity?.type === "market";

  useEffect(() => {
    async function loadCommunities() {
      const q = query(collection(db, "communities"), orderBy("name"));
      const snap = await getDocs(q);
      setCommunities(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    loadCommunities();
  }, []);

  // Reset extra fields when switching community type
  useEffect(() => {
    setStatus("");
    setLocation("");
    setPrice("");
    setCondition("");
    setContact("");
  }, [communityId]);

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

      const postData: any = {
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
      };

      if (isLostFound) {
        postData.itemStatus = status || "lost";
        postData.location = location.trim();
        postData.contact = contact.trim();
      }
      if (isMarket) {
        postData.itemStatus = status || "available";
        postData.price = price.trim();
        postData.condition = condition.trim();
        postData.contact = contact.trim();
      }

      await addDoc(collection(db, "posts"), postData);
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
          placeholder={
            isLostFound ? "e.g. Lost black water bottle" :
            isMarket ? "e.g. Selling Casio FX-991" :
            "What's this about?"
          }
          placeholderTextColor="#999"
          maxLength={120}
        />

        {/* Lost & Found fields */}
        {isLostFound && (
          <>
            <Text style={styles.label}>Status</Text>
            <View style={styles.chipsRow}>
              {LOSTFOUND_STATUS.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, status === s && styles.chipActive]}
                  onPress={() => setStatus(s)}
                >
                  <Text style={[styles.chipText, status === s && styles.chipTextActive]}>
                    {s.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. Library, 2nd floor"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Contact</Text>
            <TextInput
              style={styles.input}
              value={contact}
              onChangeText={setContact}
              placeholder="Phone / email / room number"
              placeholderTextColor="#999"
            />
          </>
        )}

        {/* Buy & Sell fields */}
        {isMarket && (
          <>
            <Text style={styles.label}>Status</Text>
            <View style={styles.chipsRow}>
              {MARKET_STATUS.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, status === s && styles.chipActive]}
                  onPress={() => setStatus(s)}
                >
                  <Text style={[styles.chipText, status === s && styles.chipTextActive]}>
                    {s.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Price (₹)</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="e.g. 500"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Condition</Text>
            <TextInput
              style={styles.input}
              value={condition}
              onChangeText={setCondition}
              placeholder="e.g. Like new, 6 months old"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Contact</Text>
            <TextInput
              style={styles.input}
              value={contact}
              onChangeText={setContact}
              placeholder="Phone / email / room number"
              placeholderTextColor="#999"
            />
          </>
        )}

        <Text style={styles.label}>Description {isLostFound || isMarket ? "" : "(optional)"}</Text>
        <TextInput
          style={[styles.input, { height: 120, textAlignVertical: "top" }]}
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