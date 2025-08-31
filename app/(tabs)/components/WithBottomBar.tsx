import React from "react";
import { StyleSheet, View } from "react-native";
import BottomBar from "./BottomBar";

type Props = { children: React.ReactNode };

export default function WithBottomBar({ children }: Props) {
  return (
    <View style={styles.root}>
      {/* your existing screen renders here unchanged */}
      <View style={styles.content}>{children}</View>

      {/* overlay the custom bottom bar */}
      <View pointerEvents="box-none" style={styles.overlay}>
        <BottomBar />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, position: "relative" },
  content: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,              // make sure it sits above the screen
  },
});
