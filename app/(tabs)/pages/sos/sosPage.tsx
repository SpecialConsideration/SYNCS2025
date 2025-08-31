import { useNavigation } from "@react-navigation/native";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useEffect, useRef, useState } from "react";
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const SOS_KEEP_AWAKE_TAG = "sos-mode";
const EMERGENCY_NUMBER = "000"; // AU — change to your region if needed

export default function SOSScreen() {
  const nav = useNavigation();
  const [isAlarmOn, setIsAlarmOn] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Keep the screen awake only while alarm is on
  useEffect(() => {
    (async () => {
      if (isAlarmOn) {
        try { await activateKeepAwakeAsync(SOS_KEEP_AWAKE_TAG); } catch {}
      } else {
        try { await deactivateKeepAwake(SOS_KEEP_AWAKE_TAG); } catch {}
      }
    })();
    return () => { deactivateKeepAwake(SOS_KEEP_AWAKE_TAG).catch(() => {}); };
  }, [isAlarmOn]);

  // Configure audio mode once
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      interruptionModeIOS: InterruptionModeIOS.DuckOthers,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      playThroughEarpieceAndroid: false,
    }).catch(() => {});
  }, []);

  // Load and (loop) play the siren
  const startAlarm = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        // You can swap this for a local asset if you prefer:
        // require("../../assets/sounds/siren.mp3")
        { uri: "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg" },
        { isLooping: true, volume: 1.0, shouldPlay: true }
      );
      soundRef.current = sound;
      setIsAlarmOn(true);
    } catch (e) {
      Alert.alert("Alarm error", "Could not start alarm sound.");
    }
  };

  const stopAlarm = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } finally {
      setIsAlarmOn(false);
    }
  };

  const toggleAlarm = () => (isAlarmOn ? stopAlarm() : startAlarm());

  const callEmergency = async () => {
    const url = `tel:${EMERGENCY_NUMBER}`;
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert("Call not supported", `Please call ${EMERGENCY_NUMBER} manually.`);
      return;
    }
    await Linking.openURL(url);
  };

  useEffect(() => {
    return () => {
      // cleanup
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
      deactivateKeepAwake(SOS_KEEP_AWAKE_TAG).catch(() => {});
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Back */}
      <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Emergency SOS</Text>

      {/* Big SOS button */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.sosBtn, isAlarmOn && styles.sosBtnActive]}
        onPress={toggleAlarm}
      >
        <Text style={styles.sosText}>{isAlarmOn ? "STOP" : "SOS"}</Text>
      </TouchableOpacity>

      {/* Call emergency */}
      <TouchableOpacity style={styles.callBtn} onPress={callEmergency}>
        <Text style={styles.callText}>Call {EMERGENCY_NUMBER}</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        Tap SOS to play a loud alarm and keep the screen awake. Use “Call” for emergency services.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b1220", alignItems: "center", justifyContent: "center", padding: 24 },
  backBtn: { position: "absolute", top: 54, left: 20, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: "#111a30" },
  backText: { color: "#c9d7ff", fontSize: 16 },
  title: { color: "white", fontSize: 28, fontWeight: "800", marginBottom: 24 },
  sosBtn: {
    width: 220, height: 220, borderRadius: 110,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#ff3b30", borderWidth: 6, borderColor: "#ff7a73",
    shadowColor: "#ff3b30", shadowOpacity: 0.6, shadowRadius: 16, shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  sosBtnActive: { backgroundColor: "#d0021b", borderColor: "#ffb3ae" },
  sosText: { color: "white", fontSize: 64, fontWeight: "900", letterSpacing: 2 },
  callBtn: { marginTop: 28, backgroundColor: "#1b5cff", paddingVertical: 14, paddingHorizontal: 32, borderRadius: 14 },
  callText: { color: "white", fontWeight: "800", fontSize: 18 },
  hint: { color: "#aab4d4", marginTop: 14, textAlign: "center" },
});
