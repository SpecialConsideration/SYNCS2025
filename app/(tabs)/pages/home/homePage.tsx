<<<<<<< HEAD:app/(tabs)/index.tsx
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
=======
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
>>>>>>> master:app/(tabs)/pages/home/homePage.tsx
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
<<<<<<< HEAD:app/(tabs)/index.tsx
  View
} from "react-native";
import MapView, { LatLng, Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
=======
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import CustomLayout from '../../CustomLayout';
>>>>>>> master:app/(tabs)/pages/home/homePage.tsx

const { width, height } = Dimensions.get("window");

interface SearchResult {
  lat: string;
  lon: string;
  display_name: string;
  place_id: string;
}

<<<<<<< HEAD:app/(tabs)/index.tsx
export default function SearchableRouteMap() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [start, setStart] = useState<LatLng | null>(null);
  const [end, setEnd] = useState<LatLng | null>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [selecting, setSelecting] = useState<"start" | "end">("start");
  const [loading, setLoading] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
=======
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
>>>>>>> master:app/(tabs)/pages/home/homePage.tsx

  // 🔎 Search API using fetch instead of axios
  const searchLocation = async (text: string) => {
    setQuery(text);
    if (text.length < 3) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&limit=5&countrycodes=au`,
        {
          method: 'GET',
          headers: {
            'User-Agent': 'AccessibleRouteApp/1.0'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error("Search error:", err);
      Alert.alert("Search Error", "Unable to search locations. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // 📍 Get Current Location
  const useCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Location permission is needed to use current location");
        return;
      }
<<<<<<< HEAD:app/(tabs)/index.tsx
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
=======

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      setUserLocation({ latitude, longitude });
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
>>>>>>> master:app/(tabs)/pages/home/homePage.tsx
      });
      
      const loc: LatLng = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      if (selecting === "start") {
        setStart(loc);
      } else {
        setEnd(loc);
      }
      
      Alert.alert("Success", `${selecting === "start" ? "Start" : "End"} location set to current position`);
    } catch (error) {
      console.error("Location error:", error);
      Alert.alert("Location Error", "Unable to get current location");
    }
  };

  // 🚗 Fetch route using fetch instead of axios
  const fetchRoute = async (startPoint: LatLng, endPoint: LatLng) => {
    setRouteLoading(true);
    try {
      // Try OSRM first
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startPoint.longitude},${startPoint.latitude};${endPoint.longitude},${endPoint.latitude}?overview=full&geometries=geojson`;
      
      const response = await fetch(osrmUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'AccessibleRouteApp/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`OSRM API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const coords = data.routes[0].geometry.coordinates.map(
          (c: [number, number]) => ({
            latitude: c[1],
            longitude: c[0],
          })
        );
        setRouteCoords(coords);
      } else {
        // Fallback to simple straight line
        setRouteCoords([startPoint, endPoint]);
        Alert.alert("Route Notice", "Using straight line route as detailed routing is unavailable");
      }
    } catch (err) {
      console.error("Routing error:", err);
      
      // Fallback to simple straight line between points
      setRouteCoords([startPoint, endPoint]);
      Alert.alert(
        "Routing Fallback", 
        "Detailed routing unavailable. Showing direct line between points."
      );
    } finally {
      setRouteLoading(false);
    }
  };

  // 🚗 Fetch route when both points exist
  useEffect(() => {
    if (!start || !end) {
      setRouteCoords([]);
      return;
    }
    fetchRoute(start, end);
  }, [start, end]);

  // 🖱️ Handle picking from search
  const handlePick = (item: SearchResult) => {
    const loc: LatLng = {
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    };
    
    if (selecting === "start") {
      setStart(loc);
    } else {
      setEnd(loc);
    }
    
    setResults([]);
    setQuery("");
    Keyboard.dismiss();
  };

  // Quick location presets for Sydney
  const quickLocations = [
    { name: "Sydney Opera House", lat: -33.8568, lon: 151.2153 },
    { name: "Sydney Harbour Bridge", lat: -33.8523, lon: 151.2108 },
    { name: "Circular Quay", lat: -33.8599, lon: 151.2111 },
    { name: "Darling Harbour", lat: -33.8688, lon: 151.2018 },
    { name: "Central Station", lat: -33.8839, lon: 151.2065 },
  ];

  const setQuickLocation = (location: any) => {
    const loc: LatLng = {
      latitude: location.lat,
      longitude: location.lon,
    };
    
    if (selecting === "start") {
      setStart(loc);
    } else {
      setEnd(loc);
    }
  };

  return (
<<<<<<< HEAD:app/(tabs)/index.tsx
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_DEFAULT} // Apple Maps on iOS
        style={styles.map}
        initialRegion={{
          latitude: -33.8568,
          longitude: 151.2153,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {start && <Marker coordinate={start} title="Start" pinColor="green" />}
        {end && <Marker coordinate={end} title="End" pinColor="red" />}
        {routeCoords.length > 0 && (
          <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="blue" />
        )}
      </MapView>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchTitle}>
          Select {selecting === "start" ? "Start" : "End"} Location
        </Text>
        
        <TextInput
          style={styles.input}
          placeholder={`Search ${selecting === "start" ? "start" : "end"} location`}
          value={query}
          onChangeText={searchLocation}
        />
        
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}
        
        {results.length > 0 && (
          <FlatList
            data={results}
            keyExtractor={(item) => item.place_id}
            style={styles.resultsList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.result}
                onPress={() => handlePick(item)}
              >
                <Text numberOfLines={2}>{item.display_name}</Text>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Quick locations */}
        <Text style={styles.quickTitle}>Quick Locations:</Text>
        <View style={styles.quickButtons}>
          {quickLocations.map((location, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickButton}
              onPress={() => setQuickLocation(location)}
            >
              <Text style={styles.quickButtonText}>{location.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, styles.switchButton]}
          onPress={() => setSelecting(selecting === "start" ? "end" : "start")}
        >
          <Text style={styles.controlButtonText}>
            Set {selecting === "start" ? "End" : "Start"}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.controlButton, styles.locationButton]}
          onPress={useCurrentLocation}
        >
          <Text style={styles.controlButtonText}>Current Location</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.controlButton, styles.resetButton]}
          onPress={() => {
            setStart(null);
            setEnd(null);
            setRouteCoords([]);
            setSelecting("start");
            setQuery("");
            setResults([]);
          }}
        >
          <Text style={styles.controlButtonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Route status */}
      {routeLoading && (
        <View style={styles.routeStatus}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.routeStatusText}>Planning route...</Text>
        </View>
      )}

      {/* Route info */}
      {start && end && routeCoords.length > 0 && (
        <View style={styles.routeInfo}>
          <Text style={styles.routeInfoText}>
            Route: {start ? "Start set" : "No start"} → {end ? "End set" : "No end"}
          </Text>
        </View>
      )}
    </View>
