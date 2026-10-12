// src/app/home.tsx
import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/config";

export default function HomeScreen() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const user = auth.currentUser;
      if (!user) return;
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) setProfile(snap.data());
    }
    load();
  }, []);

  async function logout() {
    await signOut(auth);
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text>Loading profile…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
      <Text style={styles.name}>{profile.name}</Text>
      <Text style={styles.email}>{profile.email}</Text>

      <Text style={styles.placeholder}>
        Home feed coming in Phase 6 🚀
      </Text>

      <TouchableOpacity style={styles.logout} onPress={logout}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#fff" },
  avatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#f0f0f0" },
  name: { fontSize: 24, fontWeight: "bold", marginTop: 16, color: "#111" },
  email: { fontSize: 14, color: "#666", marginTop: 4 },
  placeholder: { marginTop: 40, color: "#4f46e5", fontSize: 16, fontWeight: "600" },
  logout: { marginTop: 60, padding: 12 },
  logoutText: { color: "#ef4444", fontWeight: "600" }
});