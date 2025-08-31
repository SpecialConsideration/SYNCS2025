import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';

interface BackButtonLayoutProps {
  children: React.ReactNode;
}

export default function BackButtonLayout({ children }: BackButtonLayoutProps) {
  const router = useRouter();
  const colorScheme = useColorScheme(); // Retrieve the color scheme

  const handleBackPress = () => {
    router.back(); // Navigate to the previous page
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        style={[
          styles.floatingButton,
          { backgroundColor: Colors[colorScheme ?? 'light'].tint },
        ]}
        onPress={handleBackPress}
        activeOpacity={0.8}
      >
        <IconSymbol size={20} name="chevron.left" color="#fff" />
      </TouchableOpacity>

      {/* Page Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingButton: {
    position: 'absolute',
    top: Platform.select({
      ios: 60, // Account for iOS status bar and safe area
      android: (StatusBar.currentHeight || 0) + 16,
    }),
    right: 16, // Align the button to the right
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.tint, // Adjust based on your theme
    elevation: 0, // Remove shadow for Android
  },
  content: {
    flex: 1,
    padding: 16, // Add padding if needed
    backgroundColor: Colors.light.background, // Adjust based on your theme
  },
});