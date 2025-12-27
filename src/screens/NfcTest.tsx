import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import NfcManager, { Ndef, NfcEvents } from 'react-native-nfc-manager';

export default function NfcTest() {
    const [status, setStatus] = useState('Idle');

    useEffect(() => {
        // Start NFC manager
        NfcManager.start()
            .then(() => console.log('NFC started'))
            .catch(err => console.warn('NFC start error', err));

        // Cleanup on unmount
        return () => {
            NfcManager.cancelTechnologyRequest().catch(() => { });
        };
    }, []);

    const scanTag = async () => {
        if (Platform.OS !== 'ios') {
            Alert.alert('Info', 'This test only works on iOS.');
            return;
        }

        try {
            setStatus('Waiting for tag...');
            console.log('Registering iOS tag event');

            // Set a one-time listener for tag discovery
            NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag: { ndefMessage: string | any[]; }) => {
                console.log('Tag discovered:', tag);
                setStatus('Tag detected! Check console');

                if (tag?.ndefMessage?.length) {
                    const payload = tag.ndefMessage[0].payload instanceof Uint8Array
                        ? tag.ndefMessage[0].payload
                        : Uint8Array.from(tag.ndefMessage[0].payload);

                    const text = Ndef.text.decodePayload(payload);
                    console.log('Decoded NDEF text:', text);
                }

                // End the NFC session
                NfcManager.invalidateSessionIOS();
            });

            // Register tag event (triggers iOS NFC popup)
            await NfcManager.registerTagEvent();
            console.log('iOS NFC popup should be visible now');

        } catch (err) {
            console.warn('NFC error', err);
            setStatus('Scan failed or cancelled');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>iOS NFC Test</Text>
            <Text style={styles.status}>{status}</Text>

            <TouchableOpacity style={styles.button} onPress={scanTag}>
                <Text style={styles.buttonText}>SCAN NFC TAG</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 26,
        color: '#fff',
        marginBottom: 20,
    },
    status: {
        color: '#aaa',
        marginBottom: 30,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#fff',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 8,
    },
    buttonText: {
        fontWeight: 'bold',
        color: '#000',
    },
});
