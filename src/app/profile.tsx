// src/app/profile.tsx
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView, Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { auth, db } from "../../firebase/config";

const AVATAR_STYLES = ["adventurer", "bottts", "fun-emoji", "thumbs", "lorelei"];

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

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [style, setStyle] = useState(AVATAR_STYLES[0]);
  const [seed, setSeed] = useState(randomSeed());
  const [saving, setSaving] = useState(false);

  async function load() {
    const user = auth.currentUser;
    if (!user) return;
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      const d = snap.data();
      setProfile(d);
      setName(d.name || "");
      setStyle(d.avatarStyle || AVATAR_STYLES[0]);
      setSeed(d.avatarSeed || randomSeed());
    }
    setLoading(false);
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  async function saveChanges() {
    if (name.trim().length < 2) {
      Alert.alert("Name too short");
      return;
    }
    const user = auth.currentUser;
    if (!user) return;
    setSaving(true);
    try {
      const avatarUrl = buildAvatarUrl(style, seed);
      await updateDoc(doc(db, "users", user.uid), {
        name: name.trim(),
        avatarUrl,
        avatarStyle: style,
        avatarSeed: seed
      });
      setEditing(false);
      load();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await signOut(auth);
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#4f46e5" size="large" /></View>;
  }
  if (!profile) {
    return <View style={styles.center}><Text>No profile found.</Text></View>;
  }

  const previewUrl = editing ? buildAvatarUrl(style, seed) : profile.avatarUrl;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen options={{ headerShown: true, title: "Profile" }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={{ uri: previewUrl }} style={styles.avatar} />

        {!editing ? (
          <>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.email}>{profile.email}</Text>

            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => setEditing(true)}
            >
              <Text style={styles.editBtnText}>Edit profile</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.shuffleBtn} onPress={() => setSeed(randomSeed())}>
              <Text style={styles.shuffleText}>🎲 Shuffle avatar</Text>
            </TouchableOpacity>

            <Text style={styles.sectionLabel}>Style</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              {AVATAR_STYLES.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setStyle(s)}
                  style={[styles.styleChip, style === s && styles.styleChipActive]}
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
              value={name}
              onChangeText={setName}
              maxLength={24}
              editable={!saving}
            />

            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.cancelBtn]}
                onPress={() => { setEditing(false); load(); }}
                disabled={saving}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                onPress={saveChanges}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </>
        )}

        <TouchableOpacity style={styles.logout} onPress={logout}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  container: { padding: 24, paddingTop: 40, paddingBottom: 60, alignItems: "center", backgroundColor: "#fff" },
  avatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#f0f0f0" },
  name: { fontSize: 22, fontWeight: "bold", marginTop: 16, color: "#111" },
  email: { fontSize: 14, color: "#666", marginTop: 4 },
  editBtn: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: "#4f46e5" },
  editBtnText: { color: "#4f46e5", fontWeight: "600" },
  shuffleBtn: { marginTop: 12, padding: 10 },
  shuffleText: { color: "#4f46e5", fontWeight: "600" },
  sectionLabel: { alignSelf: "flex-start", fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 8, marginTop: 12 },
  styleChip: { alignItems: "center", marginRight: 12, padding: 8, borderRadius: 12, borderWidth: 2, borderColor: "#eee", width: 80 },
  styleChipActive: { borderColor: "#4f46e5", backgroundColor: "#eef2ff" },
  styleChipImg: { width: 48, height: 48, borderRadius: 24 },
  styleChipText: { fontSize: 11, color: "#666", marginTop: 4 },
  styleChipTextActive: { color: "#4f46e5", fontWeight: "600" },
  input: { alignSelf: "stretch", borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 14, fontSize: 16, backgroundColor: "#fafafa" },
  row: { flexDirection: "row", marginTop: 20, gap: 10, alignSelf: "stretch" },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: "#ddd", alignItems: "center" },
  cancelText: { color: "#333", fontWeight: "600" },
  saveBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: "#4f46e5", alignItems: "center" },
  saveText: { color: "#fff", fontWeight: "600" },
  logout: { marginTop: 40, padding: 12 },
  logoutText: { color: "#ef4444", fontWeight: "600" }
});