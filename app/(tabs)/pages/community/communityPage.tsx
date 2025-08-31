// CommunityScreen.tsx
import { useNavigation } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from "react-native";

// --- Types
type User = { id: string; name: string };
type Post = {
  id: string;
  author: User;
  content: string;
  createdAt: number; // epoch ms
  tags: string[];
  likes: number;
  replies: number;
  replyToId?: string;
  cw?: string; // content warning text
};

// --- Helpers
const uid = () => Math.random().toString(36).slice(2);
const now = () => Date.now();

function timeAgo(ts: number): string {
  const s = Math.floor((now() - ts) / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7);
  return `${w}w`;
}

const DEFAULT_TAGS = ["All", "Mobility", "Blind", "Deaf", "Neurodiverse", "Caregivers", "Accessibility"] as const;

// --- Sample data
const seedAuthor: User = { id: "u1", name: "Alex" };
const sample: Post[] = [
  {
    id: uid(),
    author: { id: "u2", name: "Sam" },
    content:
      "Does anyone know if the new station entrance has a lift? Trying to plan tomorrow’s commute. #Mobility",
    createdAt: now() - 1000 * 60 * 22,
    tags: ["Mobility", "Accessibility"],
    likes: 4,
    replies: 2,
  },
  {
    id: uid(),
    author: { id: "u3", name: "Priya" },
    content:
      "Heads up: temporary ramp near Town Hall is a bit steep. Take care. #Mobility",
    createdAt: now() - 1000 * 60 * 47,
    tags: ["Mobility"],
    likes: 8,
    replies: 3,
  },
  {
    id: uid(),
    author: { id: "u4", name: "Jordan" },
    content:
      "App rec: Be My Eyes has been super helpful this week. #Blind",
    createdAt: now() - 1000 * 60 * 60 * 5,
    tags: ["Blind", "Accessibility"],
    likes: 12,
    replies: 4,
  },
];

