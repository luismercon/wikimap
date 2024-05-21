import { DevSettings, StyleSheet } from "react-native";

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
    maxHeight: '80%',
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
  aboutModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  aboutModalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxHeight: '90%',
  },
  aboutModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  aboutModalText: {
    fontSize: 16,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    padding: 10,
    backgroundColor: 'white',
  },
  descriptionContainer: {
    padding: 10,
  },
  description: {
    padding: 10,
    marginBottom: 15,
  },

});