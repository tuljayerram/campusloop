// src/app/_layout.tsx
import { Stack, useRouter, useSegments } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { auth, db } from "../../firebase/config";

export default function RootLayout() {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        try {
          const snap = await getDoc(doc(db, "users", u.uid));
          setHasProfile(snap.exists());
        } catch {
          setHasProfile(false);
        }
      } else {
        setUser(null);
        setHasProfile(false);
      }
      setChecking(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (checking) return;

    const current = segments[0] as string | undefined;

    const publicRoutes = ["index"];
    const profileSetupRoute = "profile-setup";
    const appRoutes = [
      "(tabs)",
      "community",
      "post",
      "create-post",
      "edit-post",
      "create-event",
      "event",
      "create-lostfound",
      "create-market",
      "profile",
      "seed"
    ];

    const inPublic = current && publicRoutes.includes(current);
    const inProfileSetup = current === profileSetupRoute;
    const inApp = current && appRoutes.includes(current);

    if (!user) {
      if (!inPublic) router.replace("/");
    } else if (!hasProfile) {
      if (!inProfileSetup) router.replace("/profile-setup");
    } else {
      if (!inApp) router.replace("/(tabs)/home");
    }
  }, [user, hasProfile, checking, segments]);

  if (checking) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }
});