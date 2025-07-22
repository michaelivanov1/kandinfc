import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  Text,
  StyleSheet,
  Button,
  Platform,
  Alert,
} from 'react-native';
import NfcManager, { NfcTech } from 'react-native-nfc-manager'; 

// Initialize once
NfcManager.start();

const App = () => {
  const [tagID, setTagID] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);

  useEffect(() => {
  // Start NFC
  NfcManager.start();

  // Register foreground NFC scanning
  NfcManager.registerTagEvent()
    .then(() => console.log('NFC tag event registered'))
    .catch(err => console.warn('NFC tag registration failed', err));

  return () => {
    // Unregister on cleanup
    NfcManager.unregisterTagEvent().catch(() => {});
  };
}, []);

  const readNfcTag = async () => {
  if (isReading) {
    console.log("Already reading NFC");
    return;
  }

  try {
    setIsReading(true);

    // Cancel any stuck session before starting new one
    await NfcManager.cancelTechnologyRequest().catch(() => {});

    await NfcManager.requestTechnology(NfcTech.Ndef, {
      alertMessage: "Ready to scan NFC tag",
    });

    const tag = await NfcManager.getTag();
    console.log("Read NFC tag:", tag?.id);
    setTagID(tag?.id ?? null);
  } catch (ex) {
    console.warn("NFC error", ex);
    Alert.alert("NFC Error", ex?.toString());
  } finally {
    setIsReading(false);
    await NfcManager.cancelTechnologyRequest().catch(() => {});
  }
};


  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>kandi app</Text>
      <Button onPress={readNfcTag} title="read nfc tag" />
      <Text style={styles.text}>tag: {tagID}</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  text: {
    color: '#00ffcc',
    fontSize: 24,
    margin: 10,
  },
});

export default App;