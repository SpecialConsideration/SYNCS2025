import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BackButtonLayout from '../../backButton';

export default function AccountPage() {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push('/(tabs)/pages/account/signUpPage');
  };

  return (
    <BackButtonLayout>
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Account Settings</Text>
        <Text style={styles.subtitle}>Manage your account preferences</Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleNavigation('/(tabs)/pages/account/profilePage')}
        >
          <Text style={styles.buttonText}>Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => handleNavigation('/(tabs)/pages/account/securityPage')}
        >
          <Text style={styles.buttonText}>Security</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => handleNavigation('/(tabs)/pages/account/paymentPage')}
        >
          <Text style={styles.buttonText}>Payment</Text>
        </TouchableOpacity>
      </View>
    </View>
    </BackButtonLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    marginTop: 60,
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
