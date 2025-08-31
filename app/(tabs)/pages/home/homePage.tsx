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
import MapView, {
  Callout,
  LatLng,
  Marker,
  Polyline,
  PROVIDER_DEFAULT,
} from "react-native-maps";
import CustomLayout from "../../CustomLayout";

const { width, height } = Dimensions.get("window");

// Add your Mapbox access token here
const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1IjoieWVyaWVscGgiLCJhIjoiY21leW9jMWIyMDRucTJqb2VuZjRmaW9uYSJ9.l0LLyWw8CiFWHvvtK-MKpw";

interface MapboxFeature {
  id: string;
  place_name: string;
  center: [number, number]; // [longitude, latitude]
  geometry: { coordinates: [number, number] };
  properties: { address?: string };
}
interface MapboxGeocodingResponse { features: MapboxFeature[]; }
interface RouteInfo { distance: number; duration: number; }

// ♿ datasets
type ParkingMeta = { coord: LatLng; address?: string; spaces?: number; sign?: string };
type PoiMeta = { coord: LatLng; name?: string; note?: string };

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

  // Layer toggles
  const [showAccessibleParking, setShowAccessibleParking] = useState(true);
  const [showLifts, setShowLifts] = useState(true);
  const [showStairs, setShowStairs] = useState(true);

  // Layer data
  const [accessibleParkingMeta, setAccessibleParkingMeta] = useState<ParkingMeta[]>([]);
  const [liftsMeta, setLiftsMeta] = useState<PoiMeta[]>([]);
  const [stairsMeta, setStairsMeta] = useState<PoiMeta[]>([]);

  // 🔎 Mapbox Geocoding
  const searchLocation = async (text: string, type: "start" | "end") => {
    if (text.length < 3) {
      if (type === "start") setResultsStart([]);
      else setResultsEnd([]);
      setActiveSearch(null);
      return;
    }
  
    setLoading(true);
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json?` +
        `access_token=${MAPBOX_ACCESS_TOKEN}&country=AU&limit=5&types=place,locality,neighborhood,address,poi`;
  
      const response = await fetch(url, {
        method: "GET",
        headers: { "User-Agent": "AccessibleRouteApp/1.0" },
      });
        
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data: MapboxGeocodingResponse = await response.json();
  
      if (type === "start") setResultsStart(data.features);
      else setResultsEnd(data.features);
  
      if (data.features.length === 1) {
        const f = data.features[0];
        const loc: LatLng = { latitude: f.center[1], longitude: f.center[0] };
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
      if (type === "start") setResultsStart([]);
      else setResultsEnd([]);
    } finally {
      setLoading(false);
    }
  };

  // 📍 Current location
  const getCurrentLocation = async (type: "start" | "end") => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Location permission is needed to use current location");
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const loc: LatLng = { latitude: location.coords.latitude, longitude: location.coords.longitude };
      if (type === "start") { setStart(loc); setQueryStart("Current Location"); }
      else { setEnd(loc); setQueryEnd("Current Location"); }
      Alert.alert("Success", `${type === "start" ? "Start" : "End"} location set to current position`);
    } catch (error) {
      console.error("Location error:", error);
      Alert.alert("Location Error", "Unable to get current location");
    }
  };

  // 🚗 Mapbox Directions
  useEffect(() => {
    if (!start || !end) { setRouteCoords([]); setRouteInfo(null); return; }
    const fetchRoute = async () => {
      setRouteLoading(true);
      try {
        const url =
          `https://api.mapbox.com/directions/v5/mapbox/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?` +
          `access_token=${MAPBOX_ACCESS_TOKEN}&geometries=geojson&overview=full&steps=true`;
        const res = await fetch(url, { headers: { "User-Agent": "AccessibleRouteApp/1.0" } });
        if (!res.ok) throw new Error(`Mapbox Directions API error: ${res.status}`);
        const data = await res.json();
        if (data.routes?.length) {
          const r = data.routes[0];
          setRouteCoords(r.geometry.coordinates.map((c: [number, number]) => ({ latitude: c[1], longitude: c[0] })));
          setRouteInfo({ distance: r.distance, duration: r.duration });
        } else {
          setRouteCoords([start, end]); setRouteInfo(null);
          Alert.alert("Route Notice", "Using straight line route as detailed routing is unavailable");
        }
      } catch (e) {
        console.error("Routing error:", e);
        setRouteCoords([start, end]); setRouteInfo(null);
        Alert.alert("Routing Fallback", "Detailed routing unavailable. Showing direct line between points.");
      } finally { setRouteLoading(false); }
    };
    fetchRoute();
  }, [start, end]);

  // ♿ Accessible Parking (ArcGIS → GeoJSON, EPSG:4326)
  useEffect(() => {
    let aborted = false;
    const loadParking = async () => {
      if (!showAccessibleParking) { setAccessibleParkingMeta([]); return; }
      try {
        const url =
          "https://services1.arcgis.com/cNVyNtjGVZybOQWZ/ArcGIS/rest/services/Mobility_parking/FeatureServer/1/query" +
          "?where=1%3D1&outFields=Address,NumberParkingSpaces,SignText&outSR=4326&f=geojson";
        const res = await fetch(url, { headers: { "User-Agent": "AccessibleRouteApp/1.0" } });
        if (!res.ok) throw new Error(`ArcGIS query failed: ${res.status}`);
        const data = await res.json();
        const features = (data.features ?? []) as Array<{
          geometry: { coordinates: [number, number] };
          properties: { Address?: string; NumberParkingSpaces?: number; SignText?: string };
        }>;
        const meta: ParkingMeta[] = features
          .filter((f) => Array.isArray(f.geometry?.coordinates))
          .map((f) => {
            const [lng, lat] = f.geometry.coordinates;
            return {
              coord: { latitude: lat, longitude: lng },
              address: f.properties?.Address,
              spaces: f.properties?.NumberParkingSpaces,
              sign: f.properties?.SignText,
            };
          });
        if (!aborted) setAccessibleParkingMeta(meta);
      } catch (e) {
        console.error("Accessible parking fetch error:", e);
        if (!aborted) Alert.alert("Data Error", "Could not load accessible parking locations right now.");
      }
    };
    loadParking(); return () => { aborted = true; };
  }, [showAccessibleParking]);

  // 🛗 Lifts & 🧗 Stairs (OSM Overpass)
  const SYDNEY_BBOX = { south: -33.93, west: 151.10, north: -33.80, east: 151.29 }; // CBD-ish
  const fetchOverpass = async (query: string) => {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "AccessibleRouteApp/1.0",
      },
      body: "data=" + encodeURIComponent(query),
    });
    if (!res.ok) throw new Error(`Overpass error: ${res.status}`);
    return res.json();
  };

  useEffect(() => {
    let aborted = false;
    const loadLifts = async () => {
      if (!showLifts) { setLiftsMeta([]); return; }
      try {
        const { south, west, north, east } = SYDNEY_BBOX;
        const q = `
          [out:json][timeout:25];
          (
            node["highway"="elevator"](${south},${west},${north},${east});
            way["highway"="elevator"](${south},${west},${north},${east});
          );
          out center;`;
        const data = await fetchOverpass(q);
        const meta: PoiMeta[] = (data.elements ?? []).map((el: any) => {
          const lat = el.lat ?? el.center?.lat;
          const lon = el.lon ?? el.center?.lon;
          return { coord: { latitude: lat, longitude: lon }, name: el.tags?.name, note: el.tags?.operator || el.tags?.note };
        }).filter((p: PoiMeta) => p.coord.latitude && p.coord.longitude);
        if (!aborted) setLiftsMeta(meta);
      } catch (e) {
        console.error("Lifts fetch error:", e);
        if (!aborted) Alert.alert("Data Error", "Could not load lift locations right now.");
      }
    };
    loadLifts(); return () => { aborted = true; };
  }, [showLifts]);

  useEffect(() => {
    let aborted = false;
    const loadStairs = async () => {
      if (!showStairs) { setStairsMeta([]); return; }
      try {
        const { south, west, north, east } = SYDNEY_BBOX;
        const q = `
          [out:json][timeout:25];
          (
            node["highway"="steps"](${south},${west},${north},${east});
            way["highway"="steps"](${south},${west},${north},${east});
          );
          out center;`;
        const data = await fetchOverpass(q);
        const meta: PoiMeta[] = (data.elements ?? []).map((el: any) => {
          const lat = el.lat ?? el.center?.lat;
          const lon = el.lon ?? el.center?.lon;
          return { coord: { latitude: lat, longitude: lon }, name: el.tags?.name, note: el.tags?.incline || el.tags?.note };
        }).filter((p: PoiMeta) => p.coord.latitude && p.coord.longitude);
        if (!aborted) setStairsMeta(meta);
      } catch (e) {
        console.error("Stairs fetch error:", e);
        if (!aborted) Alert.alert("Data Error", "Could not load stairs right now.");
      }
    };
    loadStairs(); return () => { aborted = true; };
  }, [showStairs]);

  // Pick / clear
  const handlePick = (item: MapboxFeature, type: "start" | "end") => {
    const loc: LatLng = { latitude: item.center[1], longitude: item.center[0] };
    if (type === "start") { setStart(loc); setQueryStart(item.place_name); setResultsStart([]); }
    else { setEnd(loc); setQueryEnd(item.place_name); setResultsEnd([]); }
    setActiveSearch(null); Keyboard.dismiss();
  };
  const clearLocation = (type: "start" | "end") => {
    if (type === "start") { setStart(null); setQueryStart(""); setResultsStart([]); }
    else { setEnd(null); setQueryEnd(""); setResultsEnd([]); }
    setActiveSearch(null);
  };

  // UI helpers
  const formatDuration = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };
  const formatDistance = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`);
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
          showsUserLocation
          showsMyLocationButton={false}
        >
          {start && <Marker coordinate={start} title="Start" pinColor="green" />}
          {end && <Marker coordinate={end} title="End" pinColor="red" />}

          {routeCoords.length > 0 && (
            <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="#007AFF" />
          )}

          {/* ♿ Accessible parking */}
          {showAccessibleParking &&
            accessibleParkingMeta.map((p, idx) => (
              <Marker key={`acc-${idx}`} coordinate={p.coord} pinColor="#1b5cff" title="Accessible parking" description={p.address || ""}>
                <Callout>
                  <View style={{ maxWidth: 240 }}>
                    <Text style={{ fontWeight: "700", marginBottom: 4 }}>Accessible parking</Text>
                    {p.address ? <Text>{p.address}</Text> : null}
                    {typeof p.spaces === "number" ? <Text>Spaces: {p.spaces}</Text> : null}
                    {p.sign ? <Text numberOfLines={3}>Sign: {p.sign}</Text> : null}
                  </View>
                </Callout>
              </Marker>
          ))}

          {/* 🛗 Lifts */}
          {showLifts &&
            liftsMeta.map((p, idx) => (
              <Marker key={`lift-${idx}`} coordinate={p.coord} pinColor="#8A2BE2" title="Lift (elevator)" description={p.name || ""}>
                <Callout>
                  <View style={{ maxWidth: 240 }}>
                    <Text style={{ fontWeight: "700", marginBottom: 4 }}>Lift (elevator)</Text>
                    {p.name ? <Text>{p.name}</Text> : null}
                    {p.note ? <Text numberOfLines={3}>{p.note}</Text> : null}
                    <Text style={{ color: "#999", marginTop: 4, fontSize: 12 }}>Data: OpenStreetMap</Text>
                  </View>
                </Callout>
              </Marker>
          ))}

          {/* 🧗 Stairs */}
          {showStairs &&
            stairsMeta.map((p, idx) => (
              <Marker key={`stairs-${idx}`} coordinate={p.coord} pinColor="#F39C12" title="Stairs" description={p.name || ""}>
                <Callout>
                  <View style={{ maxWidth: 240 }}>
                    <Text style={{ fontWeight: "700", marginBottom: 4 }}>Stairs</Text>
                    {p.name ? <Text>{p.name}</Text> : null}
                    {p.note ? <Text numberOfLines={3}>{p.note}</Text> : null}
                    <Text style={{ color: "#999", marginTop: 4, fontSize: 12 }}>Data: OpenStreetMap</Text>
                  </View>
                </Callout>
              </Marker>
          ))}
        </MapView>

        {/* Search + controls */}
        <View style={styles.searchContainer}>
          {/* Start */}
          <View style={styles.locationSection}>
            <Text style={styles.searchTitle}>Start Location</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Search start location"
                value={queryStart}
                onChangeText={(text) => { setQueryStart(text); searchLocation(text, "start"); }}
                onFocus={() => setActiveSearch("start")}
              />
              <TouchableOpacity style={styles.locationButton} onPress={() => getCurrentLocation("start")}>
                <Text style={styles.locationButtonText}>📍</Text>
              </TouchableOpacity>
              {start && (
                <TouchableOpacity style={styles.clearButton} onPress={() => clearLocation("start")}>
                  <Text style={styles.clearButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* End */}
          <View style={styles.locationSection}>
            <Text style={styles.searchTitle}>End Location</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Search end location"
                value={queryEnd}
                onChangeText={(text) => { setQueryEnd(text); searchLocation(text, "end"); }}
                onFocus={() => setActiveSearch("end")}
              />
              <TouchableOpacity style={styles.locationButton} onPress={() => getCurrentLocation("end")}>
                <Text style={styles.locationButtonText}>📍</Text>
              </TouchableOpacity>
              {end && (
                <TouchableOpacity style={styles.clearButton} onPress={() => clearLocation("end")}>
                  <Text style={styles.clearButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Route info */}
          {routeInfo && (
            <View style={styles.routeInfoContainer}>
              <Text style={styles.routeInfoText}>
                🚗 {formatDistance(routeInfo.distance)} • {formatDuration(routeInfo.duration)}
                {routeLoading && " (updating...)"}
              </Text>
            </View>
          )}

          {/* Searching… */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          )}

          {/* Results */}
          {(activeSearch ? (activeSearch === "start" ? resultsStart : resultsEnd) : []).length > 0 && activeSearch && (
            <FlatList
              data={activeSearch === "start" ? resultsStart : resultsEnd}
              keyExtractor={(item) => item.id}
              style={styles.resultsList}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.result} onPress={() => handlePick(item, activeSearch)}>
                  <Text numberOfLines={2} style={styles.resultText}>{item.place_name}</Text>
                </TouchableOpacity>
              )}
            />
          )}

          {/* Layer toggles & attribution */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10, alignItems: "center" }}>
            <TouchableOpacity
              onPress={() => setShowAccessibleParking((v) => !v)}
              style={[styles.toggleBtn, { backgroundColor: showAccessibleParking ? "#e7f7ff" : "#f1f1f1" }]}
            >
              <Text style={styles.toggleBtnText}>{showAccessibleParking ? "Hide" : "Show"} Parking ♿</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowLifts((v) => !v)}
              style={[styles.toggleBtn, { backgroundColor: showLifts ? "#efe7ff" : "#f1f1f1" }]}
            >
              <Text style={styles.toggleBtnText}>{showLifts ? "Hide" : "Show"} Lifts 🛗</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowStairs((v) => !v)}
              style={[styles.toggleBtn, { backgroundColor: showStairs ? "#fff3e0" : "#f1f1f1" }]}
            >
              <Text style={styles.toggleBtnText}>{showStairs ? "Hide" : "Show"} Stairs 🧗</Text>
            </TouchableOpacity>
            <Text style={{ color: "#666", fontSize: 12 }}>
              Data: City of Sydney (parking), OpenStreetMap (lifts & stairs)
            </Text>
          </View>
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
  locationSection: { marginBottom: 16 },
  searchTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8, color: "#333" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: { padding: 12, borderWidth: 1, borderColor: "#ddd", borderRadius: 8, fontSize: 16, backgroundColor: "#fff" },
  locationButton: { padding: 12, backgroundColor: "#007AFF", borderRadius: 8, minWidth: 44, alignItems: "center" },
  locationButtonText: { fontSize: 16, color: "white" },
  clearButton: { padding: 12, backgroundColor: "#FF3B30", borderRadius: 8, minWidth: 44, alignItems: "center" },
  clearButtonText: { fontSize: 16, color: "white", fontWeight: "bold" },
  routeInfoContainer: { backgroundColor: "#f0f8ff", padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: "#007AFF" },
  routeInfoText: { fontSize: 16, fontWeight: "600", color: "#007AFF", textAlign: "center" },
  loadingContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 12 },
  loadingText: { marginLeft: 8, color: "#666" },
  resultsList: { maxHeight: 200, marginTop: 8 },
  result: { padding: 12, borderBottomWidth: 1, borderColor: "#eee", backgroundColor: "#f9f9f9", marginVertical: 2, borderRadius: 6 },
  resultText: { fontSize: 15, color: "#333" },
  toggleBtn: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: "#cfe0ff" },
  toggleBtnText: { fontWeight: "600", color: "#1b5cff" },
});
