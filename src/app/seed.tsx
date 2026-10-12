// src/app/seed.tsx
import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/config";

const COMMUNITIES = [
  { id: "cse",        name: "CSE",            type: "department", description: "Computer Science & Engineering" },
  { id: "ece",        name: "ECE",            type: "department", description: "Electronics & Communication" },
  { id: "mech",       name: "Mechanical",     type: "department", description: "Mechanical Engineering" },
  { id: "eee",        name: "EEE",            type: "department", description: "Electrical & Electronics" },
  { id: "cme",        name: "CME",            type: "department", description: "Computer Engineering" },
  { id: "it",         name: "IT",             type: "department", description: "Information Technology" },
  { id: "ai&ds",      name: "AI & DS",        type: "department", description: "AI & Data Science" },
  { id: "ai&ml",      name: "AI & ML",        type: "department", description: "AI & Machine Learning" },
  { id: "mba",        name: "MBA",            type: "department", description: "Business Administration" },
  { id: "year-2027",  name: "Batch of 2027",  type: "year",       description: "Students graduating in 2027" },
  { id: "year-2028",  name: "Batch of 2028",  type: "year",       description: "Students graduating in 2028" },
  { id: "year-2029",  name: "Batch of 2029",  type: "year",       description: "Students graduating in 2029" },
  { id: "year-2030",  name: "Batch of 2030",  type: "year",       description: "Students graduating in 2030" },
  { id: "canteen",    name: "Canteen",        type: "canteen",    description: "Menu, reviews, complaints" },
  { id: "transport",  name: "Transport",      type: "transport",  description: "Bus routes, timings, delays" },
  { id: "lostfound",  name: "Lost & Found",   type: "lostfound",  description: "Report lost or found items" },
  { id: "market",     name: "Buy & Sell",     type: "market",     description: "Buy, sell, or give away stuff" }
];

export default function SeedScreen() {
  const [busy, setBusy] = useState(false);

  async function seed() {
    setBusy(true);
    try {
      for (const c of COMMUNITIES) {
        await setDoc(doc(db, "communities", c.id), {
          name: c.name,
          type: c.type,
          description: c.description
        });
      }
      Alert.alert("Done", `Seeded ${COMMUNITIES.length} communities.`);
    } catch (e: any) {
      console.log("SEED ERR", e);
      Alert.alert("Error", e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seed Communities</Text>
      <Text style={styles.sub}>
        Tap to write the {COMMUNITIES.length} starter communities to Firestore.
        {"\n\n"}Safe to run multiple times.
      </Text>
      <TouchableOpacity style={styles.btn} onPress={seed} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Seed Now</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  sub: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 24 },
  btn: { backgroundColor: "#4f46e5", paddingHorizontal: 24, paddingVertical: 14, borderRadius: 10 },
  btnText: { color: "#fff", fontWeight: "600" }
});