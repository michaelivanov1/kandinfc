// App.tsx
import React, { useState } from 'react';
import { SafeAreaView, Button, Alert, Platform } from 'react-native';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';

// Start NFC manager
NfcManager.start();

// Convert UID bytes to hex string
const bytesToHex = (bytes: number[] | Uint8Array) => {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

export default function App() {
  const [tagID, setTagID] = useState<string | null>(null);

  const readNfcTag = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Info', 'This example is for iOS only.');
      return;
    }

    try {
      // Request MifareIOS tech to read raw UID
      await NfcManager.requestTechnology(NfcTech.MifareIOS, {
        alertMessage: 'Hold your iPhone near the NFC tag',
      });

      const tag = await NfcManager.getTag();
      console.log('Full tag object:', tag);

      if (!tag) {
        Alert.alert('Error', 'No tag detected');
        return;
      }

      // UID is usually in tag.identifier (Uint8Array)
      const idBytes = tag.identifier ?? tag.id;
      const id = idBytes ? bytesToHex(idBytes) : null;

      if (id) {
        setTagID(id);
        Alert.alert('Tag detected!', `UID: ${id.toUpperCase()}`); // clean hex string
      } else {
        Alert.alert('Tag detected', 'Could not read UID');
      }
    } catch (ex) {
      console.warn('NFC error', ex);
      Alert.alert('NFC Error', ex?.toString());
    } finally {
      // Always cancel the tech session
      await NfcManager.cancelTechnologyRequest().catch(() => {});
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button title="Scan NFC Tag" onPress={readNfcTag} />
      {tagID && <Button title={`Last Tag UID: ${tagID.toUpperCase()}`} onPress={() => {}} />}
    </SafeAreaView>
  );
}
