// run: npx react-native run-android

import React, { JSX, useState } from 'react';
import { SafeAreaView, Text, StyleSheet, Button } from 'react-native';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';

const [tagID, setTagID] = useState<string | null>(null);

async function readNfcTag() {
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef);
    const tag = await NfcManager.getTag();
    setTagID(tag?.id ?? null);
    console.log("Tag ID:", tag?.id);
    // eventually send ID to backend
  } catch (ex) {
    console.warn('NFC error', ex);
  } finally {
    NfcManager.cancelTechnologyRequest();
  }
}

const App = (): JSX.Element => {
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
  },
});


export default App;