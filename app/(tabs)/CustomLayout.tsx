import { Platform, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { router } from 'expo-router';

interface CustomLayoutProps {
  children: React.ReactNode; // Accept children as a prop
}

export default function CustomLayout({ children }: CustomLayoutProps) {
  const colorScheme = useColorScheme();

  const handleLeftButtonPress = () => {
    console.log('Left floating button pressed');
    // Add your left button functionality here (e.g., notifications, menu)
    router.push('/(tabs)/pages/account/accountPage');
  };

  const handleRightButtonPress = () => {
    console.log('Right floating button pressed');
    // Add your right button functionality here (e.g., search, settings)
  };

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent" // Ensure no background color is added
        barStyle="dark-content"
      />
      {/* Render children inside the layout */}
      {children}

      {/* Floating buttons overlay */}
      <View style={styles.floatingButtonsContainer}>
        {/* Left floating button */}
        <TouchableOpacity
          style={[
            styles.floatingButton,
            styles.leftButton,
            { backgroundColor: Colors[colorScheme ?? 'light'].tint },
          ]}
          onPress={handleLeftButtonPress}
          activeOpacity={0.8}
        >
          <IconSymbol size={20} name="person.fill" color="#fff" />
        </TouchableOpacity>

        {/* Right floating button */}
        <TouchableOpacity
          style={[
            styles.floatingButton,
            styles.rightButton,
            { backgroundColor: Colors[colorScheme ?? 'light'].tint },
          ]}
          onPress={handleRightButtonPress}
          activeOpacity={0.8}
        >
          <IconSymbol size={20} name="list.dash" color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingButtonsContainer: {
    position: 'absolute',
    top: -70,
    left: 0,
    right: 0,
    height: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
    paddingTop: Platform.select({
      ios: 60, // Account for iOS status bar and safe area
      android: (StatusBar.currentHeight || 0) + 16,
    }),
    paddingHorizontal: 16,
    pointerEvents: 'box-none', // Allow touches to pass through container
    zIndex: 1000, // Ensure buttons appear above all content
  },
  floatingButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    pointerEvents: 'auto', // Enable touches for buttons
  },
  leftButton: {
    // Additional styling for left button if needed
  },
  rightButton: {
    // Additional styling for right button if needed
  },
});