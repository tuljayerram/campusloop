// src/app/profile-setup.tsx
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { useRouter } from "expo-router";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebase/config";

// A few pre-made avatar styles from DiceBear
const AVATAR_STYLES = ["adventurer", "bottts", "fun-emoji", "thumbs", "lorelei"];

// Fun name seeds for random avatar generation
const SEEDS = [
  "tiger", "panda", "rocket", "ninja", "dragon", "fox", "wolf", "lion",
  "falcon", "panther", "cobra", "phoenix", "raven", "shark", "bear"
];

function randomSeed() {
  return SEEDS[Math.floor(Math.random() * SEEDS.length)] + Math.floor(Math.random() * 9999);
}

function buildAvatarUrl(style: string, seed: string) {
  return `https://api.dicebear.com/7.x/${style}/png?seed=${seed}`;
}

export default function ProfileSetupScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [style, setStyle] = useState(AVATAR_STYLES[0]);
  const [seed, setSeed] = useState(randomSeed());
  const [saving, setSaving] = useState(false);

  const avatarUrl = buildAvatarUrl(style, seed);

  function shuffle() {
    setSeed(randomSeed());
  }

  async function saveProfile() {
    if (name.trim().length < 2) {
      Alert.alert("Name too short", "Please enter at least 2 characters.");
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Not logged in", "Please log in again.");
      return;
    }

    setSaving(true);
    try {
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        name: name.trim(),
        avatarUrl,
        avatarStyle: style,
        avatarSeed: seed,
        role: "student",
        createdAt: serverTimestamp()
      });
      router.replace("/(tabs)/home");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Set up your profile</Text>
        <Text style={styles.subtitle}>Pick an avatar and give yourself a name</Text>

        <Image source={{ uri: avatarUrl }} style={styles.avatar} />

        <TouchableOpacity style={styles.shuffleBtn} onPress={shuffle}>
          <Text style={styles.shuffleText}>🎲 Shuffle avatar</Text>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>Style</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          {AVATAR_STYLES.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setStyle(s)}
              style={[
                styles.styleChip,
                style === s && styles.styleChipActive
              ]}
            >
              <Image
                source={{ uri: buildAvatarUrl(s, seed) }}
                style={styles.styleChipImg}
              />
              <Text style={[styles.styleChipText, style === s && styles.styleChipTextActive]}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionLabel}>Display name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Tulja"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
          maxLength={24}
          editable={!saving}
        />

        <TouchableOpacity
          style={[styles.button, saving && { opacity: 0.7 }]}
          onPress={saveProfile}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save & Continue</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 60, backgroundColor: "#fff", flexGrow: 1 },
  title: { fontSize: 28, fontWeight: "bold", textAlign: "center", color: "#111" },
  subtitle: { fontSize: 14, textAlign: "center", color: "#666", marginTop: 6, marginBottom: 24 },
  avatar: { width: 160, height: 160, alignSelf: "center", borderRadius: 80, backgroundColor: "#f0f0f0" },
  shuffleBtn: { alignSelf: "center", marginTop: 12, padding: 10 },
  shuffleText: { color: "#4f46e5", fontWeight: "600" },
  sectionLabel: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 8, marginTop: 12 },
  styleChip: {
    alignItems: "center",
    marginRight: 12,
    padding: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#eee",
    width: 80
  },
  styleChipActive: { borderColor: "#4f46e5", backgroundColor: "#eef2ff" },
  styleChipImg: { width: 48, height: 48, borderRadius: 24 },
  styleChipText: { fontSize: 11, color: "#666", marginTop: 4 },
  styleChipTextActive: { color: "#4f46e5", fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#fafafa"
  },
  button: {
    backgroundColor: "#4f46e5",
    padding: 18,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 24
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 }
});