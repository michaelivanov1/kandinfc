import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import NfcProxy from '../services/NfcProxy'; 
import nfcManager, { Ndef } from 'react-native-nfc-manager';

export default function NfcTest() {
    const [status, setStatus] = useState('Idle');
    const [lastTag, setLastTag] = useState<string | null>(null);

    useEffect(() => {
        // Initialize NFC
        (async () => {
            try {
                const supported = await NfcProxy.init();
                console.log('NFC supported?', supported);
                setStatus(supported ? 'Ready to scan' : 'NFC not supported');
            } catch (err) {
                console.log('NFC init error:', err);
                setStatus('NFC init failed');
            }
        })();

        return () => {
            // Cleanup on unmount
            nfcManager.cancelTechnologyRequest?.();
        };
    }, []);

    const scanTag = async () => {
        try {
            setStatus('Waiting for tag...');
            console.log('Starting NFC scan...');

            const tag = await NfcProxy.readNdefOnce();
            console.log('Tag detected:', tag);

            if (!tag) {
                setStatus('No tag detected');
                return;
            }

            let kandiId: string | null = null;

            if (tag.ndefMessage && tag.ndefMessage.length > 0) {
                const record = tag.ndefMessage[0];
                const payload = record.payload instanceof Uint8Array
                    ? record.payload
                    : Uint8Array.from(record.payload);
                kandiId = Ndef.text.decodePayload(payload)?.trim().toUpperCase() ?? null;
            }

            if (!kandiId && tag.id) {
                kandiId = tag.id.toUpperCase();
            }

            if (!kandiId) throw new Error('Could not read tag ID');

            console.log('Kandi ID / Tag text:', kandiId);
            setLastTag(kandiId);
            setStatus('Tag scanned successfully!');
            Alert.alert('Tag scanned', kandiId);
        } catch (err: any) {
            console.warn('Scan failed:', err);
            setStatus('Scan failed or cancelled');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>NFC TEST</Text>
            <Text style={styles.status}>{status}</Text>
            {lastTag && <Text style={styles.tagText}>Last tag: {lastTag}</Text>}

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
        fontSize: 28,
        color: '#fff',
        marginBottom: 20,
    },
    status: {
        color: '#aaa',
        marginBottom: 10,
        textAlign: 'center',
    },
    tagText: {
        color: '#0f0',
        marginBottom: 30,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    button: {
        backgroundColor: '#fff',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 8,
    },
    buttonText: {
        fontWeight: 'bold',
        color: '#111',
    },
});
