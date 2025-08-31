// HelpersScreen.tsx
import { useNavigation } from "@react-navigation/native";
import { useMemo, useState } from "react";
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from "react-native";

type Category = "Mobility" | "Blind" | "Deaf" | "Cognitive" | "General";

type Review = {
  id: string;
  author: string;
  rating: number; // 1..5
  comment: string;
  createdAt: number; // epoch ms
};

type Helper = {
  id: string;
  name: string;
  categories: Category[];
  pricePerHour: number;
  yearsExperience: number;
  description: string;
  rating: number; // avg 1..5
  reviews: Review[];
  area?: string;
};

type BookingDraft = {
  helper?: Helper;
  slot?: string; // quick chip (e.g., "Today 3pm") OR free text
  customWhen?: string;
  durationHrs: number;
  method: "In-person" | "Video" | "Phone";
  notes?: string;
};

const CATEGORIES: Array<Category | "All"> = ["All", "Mobility", "Blind", "Deaf", "Cognitive", "General"];

const uid = () => Math.random().toString(36).slice(2);
const now = () => Date.now();
const timeAgo = (ts: number) => {
  const s = Math.floor((now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

const SEED_HELPERS: Helper[] = [
  {
    id: uid(),
    name: "Maya Thompson",
    categories: ["Mobility", "General"],
    pricePerHour: 45,
    yearsExperience: 6,
    description: "Wheelchair user support, accessible transport planning, venue accessibility checks.",
    rating: 4.8,
    area: "Sydney CBD & Inner West",
    reviews: [
      { id: uid(), author: "Jordan", rating: 5, comment: "Maya knew all the accessible entrances. Life saver!", createdAt: now() - 1000 * 60 * 50 },
      { id: uid(), author: "Lee", rating: 5, comment: "Super reliable and kind.", createdAt: now() - 1000 * 60 * 60 * 5 },
    ],
  },
  {
    id: uid(),
    name: "Samir Patel",
    categories: ["Blind", "General"],
    pricePerHour: 40,
    yearsExperience: 4,
    description: "Orientation & mobility assistance, grocery labeling, tech setup with screen readers.",
    rating: 4.7,
    area: "Parramatta & surrounds",
    reviews: [
      { id: uid(), author: "Ava", rating: 5, comment: "Helped configure VoiceOver perfectly.", createdAt: now() - 1000 * 60 * 150 },
      { id: uid(), author: "Chris", rating: 4, comment: "Great O&M tips around the station.", createdAt: now() - 1000 * 60 * 60 * 20 },
    ],
  },
  {
    id: uid(),
    name: "Emily Zhang",
    categories: ["Deaf", "General"],
    pricePerHour: 55,
    yearsExperience: 7,
    description: "Auslan interpreter (NAATI), appointment support, captioning setup for devices.",
    rating: 4.9,
    area: "Eastern Suburbs",
    reviews: [
      { id: uid(), author: "Noah", rating: 5, comment: "Professional and friendly interpreter.", createdAt: now() - 1000 * 60 * 400 },
      { id: uid(), author: "Mia", rating: 5, comment: "Helped set up captions for Zoom.", createdAt: now() - 1000 * 60 * 60 * 48 },
    ],
  },
  {
    id: uid(),
    name: "Riley O'Connor",
    categories: ["Cognitive", "General"],
    pricePerHour: 38,
    yearsExperience: 5,
    description: "Executive function support, scheduling, sensory-friendly planning for outings.",
    rating: 4.6,
    area: "North Shore",
    reviews: [
      { id: uid(), author: "Taylor", rating: 4, comment: "Very patient and organized.", createdAt: now() - 1000 * 60 * 200 },
      { id: uid(), author: "Zoe", rating: 5, comment: "Weekly check-ins keep me on track.", createdAt: now() - 1000 * 60 * 60 * 72 },
    ],
  },
  {
    id: uid(),
    name: "Diego Silva",
    categories: ["Mobility", "Blind"],
    pricePerHour: 50,
    yearsExperience: 8,
    description: "Public transport accompaniment, tactile maps, stair-free route planning.",
    rating: 4.8,
    area: "Greater Sydney",
    reviews: [
      { id: uid(), author: "Harper", rating: 5, comment: "Found the most accessible path to the venue.", createdAt: now() - 1000 * 60 * 90 },
      { id: uid(), author: "Kai", rating: 4, comment: "Reliable and punctual.", createdAt: now() - 1000 * 60 * 60 * 10 },
    ],
  },
];

export default function HelpersScreen() {
  const nav = useNavigation();
  const isDark = useColorScheme() === "dark";
  const styles = useMemo(() => getStyles(isDark), [isDark]);

  // State
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<(typeof CATEGORIES)[number]>("All");
  const [sortBy, setSortBy] = useState<"Top Rated" | "Price" | "Experience">("Top Rated");

  const [helpers] = useState<Helper[]>(SEED_HELPERS);

  // Detail modal
  const [detail, setDetail] = useState<Helper | null>(null);

  // Booking modal
  const [bookingOpen, setBookingOpen] = useState(false);
  const [draft, setDraft] = useState<BookingDraft>({
    helper: undefined,
    slot: undefined,
    customWhen: "",
    durationHrs: 2,
    method: "In-person",
    notes: "",
  });

  // Derived list
  const filtered = helpers
    .filter((h) =>
      activeCat === "All" ? true : h.categories.includes(activeCat as Category)
    )
    .filter((h) =>
      search.trim().length === 0
        ? true
        : (h.name + " " + h.description + " " + h.categories.join(" "))
            .toLowerCase()
            .includes(search.trim().toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "Top Rated") return b.rating - a.rating;
      if (sortBy === "Price") return a.pricePerHour - b.pricePerHour;
      return b.yearsExperience - a.yearsExperience;
    });

  const openBooking = (h: Helper) => {
    setDraft((d) => ({ ...d, helper: h, slot: undefined, customWhen: "" }));
    setBookingOpen(true);
  };

  const confirmBooking = () => {
    if (!draft.helper) return;
    const when = draft.slot || draft.customWhen?.trim();
    if (!when) {
      Alert.alert("Choose a time", "Please pick a quick slot or enter a date/time.");
      return;
    }
    Alert.alert(
      "Booking requested",
      `Helper: ${draft.helper.name}\nWhen: ${when}\nDuration: ${draft.durationHrs}h\nMethod: ${draft.method}\n\nWe'll notify the helper to confirm.`,
    );
    setBookingOpen(false);
  };

  // replace the existing StarRow with this
const STAR_YELLOW = "#FFD700"; // nice bright yellow
const STAR_EMPTY  = "#D1D5DB"; // soft gray for empty stars

const StarRow = ({ rating, size = 14 }: { rating: number; size?: number }) => {
  const full = Math.round(rating); // keep your original rounding behavior
  const empty = 5 - full;

  return (
    <Text style={{ fontSize: size }} accessibilityLabel={`Rating ${rating} out of 5`}>
      <Text style={{ color: STAR_YELLOW }}>{"★".repeat(full)}</Text>
      <Text style={{ color: STAR_EMPTY }}>{"☆".repeat(empty)}</Text>
      <Text style={{ fontSize: size - 2, color: "#888" }}> ({rating.toFixed(1)})</Text>
    </Text>
  );
};


  const Chip = ({
    label,
    active,
    onPress,
  }: {
    label: string;
    active?: boolean;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      accessibilityLabel={label}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>#{label}</Text>
    </TouchableOpacity>
  );

  const SortButton = ({ label }: { label: "Top Rated" | "Price" | "Experience" }) => (
    <TouchableOpacity
      onPress={() => setSortBy(label)}
      style={[styles.sortBtn, sortBy === label && styles.sortBtnActive]}
      accessibilityRole="button"
      accessibilityLabel={`Sort by ${label}`}
    >
      <Text style={[styles.sortText, sortBy === label && styles.sortTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const HelperCard = ({ item }: { item: Helper }) => (
    <View style={styles.card} accessibilityRole="summary" accessible>
      <View style={styles.cardHeader}>
        <Text style={styles.name}>{item.name}</Text>
        <StarRow rating={item.rating} />
      </View>

      <Text style={styles.desc} numberOfLines={3}>{item.description}</Text>

      <View style={styles.metaRow}>
        <Text style={styles.meta}>💼 {item.yearsExperience} yrs</Text>
        <Text style={styles.meta}>💲 ${item.pricePerHour}/hr</Text>
        {item.area ? <Text style={styles.meta}>📍 {item.area}</Text> : null}
      </View>

      <View style={styles.tagsRow}>
        {item.categories.map((c) => (
          <View key={c} style={styles.tag}>
            <Text style={styles.tagText}>#{c}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => setDetail(item)}
          style={[styles.btn, styles.btnGhost]}
          accessibilityRole="button"
          accessibilityLabel={`View details for ${item.name}`}
        >
          <Text style={styles.btnGhostText}>Details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => openBooking(item)}
          style={[styles.btn, styles.btnPrimary]}
          accessibilityRole="button"
          accessibilityLabel={`Book ${item.name}`}
        >
          <Text style={styles.btnPrimaryText}>Book</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (nav as any)?.goBack?.()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Find a Helper</Text>
        <View style={{ width: 64 }} />
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by skill, area, or name"
          style={styles.searchInput}
          returnKeyType="search"
        />
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        <FlatList
          data={CATEGORIES as string[]}
          keyExtractor={(t) => t}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12 }}
          renderItem={({ item: c }) => (
            <Chip label={c} active={activeCat === c} onPress={() => setActiveCat(c as any)} />
          )}
        />
      </View>

      {/* Sort */}
      <View style={styles.sortRow}>
        <SortButton label="Top Rated" />
        <SortButton label="Price" />
        <SortButton label="Experience" />
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(h) => h.id}
        renderItem={HelperCard}
        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
        ListEmptyComponent={
          <View style={{ padding: 32, alignItems: "center" }}>
            <Text style={{ color: isDark ? "#aab4d4" : "#6b7280" }}>No helpers match your filters.</Text>
          </View>
        }
      />

      {/* Details modal */}
      <Modal visible={!!detail} animationType="slide" transparent>
        <Pressable style={styles.modalBackdrop} onPress={() => setDetail(null)} />
        <View style={styles.modalCard}>
          {detail && (
            <>
              <Text style={styles.modalTitle}>{detail.name}</Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <StarRow rating={detail.rating} size={16} />
                <Text style={styles.meta}>💲 ${detail.pricePerHour}/hr • 💼 {detail.yearsExperience} yrs</Text>
              </View>
              <Text style={styles.modalDesc}>{detail.description}</Text>
              {detail.area ? <Text style={[styles.meta, { marginTop: 6 }]}>📍 {detail.area}</Text> : null}

              <Text style={styles.sectionTitle}>Reviews</Text>
              {detail.reviews.map((r) => (
                <View key={r.id} style={styles.review}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={styles.reviewAuthor}>{r.author}</Text>
                    <Text style={styles.reviewTime}>{timeAgo(r.createdAt)}</Text>
                  </View>
                  <StarRow rating={r.rating} />
                  <Text style={styles.reviewComment}>{r.comment}</Text>
                </View>
              ))}

              <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                <TouchableOpacity
                  onPress={() => {
                    setDetail(null);
                    openBooking(detail);
                  }}
                  style={[styles.btn, styles.btnPrimary, { flex: 1 }]}
                >
                  <Text style={styles.btnPrimaryText}>Book {detail.name}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setDetail(null)} style={[styles.btn, styles.btnGhost, { flex: 1 }]}>
                  <Text style={styles.btnGhostText}>Close</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>

      {/* Booking modal */}
      <Modal visible={bookingOpen} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.select({ ios: "padding", android: undefined })} style={styles.modalWrap}>
          <View style={styles.bookingCard}>
            <Text style={styles.modalTitle}>Book {draft.helper?.name}</Text>

            {/* Quick slots */}
            <Text style={styles.fieldLabel}>Choose a time</Text>
            <View style={styles.slotRow}>
              {["Today 3:00 pm", "Today 6:00 pm", "Tomorrow 10:00 am"].map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setDraft((d) => ({ ...d, slot: s, customWhen: "" }))}
                  style={[styles.slotChip, draft.slot === s && styles.slotChipActive]}
                >
                  <Text style={[styles.slotText, draft.slot === s && styles.slotTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom when */}
            <TextInput
              value={draft.customWhen}
              onChangeText={(t) => setDraft((d) => ({ ...d, customWhen: t, slot: undefined }))}
              placeholder="Or type a date/time (e.g., Fri 5pm)"
              style={styles.input}
            />

            {/* Duration */}
            <Text style={styles.fieldLabel}>Duration</Text>
            <View style={styles.slotRow}>
              {[1, 2, 4].map((h) => (
                <TouchableOpacity
                  key={h}
                  onPress={() => setDraft((d) => ({ ...d, durationHrs: h }))}
                  style={[styles.slotChip, draft.durationHrs === h && styles.slotChipActive]}
                >
                  <Text style={[styles.slotText, draft.durationHrs === h && styles.slotTextActive]}>{h}h</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Method */}
            <Text style={styles.fieldLabel}>Method</Text>
            <View style={styles.slotRow}>
              {(["In-person", "Video", "Phone"] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setDraft((d) => ({ ...d, method: m }))}
                  style={[styles.slotChip, draft.method === m && styles.slotChipActive]}
                >
                  <Text style={[styles.slotText, draft.method === m && styles.slotTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Notes */}
            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput
              value={draft.notes}
              onChangeText={(t) => setDraft((d) => ({ ...d, notes: t }))}
              placeholder="Access needs, meeting point, goals…"
              style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
              multiline
            />

            {/* Actions */}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <TouchableOpacity
                onPress={() => setBookingOpen(false)}
                style={[styles.btn, styles.btnGhost, { flex: 1 }]}
                accessibilityRole="button"
                accessibilityLabel="Cancel booking"
              >
                <Text style={styles.btnGhostText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmBooking}
                style={[styles.btn, styles.btnPrimary, { flex: 1 }]}
                accessibilityRole="button"
                accessibilityLabel="Confirm booking"
              >
                <Text style={styles.btnPrimaryText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ----- Styles
function getStyles(isDark: boolean) {
  const text = isDark ? "#eaf0ff" : "#0f172a";
  const sub = isDark ? "#aab4d4" : "#6b7280";
  const cardBg = isDark ? "#111827" : "#ffffff";
  const bg = isDark ? "#0b1220" : "#f7fafc";
  const border = isDark ? "#1f2937" : "#e5e7eb";
  const primary = "#1b5cff";

  return StyleSheet.create({
    root: { flex: 1, backgroundColor: bg },

    header: {
      paddingTop: Platform.select({ ios: 54, android: 24, default: 24 }),
      paddingBottom: 12,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    backBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
    backText: { color: primary, fontWeight: "700", fontSize: 16 },
    title: { color: text, fontSize: 22, fontWeight: "800" },

    searchRow: { paddingHorizontal: 16, paddingBottom: 8 },
    searchInput: {
      backgroundColor: isDark ? "#0f172a" : "#fff",
      borderWidth: 1, borderColor: border, borderRadius: 12,
      paddingHorizontal: 14, paddingVertical: 10, color: text,
    },

    filterRow: { paddingVertical: 8, borderBottomWidth: 1, borderColor: border },
    chip: {
      paddingVertical: 8, paddingHorizontal: 12, marginRight: 8,
      borderRadius: 16, backgroundColor: isDark ? "#0f172a" : "#eef2ff",
      borderWidth: 1, borderColor: isDark ? "#0b1220" : "#dbe2ff",
    },
    chipActive: { backgroundColor: primary, borderColor: primary },
    chipText: { color: isDark ? "#cbd5e1" : "#3843a3", fontWeight: "700" },
    chipTextActive: { color: "#fff" },

    sortRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
    sortBtn: {
      paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12,
      borderWidth: 1, borderColor: border, backgroundColor: isDark ? "#0f172a" : "#fff",
    },
    sortBtnActive: { backgroundColor: "#e7f7ff", borderColor: "#cfe0ff" },
    sortText: { color: text, fontWeight: "700" },
    sortTextActive: { color: primary },

    card: {
      backgroundColor: cardBg, borderRadius: 14, padding: 12, marginBottom: 12,
      borderWidth: 1, borderColor: border,
      shadowColor: "#000", shadowOpacity: isDark ? 0.2 : 0.08, shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 }, elevation: 2,
    },
    cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    name: { color: text, fontSize: 18, fontWeight: "800" },
    desc: { color: text, marginTop: 6, lineHeight: 20 },

    metaRow: { flexDirection: "row", gap: 12, marginTop: 8, flexWrap: "wrap" },
    meta: { color: sub, fontWeight: "600" },

    tagsRow: { flexDirection: "row", gap: 6, marginTop: 8, flexWrap: "wrap" },
    tag: {
      paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12,
      backgroundColor: isDark ? "#172554" : "#eef2ff",
    },
    tagText: { color: isDark ? "#c7d2fe" : "#3843a3", fontSize: 12, fontWeight: "700" },

    actions: { flexDirection: "row", gap: 10, marginTop: 12 },
    btn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
    btnGhost: { backgroundColor: isDark ? "#0f172a" : "#f6f6f6", borderWidth: 1, borderColor: border },
    btnGhostText: { color: text, fontWeight: "800" },
    btnPrimary: { backgroundColor: primary },
    btnPrimaryText: { color: "#fff", fontWeight: "800" },

    modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
    modalCard: {
      position: "absolute", left: 0, right: 0, bottom: 0,
      backgroundColor: cardBg, borderTopLeftRadius: 16, borderTopRightRadius: 16,
      padding: 16, borderTopWidth: 1, borderColor: border, maxHeight: "85%",
    },
    modalTitle: { color: text, fontSize: 18, fontWeight: "800", marginBottom: 6 },
    modalDesc: { color: text, marginBottom: 8 },
    sectionTitle: { color: text, fontWeight: "800", marginTop: 10, marginBottom: 6 },

    review: { paddingVertical: 10, borderTopWidth: 1, borderColor: border, gap: 4 },
    reviewAuthor: { color: text, fontWeight: "800" },
    reviewTime: { color: sub },
    reviewComment: { color: text, lineHeight: 20 },

    modalWrap: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" },
    bookingCard: {
      backgroundColor: cardBg, borderTopLeftRadius: 16, borderTopRightRadius: 16,
      padding: 16, borderTopWidth: 1, borderColor: border,
    },
    fieldLabel: { color: text, fontWeight: "800", marginTop: 10, marginBottom: 6 },
    slotRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    slotChip: {
      paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16,
      borderWidth: 1, borderColor: border, backgroundColor: isDark ? "#0f172a" : "#fff",
    },
    slotChipActive: { backgroundColor: "#e7f7ff", borderColor: "#cfe0ff" },
    slotText: { color: text, fontWeight: "700" },
    slotTextActive: { color: "#1b5cff" },

    input: {
      backgroundColor: isDark ? "#0f172a" : "#fff",
      borderWidth: 1, borderColor: border, borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 10, color: text,
      marginTop: 6,
    },
  });
}
