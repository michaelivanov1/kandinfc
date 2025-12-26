import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';

export default function NfcTest() {
    const [status, setStatus] = useState('Idle');

    useEffect(() => {
        NfcManager.start()
            .then(() => console.log('NFC started'))
            .catch(err => console.log('NFC start error', err));

        return () => {
            NfcManager.cancelTechnologyRequest().catch(() => { });
        };
    }, []);

    const scanTag = async () => {
        try {
            setStatus('Waiting for tag...');
            console.log('Requesting NDEF tech');

            await NfcManager.requestTechnology(NfcTech.Ndef);

            console.log('NDEF tech acquired');
            const tag = await NfcManager.getTag();

            console.log('TAG READ:', tag);
            setStatus('Tag detected! Check console');

            if (tag?.ndefMessage) {
                const payload = Uint8Array.from(tag.ndefMessage[0].payload);
                const text = Ndef.text.decodePayload(payload);
                console.log('Decoded text:', text);
            }
        } catch (err) {
            console.log('NFC ERROR', err);
            setStatus('Scan failed or cancelled');
        } finally {
            NfcManager.cancelTechnologyRequest().catch(() => { });
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>NFC TEST</Text>
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
    },
    title: {
        fontSize: 26,
        color: '#fff',
        marginBottom: 20,
    },
    status: {
        color: '#aaa',
        marginBottom: 30,
    },
    button: {
        backgroundColor: '#fff',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 8,
    },
    buttonText: {
        fontWeight: 'bold',
    },
});