// --- Main Screen
export default function CommunityScreen() {
  const nav = useNavigation();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const [posts, setPosts] = useState<Post[]>(sample);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTag, setActiveTag] = useState<typeof DEFAULT_TAGS[number]>("All");

  // Compose state
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeText, setComposeText] = useState("");
  const [composeTags, setComposeTags] = useState<string[]>([]);
  const [composeCW, setComposeCW] = useState<string | undefined>(undefined);
  const [replyTo, setReplyTo] = useState<Post | undefined>(undefined);

  const CHARACTER_LIMIT = 500;

  const styles = useMemo(() => getStyles(isDark), [isDark]);

  const filtered = posts.filter((p) =>
    activeTag === "All" ? true : p.tags.includes(activeTag)
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 650);
  }, []);

  const toggleLike = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, likes: Math.max(0, p.likes + 1) } : p
      )
    );
  }, []);

  const openReply = useCallback((p: Post) => {
    setReplyTo(p);
    setComposeOpen(true);
    setComposeText(`@${p.author.name} `);
    setComposeTags(p.tags);
  }, []);

  const openCompose = useCallback(() => {
    setReplyTo(undefined);
    setComposeText("");
    setComposeTags([]);
    setComposeCW(undefined);
    setComposeOpen(true);
  }, []);

  const toggleComposeTag = useCallback((tag: string) => {
    setComposeTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const toggleCW = useCallback(() => {
    setComposeCW((cw) => (cw ? undefined : "Content note"));
  }, []);

  const submitPost = useCallback(() => {
    const text = composeText.trim();
    if (!text) {
      Alert.alert("Empty post", "Please write something before posting.");
      return;
    }
    if (text.length > CHARACTER_LIMIT) {
      Alert.alert("Too long", `Limit is ${CHARACTER_LIMIT} characters.`);
      return;
    }
    const newPost: Post = {
      id: uid(),
      author: seedAuthor,
      content: text,
      createdAt: now(),
      tags: composeTags.length ? composeTags : ["Accessibility"],
      likes: 0,
      replies: 0,
      replyToId: replyTo?.id,
      cw: composeCW,
    };
    setPosts((prev) => [newPost, ...prev]);
    setComposeOpen(false);
    setComposeText("");
    setComposeTags([]);
    setComposeCW(undefined);
    setReplyTo(undefined);
  }, [composeText, composeTags, composeCW, replyTo]);

  const renderPost = ({ item }: { item: Post }) => {
    const muted = !!item.cw;
    return (
      <View style={styles.card} accessible accessibilityRole="summary">
        <View style={styles.cardHeader}>
          <Text style={styles.author} accessibilityRole="text">
            {item.author.name}
          </Text>
          <Text style={styles.time} accessibilityRole="text">
            · {timeAgo(item.createdAt)}
          </Text>
        </View>

        {item.replyToId ? (
          <Text style={styles.replyBadge} accessibilityHint="This is a reply">
            ↳ reply
          </Text>
        ) : null}

        {muted ? (
          <Pressable
            onPress={() => {
              // reveal on press (just remove cw for this render)
              setPosts((prev) =>
                prev.map((p) =>
                  p.id === item.id ? { ...p, cw: undefined } : p
                )
              );
            }}
            style={styles.cw}
            accessibilityRole="button"
            accessibilityLabel="Content note"
            accessibilityHint="Double tap to reveal post content"
          >
            <Text style={styles.cwText}>
              ⚠️ {item.cw} — tap to reveal
            </Text>
          </Pressable>
        ) : (
          <Text style={styles.content}>{item.content}</Text>
        )}

        <View style={styles.tagRow}>
          {item.tags.map((t) => (
            <View key={t} style={styles.tag}>
              <Text style={styles.tagText}>#{t}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => toggleLike(item.id)}
            style={styles.actionBtn}
            accessibilityRole="button"
            accessibilityLabel={`Support. ${item.likes} supports`}
          >
            <Text style={styles.actionEmoji}>👏</Text>
            <Text style={styles.actionText}>{item.likes}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => openReply(item)}
            style={styles.actionBtn}
            accessibilityRole="button"
            accessibilityLabel={`Reply. ${item.replies} replies`}
          >
            <Text style={styles.actionEmoji}>💬</Text>
            <Text style={styles.actionText}>{item.replies}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              Alert.alert("Report", "Thanks, a moderator will review.")
            }
            style={styles.actionBtn}
            accessibilityRole="button"
            accessibilityLabel="Report post"
          >
            <Text style={styles.actionEmoji}>🚩</Text>
            <Text style={styles.actionText}>Report</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (typeof (nav as any).goBack === "function" ? (nav as any).goBack() : null)}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Community</Text>
        <View style={{ width: 64 }} />
      </View>

      {/* Tag filters */}
      <View style={styles.filterRow}>
        <FlatList
          data={DEFAULT_TAGS as unknown as string[]}
          keyExtractor={(t) => t}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12 }}
          renderItem={({ item: t }) => (
            <TouchableOpacity
              onPress={() => setActiveTag(t as any)}
              style={[
                styles.filterChip,
                activeTag === t && styles.filterChipActive,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${t}`}
              accessibilityState={{ selected: activeTag === t }}
            >
              <Text
                style={[
                  styles.filterText,
                  activeTag === t && styles.filterTextActive,
                ]}
              >
                #{t}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Feed */}
      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        renderItem={renderPost}
        contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 12 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={{ padding: 32, alignItems: "center" }}>
            <Text style={styles.emptyText}>
              No posts for #{activeTag}. Be the first!
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        onPress={openCompose}
        activeOpacity={0.9}
        style={styles.fab}
        accessibilityRole="button"
        accessibilityLabel="Compose a new post"
      >
        <Text style={styles.fabIcon}>✍️</Text>
        <Text style={styles.fabText}>Post</Text>
      </TouchableOpacity>

      {/* Compose modal */}
      <Modal visible={composeOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: "padding", android: undefined })}
          style={styles.modalWrap}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {replyTo ? `Replying to ${replyTo.author.name}` : "New post"}
            </Text>

            {/* Content warning toggle */}
            <Pressable
              onPress={toggleCW}
              style={[styles.cwToggle, composeCW && styles.cwToggleActive]}
              accessibilityRole="button"
              accessibilityLabel={
                composeCW ? "Remove content note" : "Add content note"
              }
            >
              <Text
                style={[
                  styles.cwToggleText,
                  composeCW && styles.cwToggleTextActive,
                ]}
              >
                {composeCW ? "⚠️ Content note on" : "Add content note"}
              </Text>
            </Pressable>

            {composeCW && (
              <TextInput
                value={composeCW}
                onChangeText={setComposeCW}
                placeholder="Brief note (e.g., construction injury mention)"
                style={styles.cwInput}
              />
            )}

            {/* Body */}
            <TextInput
              value={composeText}
              onChangeText={setComposeText}
              placeholder="Share tips, ask questions, support others…"
              style={styles.composeInput}
              multiline
              maxLength={CHARACTER_LIMIT}
            />
            <Text style={styles.counter}>
              {composeText.length} / {CHARACTER_LIMIT}
            </Text>

            {/* Tag chooser */}
            <View style={styles.tagChooser}>
              <Text style={styles.tagChooserTitle}>Add tags</Text>
              <View style={styles.tagChooserRow}>
                {DEFAULT_TAGS.filter((t) => t !== "All").map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => toggleComposeTag(t)}
                    style={[
                      styles.tChip,
                      composeTags.includes(t) && styles.tChipActive,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Toggle tag ${t}`}
                  >
                    <Text
                      style={[
                        styles.tChipText,
                        composeTags.includes(t) && styles.tChipTextActive,
                      ]}
                    >
                      #{t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setComposeOpen(false);
                  setComposeText("");
                  setComposeTags([]);
                  setComposeCW(undefined);
                  setReplyTo(undefined);
                }}
                style={[styles.mBtn, styles.mBtnGhost]}
                accessibilityRole="button"
                accessibilityLabel="Cancel posting"
              >
                <Text style={styles.mBtnGhostText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitPost}
                style={[styles.mBtn, styles.mBtnPrimary]}
                accessibilityRole="button"
                accessibilityLabel="Post"
              >
                <Text style={styles.mBtnPrimaryText}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// --- Styles
function getStyles(isDark: boolean) {
  const text = isDark ? "#eaf0ff" : "#0f172a";
  const sub = isDark ? "#aab4d4" : "#6b7280";
  const cardBg = isDark ? "#111827" : "#ffffff";
  const bg = isDark ? "#0b1220" : "#f7fafc";
  const border = isDark ? "#1f2937" : "#e5e7eb";

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
    backBtn: {
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 8,
    },
    backText: { color: "#3b82f6", fontWeight: "700", fontSize: 16 },
    title: { color: text, fontSize: 22, fontWeight: "800" },

    filterRow: { paddingVertical: 8, borderBottomWidth: 1, borderColor: border },
    filterChip: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginRight: 8,
      borderRadius: 16,
      backgroundColor: isDark ? "#0f172a" : "#eef2ff",
    },
    filterChipActive: {
      backgroundColor: "#1b5cff",
    },
    filterText: { color: isDark ? "#cbd5e1" : "#3843a3", fontWeight: "700" },
    filterTextActive: { color: "#fff" },

    card: {
      backgroundColor: cardBg,
      borderRadius: 14,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: border,
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.2 : 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
    author: { color: text, fontWeight: "800", fontSize: 16 },
    time: { color: sub, marginLeft: 6 },

    content: { color: text, fontSize: 16, lineHeight: 22, marginTop: 4 },

    tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
    tag: {
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 12,
      backgroundColor: isDark ? "#172554" : "#eef2ff",
    },
    tagText: { color: isDark ? "#c7d2fe" : "#3843a3", fontSize: 12, fontWeight: "700" },

    actions: { flexDirection: "row", gap: 12, marginTop: 10 },
    actionBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: border,
    },
    actionEmoji: { fontSize: 16 },
    actionText: { color: text, fontWeight: "700" },

    emptyText: { color: sub },

    fab: {
      position: "absolute",
      right: 16,
      bottom: 24,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: "#1b5cff",
      borderRadius: 999,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    fabIcon: { fontSize: 18, color: "#fff" },
    fabText: { color: "#fff", fontWeight: "800" },

    modalWrap: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" },
    modalCard: {
      backgroundColor: cardBg,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      padding: 16,
      borderTopWidth: 1,
      borderColor: border,
    },
    modalTitle: { color: text, fontSize: 18, fontWeight: "800", marginBottom: 12 },

    cwToggle: {
      alignSelf: "flex-start",
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: isDark ? "#0f172a" : "#f8fafc",
      marginBottom: 8,
    },
    cwToggleActive: { backgroundColor: isDark ? "#2f1f1f" : "#fff5f5", borderColor: isDark ? "#7f1d1d" : "#fecaca" },
    cwToggleText: { color: text, fontWeight: "700" },
    cwToggleTextActive: { color: isDark ? "#fecaca" : "#b91c1c" },
    cwInput: {
      borderWidth: 1,
      borderColor: border,
      borderRadius: 10,
      padding: 10,
      color: text,
      marginBottom: 8,
      backgroundColor: isDark ? "#0f172a" : "#fff",
    },

    composeInput: {
      minHeight: 120,
      borderWidth: 1,
      borderColor: border,
      borderRadius: 12,
      padding: 12,
      textAlignVertical: "top",
      color: text,
      backgroundColor: isDark ? "#0f172a" : "#fff",
    },
    counter: { alignSelf: "flex-end", color: sub, marginTop: 6 },

    tagChooser: { marginTop: 8 },
    tagChooserTitle: { color: text, fontWeight: "800", marginBottom: 6 },
    tagChooserRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    tChip: {
      borderWidth: 1,
      borderColor: border,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 16,
      backgroundColor: isDark ? "#0b1220" : "#fff",
    },
    tChipActive: { backgroundColor: "#e7f7ff", borderColor: "#cfe0ff" },
    tChipText: { color: text },
    tChipTextActive: { color: "#1b5cff", fontWeight: "800" },

    modalActions: { flexDirection: "row", gap: 12, marginTop: 14 },
    mBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
    mBtnGhost: { backgroundColor: isDark ? "#0f172a" : "#f6f6f6", borderWidth: 1, borderColor: border },
    mBtnGhostText: { color: text, fontWeight: "800" },
    mBtnPrimary: { backgroundColor: "#1b5cff" },
    mBtnPrimaryText: { color: "#fff", fontWeight: "800" },

    cw: {
      marginTop: 4,
      borderWidth: 1,
      borderColor: isDark ? "#7f1d1d" : "#fecaca",
      backgroundColor: isDark ? "#2f1f1f" : "#fff5f5",
      borderRadius: 10,
      padding: 10,
    },
    cwText: { color: isDark ? "#fecaca" : "#7f1d1d", fontWeight: "700" },

    replyBadge: {
      alignSelf: "flex-start",
      backgroundColor: isDark ? "#0f172a" : "#eef2ff",
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      color: isDark ? "#c7d2fe" : "#3843a3",
      marginBottom: 6,
      overflow: "hidden",
    },
  });
}
