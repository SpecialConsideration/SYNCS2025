import * as Location from "expo-location";
import { useEffect, useState } from "react";
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
  View,
} from "react-native";
import MapView, { LatLng, Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import CustomLayout from "../../CustomLayout";

const { width, height } = Dimensions.get("window");

// Add your Mapbox access token here
const MAPBOX_ACCESS_TOKEN = "pk.eyJ1IjoieWVyaWVscGgiLCJhIjoiY21leW9jMWIyMDRucTJqb2VuZjRmaW9uYSJ9.l0LLyWw8CiFWHvvtK-MKpw";

interface MapboxFeature {
  id: string;
  place_name: string;
  center: [number, number]; // [longitude, latitude]
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    address?: string;
  };
}

interface MapboxGeocodingResponse {
  features: MapboxFeature[];
}

interface RouteInfo {
  distance: number; // in meters
  duration: number; // in seconds
}

export default function SearchableRouteMap() {
  const [queryStart, setQueryStart] = useState("");
  const [queryEnd, setQueryEnd] = useState("");
  const [resultsStart, setResultsStart] = useState<MapboxFeature[]>([]);
  const [resultsEnd, setResultsEnd] = useState<MapboxFeature[]>([]);
  const [start, setStart] = useState<LatLng | null>(null);
  const [end, setEnd] = useState<LatLng | null>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [activeSearch, setActiveSearch] = useState<"start" | "end" | null>(null);

  // 🔎 Mapbox Geocoding API
  const searchLocation = async (text: string, type: "start" | "end") => {
    if (text.length < 3) {
      if (type === "start") {
        setResultsStart([]);
      } else {
        setResultsEnd([]);
      }
      setActiveSearch(null);
      return;
    }

    setLoading(true);
    setActiveSearch(type);

    try {
      // Mapbox Geocoding API with Australia bias
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json?` +
        `access_token=${MAPBOX_ACCESS_TOKEN}&` +
        `country=AU&` +
        `limit=5&` +
        `types=place,locality,neighborhood,address,poi`,
        {
          method: "GET",
          headers: {
            "User-Agent": "AccessibleRouteApp/1.0",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: MapboxGeocodingResponse = await response.json();
      
      if (type === "start") {
        setResultsStart(data.features);
      } else {
        setResultsEnd(data.features);
      }

      // Automatically set the location if only one result is returned
      if (data.features.length === 1) {
        const feature = data.features[0];
        const loc: LatLng = {
          latitude: feature.center[1],
          longitude: feature.center[0],
        };
        
        if (type === "start") {
          setStart(loc);
          setResultsStart([]);
        } else {
          setEnd(loc);
          setResultsEnd([]);
        }
        setActiveSearch(null);
      }
    } catch (err) {
      console.error("Search error:", err);
      Alert.alert("Search Error", "Unable to search locations. Please try again.");
      if (type === "start") {
        setResultsStart([]);
      } else {
        setResultsEnd([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // 📍 Get Current Location
  const getCurrentLocation = async (type: "start" | "end") => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Location permission is needed to use current location");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const loc: LatLng = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      if (type === "start") {
        setStart(loc);
        setQueryStart("Current Location");
      } else {
        setEnd(loc);
        setQueryEnd("Current Location");
      }

      Alert.alert("Success", `${type === "start" ? "Start" : "End"} location set to current position`);
    } catch (error) {
      console.error("Location error:", error);
      Alert.alert("Location Error", "Unable to get current location");
    }
  };

  // 🚗 Fetch route using Mapbox Directions API
  useEffect(() => {
    if (!start || !end) {
      setRouteCoords([]);
      setRouteInfo(null);
      return;
    }

    const fetchRoute = async () => {
      setRouteLoading(true);
      try {
        // Mapbox Directions API
        const mapboxUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?` +
          `access_token=${MAPBOX_ACCESS_TOKEN}&` +
          `geometries=geojson&` +
          `overview=full&` +
          `steps=true`;

        const response = await fetch(mapboxUrl, {
          method: "GET",
          headers: {
            "User-Agent": "AccessibleRouteApp/1.0",
          },
        });

        if (!response.ok) {
          throw new Error(`Mapbox Directions API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          
          // Extract coordinates
          const coords = route.geometry.coordinates.map((c: [number, number]) => ({
            latitude: c[1],
            longitude: c[0],
          }));
          
          setRouteCoords(coords);
          
          // Set route info (distance in meters, duration in seconds)
          setRouteInfo({
            distance: route.distance,
            duration: route.duration,
          });
        } else {
          setRouteCoords([start, end]);
          setRouteInfo(null);
          Alert.alert("Route Notice", "Using straight line route as detailed routing is unavailable");
        }
      } catch (err) {
        console.error("Routing error:", err);
        setRouteCoords([start, end]);
        setRouteInfo(null);
        Alert.alert("Routing Fallback", "Detailed routing unavailable. Showing direct line between points.");
      } finally {
        setRouteLoading(false);
      }
    };

    fetchRoute();
  }, [start, end]);

  // 🖱️ Handle picking from search
  const handlePick = (item: MapboxFeature, type: "start" | "end") => {
    const loc: LatLng = {
      latitude: item.center[1],
      longitude: item.center[0],
    };

    if (type === "start") {
      setStart(loc);
      setQueryStart(item.place_name);
      setResultsStart([]);
    } else {
      setEnd(loc);
      setQueryEnd(item.place_name);
      setResultsEnd([]);
    }

    setActiveSearch(null);
    Keyboard.dismiss();
  };

  // Clear location
  const clearLocation = (type: "start" | "end") => {
    if (type === "start") {
      setStart(null);
      setQueryStart("");
      setResultsStart([]);
    } else {
      setEnd(null);
      setQueryEnd("");
      setResultsEnd([]);
    }
    setActiveSearch(null);
  };

  // Format duration for display
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Format distance for display
  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  const currentResults = activeSearch === "start" ? resultsStart : resultsEnd;

  return (
    <CustomLayout>
      <View style={styles.container}>
        <MapView
          provider={PROVIDER_DEFAULT}
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
            <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="#007AFF" />
          )}
        </MapView>

        {/* Search Container */}
        <View style={styles.searchContainer}>
          {/* Start Location */}
          <View style={styles.locationSection}>
            <Text style={styles.searchTitle}>Start Location</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Search start location"
                value={queryStart}
                onChangeText={(text) => {
                  setQueryStart(text);
                  searchLocation(text, "start");
                }}
                onFocus={() => setActiveSearch("start")}
              />
              <TouchableOpacity
                style={styles.locationButton}
                onPress={() => getCurrentLocation("start")}
              >
                <Text style={styles.locationButtonText}>📍</Text>
              </TouchableOpacity>
              {start && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => clearLocation("start")}
                >
                  <Text style={styles.clearButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* End Location */}
          <View style={styles.locationSection}>
            <Text style={styles.searchTitle}>End Location</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Search end location"
                value={queryEnd}
                onChangeText={(text) => {
                  setQueryEnd(text);
                  searchLocation(text, "end");
                }}
                onFocus={() => setActiveSearch("end")}
              />
              <TouchableOpacity
                style={styles.locationButton}
                onPress={() => getCurrentLocation("end")}
              >
                <Text style={styles.locationButtonText}>📍</Text>
              </TouchableOpacity>
              {end && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => clearLocation("end")}
                >
                  <Text style={styles.clearButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Route Info */}
          {routeInfo && (
            <View style={styles.routeInfoContainer}>
              <Text style={styles.routeInfoText}>
                🚗 {formatDistance(routeInfo.distance)} • {formatDuration(routeInfo.duration)}
                {routeLoading && " (updating...)"}
              </Text>
            </View>
          )}

          {/* Loading Indicator */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          )}

          {/* Search Results */}
          {currentResults.length > 0 && activeSearch && (
            <FlatList
              data={currentResults}
              keyExtractor={(item) => item.id}
              style={styles.resultsList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.result}
                  onPress={() => handlePick(item, activeSearch)}
                >
                  <Text numberOfLines={2} style={styles.resultText}>
                    {item.place_name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </CustomLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width, height },
  searchContainer: {
    position: "absolute",
    top: 100,
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
    maxHeight: height * 0.7,
  },
  locationSection: {
    marginBottom: 16,
  },
  searchTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  locationButton: {
    padding: 12,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    minWidth: 44,
    alignItems: "center",
  },
  locationButtonText: {
    fontSize: 16,
    color: "white",
  },
  clearButton: {
    padding: 12,
    backgroundColor: "#FF3B30",
    borderRadius: 8,
    minWidth: 44,
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "bold",
  },
  routeInfoContainer: {
    backgroundColor: "#f0f8ff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  routeInfoText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
    textAlign: "center",
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
  resultText: {
    fontSize: 15,
    color: "#333",
  },
});