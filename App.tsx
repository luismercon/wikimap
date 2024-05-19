import { Key, useEffect, useState } from 'react';
import { Alert, View, Text, Modal, Pressable, Button } from 'react-native';
import { styles } from './styles';
import {
  requestForegroundPermissionsAsync,
  getCurrentPositionAsync,
  LocationObject,
  watchPositionAsync,
  LocationAccuracy,
} from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import axios from 'axios';
import { cleanText } from './WikiUtils';
import * as Speech from 'expo-speech';
import mapConfig from './mapConfig';
import { Magnetometer } from 'expo-sensors';

const touristIcon = { uri: 'https://cdn-icons-png.flaticon.com/128/3124/3124230.png' };

export default function App() {
  const [location, setLocation] = useState<LocationObject | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const [selectedPoi, setSelectedPoi] = useState<any>(null);
  const [cleanedAbstract, setCleanedAbstract] = useState('');
  const [heading, setHeading] = useState(0);
  const [rotateMap, setRotateMap] = useState(true); // New state to control map rotation
  const [isDragging, setIsDragging] = useState(false); // State to track if the map is being dragged
  const [userMovedMap, setUserMovedMap] = useState(false); // State to track if the user moved the map manually
  const [aboutModalVisible, setAboutModalVisible] = useState(false); // State to control the visibility of the About modal

  async function requestLocationPermissions() {
    const { granted } = await requestForegroundPermissionsAsync();
    if (granted) {
      const currentPosition = await getCurrentPositionAsync();
      setLocation(currentPosition);
    }
  }

  const handleSelfLocationClick = () => {
    Alert.alert('You Are here!');
  };

  function handleMarkerPress(poi: any) {
    setSelectedPoi(poi);
  }

  async function handleButtonClick() {
    console.log('Make Request button clicked');

    try {
      const url = `https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&pageids=${selectedPoi.pageid}`;
      const response = await axios.get(url);

      const pages = response.data.query.pages;
      const pageId = Object.keys(pages)[0];
      const extract = pages[pageId].extract;
      const cleanedAbstract = cleanText(extract);

      console.log('Request response:', cleanedAbstract);
      Speech.speak(cleanedAbstract, { language: 'en' });

      setCleanedAbstract(cleanedAbstract);
      setSelectedPoi(null);
    } catch (error) {
      console.log('Request error:', error);
    }
  }

  // Function to calculate heading from Magnetometer data
  function calculateHeading(magnetometerData: { x: any; y: any; z?: number; timestamp?: number; }) {
    let { x, y } = magnetometerData;
    let heading = Math.atan2(y, x) * (180 / Math.PI);
    if (heading < 0) {
      heading += 360;
    }
    return heading;
  }

  useEffect(() => {
    requestLocationPermissions();

    const watchLocation = async () => {
      await watchPositionAsync({
        accuracy: LocationAccuracy.Highest,
        timeInterval: 1000,
        distanceInterval: 1,
      }, (response) => {
        if (!userMovedMap) { // Only update location if user hasn't moved the map
          setLocation(response);
        }
      });
    };

    watchLocation();
  }, [userMovedMap]);

  useEffect(() => {
    // Smooth heading data
    let headingSum = 0;
    let headingCount = 0;
    let averageHeading = 0;

    const subscription = Magnetometer.addListener((data) => {
      const newHeading = calculateHeading(data);
      headingSum += newHeading;
      headingCount += 1;

      if (headingCount === 10) { // Average every 10 readings
        averageHeading = headingSum / headingCount;
        setHeading(averageHeading);
        headingSum = 0;
        headingCount = 0;
      }
    });

    Magnetometer.setUpdateInterval(100); // Update interval in ms

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    async function fetchNearbyPlaces() {
      if (location) {
        const { latitude, longitude } = location.coords;

        const response = await axios.get('https://en.wikipedia.org/w/api.php', {
          params: {
            action: 'query',
            list: 'geosearch',
            gscoord: `${latitude}|${longitude}`,
            gsradius: mapConfig.gsradius,
            gslimit: mapConfig.gslimit,
            format: 'json',
          },
        });

        setNearbyPlaces(response.data.query.geosearch);
      }
    }

    fetchNearbyPlaces();
  }, [location]);

  return (
    <View style={styles.container}>      
      {location && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          camera={{
            center: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            },
            pitch: 0,
            heading: rotateMap ? heading : 0, // Conditional heading update
            altitude: 1000,
            zoom: 18,
          }}
          onPanDrag={() => {
            setIsDragging(true);
            setUserMovedMap(true); // Set userMovedMap to true when user drags the map
          }}
          onRegionChangeComplete={() => {
            setIsDragging(false);
          }}
          onUserLocationChange={(e) => {
            if (!userMovedMap) {
              const { latitude, longitude } = e.nativeEvent.coordinate || {};
              setLocation({ coords: {
                latitude: latitude || 0, longitude: longitude || 0,
                altitude: null,
                accuracy: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null
              }, timestamp: 0 });
            }
          }}
          onTouchStart={() => {
            setUserMovedMap(true);
          }}
        >
          <Marker coordinate={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }}
            onPress={handleSelfLocationClick}
            image={touristIcon} />
          {nearbyPlaces.map((poi) => (
            <Marker
              key={poi.pageid as Key}
              coordinate={{
                latitude: poi.lat,
                longitude: poi.lon,
              }}
              title={poi.title}
              onPress={() => handleMarkerPress(poi)}
              image={require('./assets/wikiguideIcon.png')}
            />
          ))}
        </MapView>
      )}

      <View style={styles.buttonContainer}>
      <Button title={rotateMap ? "Disable Rotation" : "Enable Rotation"} onPress={() => {
        setRotateMap(!rotateMap);
        if (!rotateMap) {
          setUserMovedMap(false); // Reset userMovedMap when enabling rotation
        }
      }} />
      <Button title="About" onPress={() => setAboutModalVisible(true)} />
      </View>

      {selectedPoi && (
        <Modal animationType='slide' transparent={true} visible={true}>
          <View style={styles.modal}>
            <Text style={styles.poiTitle}>{selectedPoi.title}</Text>
            <Text>{selectedPoi.snippet}</Text>
            <Pressable onPress={handleButtonClick} style={styles.listenButton}>
              <Text style={styles.listenButtonText}>Listen</Text>
            </Pressable>
            <Pressable style={styles.closeButton} onPress={() => setSelectedPoi(null)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </Modal>
      )}

<Modal
        animationType="slide"
        transparent={true}
        visible={aboutModalVisible}
        onRequestClose={() => setAboutModalVisible(false)}
      >
        <View style={styles.aboutModal}>
          <View style={styles.aboutModalContent}>
            <Text style={styles.aboutModalTitle}>About This App</Text>
            <Text style={styles.aboutModalText}>
            This project was developed within the scope of the Environmental Intelligence discipline, in the master's course at the Instituto Superior de Engenharia de Coimbra - ISEC. The main objective of this project is to develop a mobile application that allows the user to explore the surroundings and obtain information about points of interest (POIs) in the vicinity. The application uses the Wikipedia API to obtain information about the POIs and the Expo SDK to access the device's location and sensors. The application also uses the React Native Maps library to display the map and the POIs. No user data is stored.
            </Text>
            <Text>
              Developed by: <Text style={{ fontWeight: 'bold' }}>Luis Merçon and Rafael Fonseca</Text>
            </Text>
            <Pressable style={styles.closeButton} onPress={() => setAboutModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

    </View>
  );
}