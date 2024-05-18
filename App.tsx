import { Key, SetStateAction, useEffect, useState } from 'react';
import { Alert, View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { styles } from './styles';
import {
  requestForegroundPermissionsAsync,
  getCurrentPositionAsync,
  LocationObject,
  watchPositionAsync,
  LocationAccuracy,
  watchHeadingAsync
}
  from 'expo-location'
import MapView, { Marker } from 'react-native-maps';
import axios from 'axios';
import { cleanText } from './WikiUtils';
import * as Speech from 'expo-speech';
import mapConfig from './mapConfig';


const touristIcon = { uri: 'https://cdn-icons-png.flaticon.com/128/3124/3124230.png' };

export default function App() {

  const [location, setLocation] = useState<LocationObject | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const [selectedPoi, setSelectedPoi] = useState<any>(null);
  const [cleanedAbstract, setCleanedAbstract] = useState('');
  const [heading, setHeading] = useState(0);



  async function requestLocationPermissions() {
    const { granted } = await requestForegroundPermissionsAsync();

    if (granted) {
      const currentPosition = await getCurrentPositionAsync();
      setLocation(currentPosition);
      // console.log("Localização atual", currentPosition)      
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

  // Debounce function to limit how often a function can fire
  function debounce(func: { (headingData: { trueHeading: SetStateAction<number>; }): void; apply?: any; }, delay: number | undefined) {
    let timeoutId: string | number | NodeJS.Timeout | undefined;
    return (...args: any) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func.apply(this as any, args);
      }, delay);
    };
  }

  useEffect(() => {
    requestLocationPermissions();
  }, []);

  useEffect(() => {
    const watchLocation = async () => {
      await watchPositionAsync({
        accuracy: LocationAccuracy.Highest,
        timeInterval: 1000,
        distanceInterval: 1
      }, (response) => {
        setLocation(response);
      });
    };

    const watchHeading = async () => {
      await watchHeadingAsync(debounce((headingData: { trueHeading: SetStateAction<number>; }) => {
        setHeading(headingData.trueHeading);
      }, 300)); // Debounce with 300ms delay
    };

    watchLocation();
    watchHeading();
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
            longitudeDelta: 0.005
          }}
          camera={{
            center: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
            },
            pitch: 0,
            heading: heading,
            altitude: 1000,
            zoom: 18
          }}
        >
          <Marker coordinate={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          }}
            onPress={handleSelfLocationClick}
            image={touristIcon} />
          {nearbyPlaces.map((poi) => (
            <Marker
              key={poi.pageid as Key}
              coordinate={{
                latitude: poi.lat,
                longitude: poi.lon
              }}
              title={poi.title}
              onPress={() => handleMarkerPress(poi)}
              image={require('./assets/wikiguideIcon.png')}
            />
          ))}
        </MapView>
      )}

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
    </View>
  );
}