=======
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
>>>>>>> master:app/(tabs)/pages/home/homePage.tsx
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD:app/(tabs)/index.tsx
  container: { flex: 1 },
  map: { width, height },
  searchContainer: {
    position: "absolute",
    top: 50,
    left: 10,
    right: 10,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    maxHeight: height * 0.6,
  },
  searchTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  input: { 
    padding: 12, 
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    fontSize: 16,
=======
  controlsContainer: {
    position: 'absolute',
    bottom: 40, // Above tab bar area
    right: 16,
    flexDirection: 'column',
    gap: 12,
>>>>>>> master:app/(tabs)/pages/home/homePage.tsx
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  loadingText: {
    marginLeft: 8,
    color: "#666",
  },
  resultsList: {
    maxHeight: 200,
    marginTop: 8,
  },
  result: { 
    padding: 12, 
    borderBottomWidth: 1, 
    borderColor: "#eee",
    backgroundColor: "#f9f9f9",
    marginVertical: 2,
    borderRadius: 6,
  },
  quickTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  quickButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 4,
    marginBottom: 4,
  },
  quickButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  controls: {
    position: "absolute",
    bottom: 40,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  controlButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  switchButton: {
    backgroundColor: "#34C759",
  },
  locationButton: {
    backgroundColor: "#007AFF",
  },
  resetButton: {
    backgroundColor: "#FF3B30",
  },
  controlButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  routeStatus: {
    position: "absolute",
    top: height * 0.7,
    left: 10,
    right: 10,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  routeStatusText: {
    marginLeft: 8,
    color: "#666",
  },
  routeInfo: {
    position: "absolute",
    bottom: 120,
    left: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 12,
    borderRadius: 8,
  },
  routeInfoText: {
    color: "white",
    textAlign: "center",
    fontSize: 14,
  },
});