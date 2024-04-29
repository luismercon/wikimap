import { Key, useEffect, useState } from 'react';
import { Alert, View, Text, Modal, Pressable } from 'react-native';
import { styles } from './styles';
import {
  requestForegroundPermissionsAsync,
  getCurrentPositionAsync,
  LocationObject,
  watchPositionAsync,
  LocationAccuracy
}
  from 'expo-location'
import MapView, { Marker } from 'react-native-maps';
import axios from 'axios';
import { cleanText } from './WikiUtils';


const touristIcon = { uri: 'https://cdn-icons-png.flaticon.com/128/3124/3124230.png' };
const gsradius = 3000; // 3km for testing purposes


export default function App() {

  const [location, setLocation] = useState<LocationObject | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const [selectedPoi, setSelectedPoi] = useState<any>(null);
  const [cleanedAbstract, setCleanedAbstract] = useState('');


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

      setCleanedAbstract(cleanedAbstract);
      setSelectedPoi(null);
    } catch (error) {
      console.log('Request error:', error);
    }
  }

  useEffect(() => {
    requestLocationPermissions();
  }, []);

  useEffect(() => {
    watchPositionAsync({
      accuracy: LocationAccuracy.Highest,
      timeInterval: 1000,
      distanceInterval: 1
    }, (response) => {
      // console.log("Nova localização!", response)
      setLocation(response);
    });
  }, [])


  useEffect(() => {
    async function fetchNearbyPlaces() {
      if (location) {
        const { latitude, longitude } = location.coords;

        const response = await axios.get('https://en.wikipedia.org/w/api.php', {
          params: {
            action: 'query',
            list: 'geosearch',
            gscoord: `${latitude}|${longitude}`,
            gsradius: gsradius,
            gslimit: 10,
            format: 'json',
          },
        });

        // console.log('Nearby places:', response.data);
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
            />
          ))}
        </MapView>
      )}

      {selectedPoi && (
        <Modal animationType='slide' transparent={true} visible={true}>
          <View style={{ margin: 20, padding: 20, backgroundColor: 'white' }}>
            <Text>{selectedPoi.title}</Text>
            <Text>{selectedPoi.snippet}</Text>
            <Pressable onPress={handleButtonClick}>
              <Text>Make Request</Text>
            </Pressable>
            <Pressable onPress={() => setSelectedPoi(null)}>
              <Text>Close</Text>
            </Pressable>
          </View>
        </Modal>
      )}
    </View>
  );
}


