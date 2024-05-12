import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    flex: 1,
    width: '100%'
  },
  modal: {
    margin: 20,
    padding: 20,
    backgroundColor: 'white',
  },
  poiTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
  listenButton: {
    backgroundColor: '#007BFF',
    color: 'white',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100
  },
  listenButtonText: {
    color: 'white',
  },
  closeButton: {
    color: 'blue',
    marginTop: 20,
    alignItems: 'flex-end',
  },
  closeButtonText: {
    color: 'blue',
  },

});