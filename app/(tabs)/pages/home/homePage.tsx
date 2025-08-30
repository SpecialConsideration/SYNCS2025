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

interface SearchResult {
  lat: string;
  lon: string;
  display_name: string;
  place_id: string;
}

export default function SearchableRouteMap() {
  const [queryStart, setQueryStart] = useState("");
  const [queryEnd, setQueryEnd] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [start, setStart] = useState<LatLng | null>(null);
  const [end, setEnd] = useState<LatLng | null>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [loading, setLoading] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);

  // 🔎 Search API
  const searchLocation = async (text: string, type: "start" | "end") => {
    if (text.length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&limit=5&countrycodes=au`,
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

      const data = await response.json();
      setResults(data);

      // Automatically set the location if only one result is returned
      if (data.length === 1) {
        const loc: LatLng = {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        };
        if (type === "start") {
          setStart(loc);
        } else {
          setEnd(loc);
        }
        setResults([]);
      }
    } catch (err) {
      console.error("Search error:", err);
      Alert.alert("Search Error", "Unable to search locations. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // 📍 Get Current Location
  const useCurrentLocation = async (type: "start" | "end") => {
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
      } else {
        setEnd(loc);
      }

      Alert.alert("Success", `${type === "start" ? "Start" : "End"} location set to current position`);
    } catch (error) {
      console.error("Location error:", error);
      Alert.alert("Location Error", "Unable to get current location");
    }
  };

  // 🚗 Fetch route when both points exist
  useEffect(() => {
    if (!start || !end) {
      setRouteCoords([]);
      return;
    }

    const fetchRoute = async () => {
      setRouteLoading(true);
      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`;

        const response = await fetch(osrmUrl, {
          method: "GET",
          headers: {
            "User-Agent": "AccessibleRouteApp/1.0",
          },
        });

        if (!response.ok) {
          throw new Error(`OSRM API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map((c: [number, number]) => ({
            latitude: c[1],
            longitude: c[0],
          }));
          setRouteCoords(coords);
        } else {
          setRouteCoords([start, end]);
          Alert.alert("Route Notice", "Using straight line route as detailed routing is unavailable");
        }
      } catch (err) {
        console.error("Routing error:", err);
        setRouteCoords([start, end]);
        Alert.alert("Routing Fallback", "Detailed routing unavailable. Showing direct line between points.");
      } finally {
        setRouteLoading(false);
      }
    };

    fetchRoute();
  }, [start, end]);

  // 🖱️ Handle picking from search
  const handlePick = (item: SearchResult, type: "start" | "end") => {
    const loc: LatLng = {
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    };

    if (type === "start") {
      setStart(loc);
    } else {
      setEnd(loc);
    }

    setResults([]);
    Keyboard.dismiss();
  };

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
            <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="blue" />
          )}
        </MapView>

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchTitle}>Search Start Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Search start location"
            value={queryStart}
            onChangeText={(text) => {
              setQueryStart(text);
              searchLocation(text, "start");
            }}
          />

          <Text style={styles.searchTitle}>Search End Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Search end location"
            value={queryEnd}
            onChangeText={(text) => {
              setQueryEnd(text);
              searchLocation(text, "end");
            }}
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
                  onPress={() => handlePick(item, queryStart ? "start" : "end")}
                >
                  <Text numberOfLines={2}>{item.display_name}</Text>
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
    marginBottom: 8,
  },
  input: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 16,
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
});