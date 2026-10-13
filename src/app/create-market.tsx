// src/app/create-market.tsx
import { Stack, useRouter } from "expo-router";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
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

const STATUSES = ["available", "sold"];

export default function CreateMarketScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("available");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("");
  const [contact, setContact] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (title.trim().length < 3) {
      Alert.alert("Title too short");
      return;
    }
    const user = auth.currentUser;
    if (!user) return;

    setSaving(true);
    try {
      const uSnap = await getDoc(doc(db, "users", user.uid));
      const authorName = uSnap.exists() ? uSnap.data().name : "Anon";
      const authorAvatar = uSnap.exists() ? uSnap.data().avatarUrl : "";

      await addDoc(collection(db, "posts"), {
        communityId: "market",
        communityName: "Buy & Sell",
        communityType: "market",
        authorId: user.uid,
        authorName,
        authorAvatar,
        title: title.trim(),
        body: body.trim(),
        itemStatus: status,
        price: price.trim(),
        condition: condition.trim(),
        contact: contact.trim(),
        upvotes: 0,
        votedBy: [],
        createdAt: serverTimestamp()
      });
      router.back();
    } catch (e: any) {
      console.log("CREATE MARKET ERR", e);
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen options={{ headerShown: true, title: "List an item" }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Status</Text>
        <View style={styles.chipsRow}>
          {STATUSES.map(s => (
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

        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Selling Casio FX-991"
          placeholderTextColor="#999"
          maxLength={120}
        />

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

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, { height: 120, textAlignVertical: "top" }]}
          value={body}
          onChangeText={setBody}
          placeholder="Any details a buyer should know…"
          placeholderTextColor="#999"
          multiline
        />

        <TouchableOpacity
          style={[styles.button, saving && { opacity: 0.7 }]}
          onPress={submit}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Post listing</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
  label: { fontSize: 14, fontWeight: "600", color: "#333", marginTop: 16, marginBottom: 8 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: "#f0f0f0", marginRight: 8 },
  chipActive: { backgroundColor: "#4f46e5" },
  chipText: { color: "#333", fontSize: 13 },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 14, fontSize: 15, backgroundColor: "#fafafa" },
  button: { backgroundColor: "#4f46e5", padding: 16, borderRadius: 10, alignItems: "center", marginTop: 24 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 }
});