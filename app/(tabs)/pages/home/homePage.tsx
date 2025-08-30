import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import CustomLayout from '../../CustomLayout';

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export default function AppleMapsPage() {
  const colorScheme = useColorScheme();
  const [region, setRegion] = useState<Region>({
    latitude: -33.8688, // Sydney, Australia default
    longitude: 151.2093,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission denied',
          'Location permission is required to show your current location on the map.'
        );
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      setUserLocation({ latitude, longitude });
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Unable to get your current location');
    }
  };

  const centerOnUser = () => {
    if (userLocation) {
      setRegion({
        ...region,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      });
    } else {
      getCurrentLocation();
    }
  };

  const toggleMapType = () => {
    const types: ('standard' | 'satellite' | 'hybrid')[] = ['standard', 'satellite', 'hybrid'];
    const currentIndex = types.indexOf(mapType);
    const nextIndex = (currentIndex + 1) % types.length;
    setMapType(types[nextIndex]);
  };

  return (
    <CustomLayout>
      <View style={StyleSheet.absoluteFillObject}>
        <StatusBar
          barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
          translucent

        />

        <MapView
          style={StyleSheet.absoluteFillObject} // Full-screen map
          region={region}
          onRegionChangeComplete={setRegion}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          mapType={mapType}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
          rotateEnabled={true}
          pitchEnabled={true}
        >
          {userLocation && (
            <Marker
              coordinate={userLocation}
              title="Your Location"
              description="You are here"
            />
          )}
        </MapView>

        {/* Control buttons */}
        <View style={styles.controlsContainer}>
          {/* Location button */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              { backgroundColor: Colors[colorScheme ?? 'light'].tint },
            ]}
            onPress={centerOnUser}
            activeOpacity={0.8}
          >
            <IconSymbol size={20} name="location.fill" color="#fff" />
          </TouchableOpacity>

          {/* Map type toggle button */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              { backgroundColor: Colors[colorScheme ?? 'light'].tabIconDefault },
            ]}
            onPress={toggleMapType}
            activeOpacity={0.8}
          >
            <IconSymbol size={20} name="map.fill" color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Map type indicator */}
        <View style={styles.mapTypeIndicator}>
          <Text
            style={[
              styles.mapTypeText,
              { color: Colors[colorScheme ?? 'light'].text },
            ]}
          >
            {mapType.charAt(0).toUpperCase() + mapType.slice(1)}
          </Text>
        </View>
      </View>
    </CustomLayout>
  );
}

const styles = StyleSheet.create({
  controlsContainer: {
    position: 'absolute',
    bottom: 40, // Above tab bar area
    right: 16,
    flexDirection: 'column',
    gap: 12,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mapTypeIndicator: {
    position: 'absolute',
    top: Platform.select({
      ios: 60,
      android: (StatusBar.currentHeight || 0) + 16,
    }),
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  mapTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});