import { router } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SignUpPage({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    disability: '',
  });
  const [showDisabilityPicker, setShowDisabilityPicker] = useState(false);

  const disabilityOptions = [
    { value: 'none', label: 'No disability' },
    { value: 'visual', label: 'Visual impairment' },
    { value: 'hearing', label: 'Hearing impairment' },
    { value: 'mobility', label: 'Mobility impairment' },
    { value: 'cognitive', label: 'Cognitive disability' },
    { value: 'speech', label: 'Speech impairment' },
    { value: 'multiple', label: 'Multiple disabilities' },
    { value: 'other', label: 'Other' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' },
  ];

  const handleBackLogin = () => {
    console.log('back to login pressed');
    router.push('/'); // Navigate to the login page
  };

  const handleBack = () => {
    console.log('back pressed');
    router.back() // Navigate to the last page
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDisabilitySelect = (value: string) => {
    handleInputChange('disability', value);
    setShowDisabilityPicker(false);
  };

  const getDisabilityLabel = () => {
    const option = disabilityOptions.find((opt) => opt.value === formData.disability);
    return option ? option.label : 'Select accessibility needs';
  };

  const handleSubmit = () => {
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // Handle signup logic here
    console.log('Signup attempt:', formData);
    Alert.alert('Success', 'Account created successfully!');
    router.push('/(tabs)/pages/home/homePage');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Account</Text>
      </View>

      {/* Form */}
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.description}>Fill in your information to get started</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            placeholder="First name"
            value={formData.firstName}
            onChangeText={(value) => handleInputChange('firstName', value)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Last name"
            value={formData.lastName}
            onChangeText={(value) => handleInputChange('lastName', value)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date of Birth</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={formData.dateOfBirth}
            onChangeText={(value) => handleInputChange('dateOfBirth', value)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Accessibility Needs</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowDisabilityPicker(true)}
          >
            <Text style={styles.dropdownText}>
              {getDisabilityLabel()}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Create a password"
            value={formData.password}
            onChangeText={(value) => handleInputChange('password', value)}
            secureTextEntry
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChangeText={(value) => handleInputChange('confirmPassword', value)}
            secureTextEntry
          />
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Create Account</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleBackLogin()}>
          <Text style={styles.switchToLoginText}>Already have an account? Sign in</Text>
        </TouchableOpacity>
      </View>

      {/* Disability Picker Modal */}
      <Modal visible={showDisabilityPicker} transparent animationType="slide">
        <Pressable style={styles.modalBackdrop} onPress={() => setShowDisabilityPicker(false)} />
        <View style={styles.modal}>
          {disabilityOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={styles.modalOption}
              onPress={() => handleDisabilitySelect(option.value)}
            >
              <Text style={styles.modalOptionText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 18,
    color: '#007BFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  form: {
    padding: 16,
  },
  description: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#666',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    color: '#333',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  dropdown: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  dropdownText: {
    color: '#333',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  submitButton: {
    backgroundColor: '#007BFF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchToLoginText: {
    textAlign: 'center',
    color: '#007BFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
    padding: 16,
  },
  modalOption: {
    paddingVertical: 12,
  },
  modalOptionText: {
    fontSize: 16,
  },
});