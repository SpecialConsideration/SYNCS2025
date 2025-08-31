import { IconSymbol } from "@/components/ui/IconSymbol";
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { memo } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const BLUE = "#1A73E8";

export default memo(function BottomBar() {
  const router = useRouter();
  const pathname = usePathname();
  const isActive = (route: string) => pathname === route;

  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <View style={styles.bar}>
        <NavItem
          iosNameActive="map.fill"
          iosNameInactive="map"

          label="Map"
          active={isActive("/pages/home/homePage")}
          onPress={() => router.push("/pages/home/homePage")}
        />
        <NavItem
          iosNameActive="deskclock.fill"
          iosNameInactive="deskclock"

          label="Booking"
          active={isActive("/pages/booking/bookingPage")}
          onPress={() => router.push("/pages/booking/bookingPage")}
        />

        <View style={{ width: 72 }} />

        <NavItem
          iosNameActive="bubble.left.fill"
          iosNameInactive="bubble.left"

          label="Community"
          active={isActive("/pages/community/communityPage")}
          onPress={() => router.push("/pages/community/communityPage")}
        />
        <NavItem
          iosNameActive="person.fill"
          iosNameInactive="person"

          label="Profile"
          active={isActive("/")}
          onPress={() => router.push("/pages/account/accountPage")}
        />
      </View>

      {/* Center FAB */}
      <TouchableOpacity activeOpacity={0.9} onPress={() => router.push("/pages/sos/sosPage")} style={styles.fab}>
        {Platform.OS === "ios" ? (
          <IconSymbol name="sos" size={26} color="#fff" />
        ) : (
          <Ionicons name="storefront" size={26} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  );
});

function NavItem({
  iosNameActive,
  iosNameInactive,
  label,
  active,
  onPress,
}: {
  iosNameActive: string;
  iosNameInactive: string;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  const color = active ? "#3B82F6" : "#9CA3AF";
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.navItem}>

        <IconSymbol name={active ? iosNameActive : iosNameInactive} size={22} color={color} />
      
      <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
        {active ? label : " "}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: "absolute", left: 0, right: 0, bottom: -35, alignItems: "center" },
  bar: {
    height: 68,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 12,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 10 },
    }),
  },
  fab: {
    position: "absolute",
    bottom: 34,
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: BLUE,
    alignItems: "center", justifyContent: "center",
    ...Platform.select({
      ios: { shadowColor: BLUE, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 14 },
    }),
  },
  navItem: { width: 62, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 12, marginTop: 4, color: "#9CA3AF" },
  labelActive: { color: "#3B82F6", fontWeight: "600" },
});
