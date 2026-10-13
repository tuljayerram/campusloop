// src/app/event/[id].tsx
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { deleteDoc, doc, getDoc } from "firebase/firestore";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { auth, db } from "../../../firebase/config";

function formatFull(ts: any) {
  if (!ts?.seconds) return "Date TBD";
  const d = new Date(ts.seconds * 1000);
  return d.toLocaleString("en-IN", {
    weekday: "long",
    day: "numeric", month: "long", year: "numeric",
    hour: "numeric", minute: "2-digit"
  });
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthor, setIsAuthor] = useState(false);

  async function load() {
    if (!id) return;
    try {
      const snap = await getDoc(doc(db, "events", id));
      if (snap.exists()) {
        const data: any = snap.data();
        setEvent({ id: snap.id, ...data });
        setIsAuthor(auth.currentUser?.uid === data.authorId);
      }
    } catch (e) {
      console.log("LOAD EVENT ERR", e);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(useCallback(() => { load(); }, [id]));

  async function openLink() {
    if (!event?.registrationLink) return;
    try {
      const supported = await Linking.canOpenURL(event.registrationLink);
      if (supported) await Linking.openURL(event.registrationLink);
      else Alert.alert("Invalid link");
    } catch {
      Alert.alert("Could not open link");
    }
  }

  function handleDelete() {
    Alert.alert("Delete event?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "events", id!));
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
  if (!event) {
    return <View style={styles.center}><Text>Event not found.</Text></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: "Event" }} />

      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.date}>{formatFull(event.dateTime)}</Text>

      <View style={styles.box}>
        {event.venue ? (
          <View style={styles.row}>
            <Text style={styles.key}>Venue</Text>
            <Text style={styles.val}>{event.venue}</Text>
          </View>
        ) : null}
        <View style={styles.row}>
          <Text style={styles.key}>Organizer</Text>
          <Text style={styles.val}>{event.organizerName}</Text>
        </View>
        {event.organizerContact ? (
          <View style={styles.row}>
            <Text style={styles.key}>Contact</Text>
            <Text style={styles.val}>{event.organizerContact}</Text>
          </View>
        ) : null}
      </View>

      {event.description ? (
        <>
          <Text style={styles.section}>About</Text>
          <Text style={styles.body}>{event.description}</Text>
        </>
      ) : null}

      {event.registrationLink ? (
        <TouchableOpacity style={styles.registerBtn} onPress={openLink}>
          <Text style={styles.registerText}>Register →</Text>
        </TouchableOpacity>
      ) : null}

      {isAuthor ? (
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteText}>Delete event</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { padding: 20, paddingBottom: 80, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", color: "#111" },
  date: { fontSize: 14, color: "#4f46e5", fontWeight: "600", marginTop: 8 },
  box: { backgroundColor: "#f9fafb", borderRadius: 12, padding: 14, marginTop: 20, borderWidth: 1, borderColor: "#eee" },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  key: { color: "#666", fontSize: 13 },
  val: { color: "#111", fontWeight: "600", fontSize: 14, flexShrink: 1, textAlign: "right", marginLeft: 12 },
  section: { fontSize: 16, fontWeight: "700", marginTop: 24, marginBottom: 8, color: "#111" },
  body: { fontSize: 15, color: "#333", lineHeight: 22 },
  registerBtn: { backgroundColor: "#4f46e5", padding: 16, borderRadius: 10, alignItems: "center", marginTop: 24 },
  registerText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  deleteBtn: { padding: 16, alignItems: "center", marginTop: 16 },
  deleteText: { color: "#ef4444", fontWeight: "600" }
});