// src/app/create-event.tsx
import { Stack, useRouter } from "expo-router";
import { addDoc, collection, doc, getDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView, Platform,
    ScrollView,
    StyleSheet,
    Text, TextInput, TouchableOpacity
} from "react-native";
import { auth, db } from "../../firebase/config";

export default function CreateEventScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [venue, setVenue] = useState("");
  const [regLink, setRegLink] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [organizerContact, setOrganizerContact] = useState("");
  const [saving, setSaving] = useState(false);

  function parseDate(input: string): Date | null {
    const cleaned = input.trim().replace(" ", "T");
    const d = new Date(cleaned);
    if (isNaN(d.getTime())) return null;
    return d;
  }

  async function submit() {
    if (title.trim().length < 3) {
      Alert.alert("Title too short");
      return;
    }
    const d = parseDate(dateStr);
    if (!d) {
      Alert.alert("Invalid date", "Use format: 2026-11-15 18:30");
      return;
    }
    if (!organizerName.trim()) {
      Alert.alert("Add organizer name");
      return;
    }
    const user = auth.currentUser;
    if (!user) return;

    setSaving(true);
    try {
      const uSnap = await getDoc(doc(db, "users", user.uid));
      const authorName = uSnap.exists() ? uSnap.data().name : "Anon";
      const authorAvatar = uSnap.exists() ? uSnap.data().avatarUrl : "";

      await addDoc(collection(db, "events"), {
        title: title.trim(),
        description: description.trim(),
        dateTime: Timestamp.fromDate(d),
        venue: venue.trim(),
        registrationLink: regLink.trim(),
        organizerName: organizerName.trim(),
        organizerContact: organizerContact.trim(),
        authorId: user.uid,
        authorName,
        authorAvatar,
        createdAt: serverTimestamp()
      });
      router.back();
    } catch (e: any) {
      console.log("CREATE EVENT ERR", e);
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen options={{ headerShown: true, title: "New event" }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Event title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Hackathon 2026"
          placeholderTextColor="#999"
          maxLength={120}
        />

        <Text style={styles.label}>Date & time</Text>
        <TextInput
          style={styles.input}
          value={dateStr}
          onChangeText={setDateStr}
          placeholder="2026-11-15 18:30"
          placeholderTextColor="#999"
          autoCapitalize="none"
        />
        <Text style={styles.hint}>Format: YYYY-MM-DD HH:MM (24-hour)</Text>

        <Text style={styles.label}>Venue</Text>
        <TextInput
          style={styles.input}
          value={venue}
          onChangeText={setVenue}
          placeholder="e.g. Seminar Hall, Block A"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, { height: 120, textAlignVertical: "top" }]}
          value={description}
          onChangeText={setDescription}
          placeholder="What's the event about?"
          placeholderTextColor="#999"
          multiline
        />

        <Text style={styles.label}>Registration link</Text>
        <TextInput
          style={styles.input}
          value={regLink}
          onChangeText={setRegLink}
          placeholder="https://..."
          placeholderTextColor="#999"
          autoCapitalize="none"
          keyboardType="url"
        />

        <Text style={styles.label}>Organizer name</Text>
        <TextInput
          style={styles.input}
          value={organizerName}
          onChangeText={setOrganizerName}
          placeholder="e.g. CSE Department / Coding Club"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Organizer contact (optional)</Text>
        <TextInput
          style={styles.input}
          value={organizerContact}
          onChangeText={setOrganizerContact}
          placeholder="Phone, email, or room number"
          placeholderTextColor="#999"
        />

        <TouchableOpacity
          style={[styles.button, saving && { opacity: 0.7 }]}
          onPress={submit}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create event</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
  label: { fontSize: 14, fontWeight: "600", color: "#333", marginTop: 16, marginBottom: 8 },
  hint: { fontSize: 12, color: "#999", marginTop: -4 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 14, fontSize: 15, backgroundColor: "#fafafa" },
  button: { backgroundColor: "#4f46e5", padding: 16, borderRadius: 10, alignItems: "center", marginTop: 24 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 }
});