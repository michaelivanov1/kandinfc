// src/screens/NfcScreen.tsx
import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text, StyleSheet, Button, Alert } from 'react-native';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import auth from '@react-native-firebase/auth';

// Initialize NFC manager once
NfcManager.start();

const NfcScreen = () => {
    const [tagID, setTagID] = useState<string | null>(null);
    const [isReading, setIsReading] = useState(false);

    // Register NFC events on mount
    useEffect(() => {
        NfcManager.start();

        NfcManager.registerTagEvent()
            .then(() => console.log('NFC tag event registered'))
            .catch(err => console.warn('NFC tag registration failed', err));

        return () => {
            // Unregister to avoid memory leaks
            NfcManager.unregisterTagEvent().catch(() => { });
        };
    }, []);

    // Function to read NFC tag when button is pressed
    const readNfcTag = async () => {
        if (isReading) return; // Prevent multiple scans at once

        try {
            setIsReading(true);

            // Cancel any stuck session
            await NfcManager.cancelTechnologyRequest().catch(() => { });

            // Request NDEF technology
            await NfcManager.requestTechnology(NfcTech.Ndef, {
                alertMessage: 'Ready to scan NFC tag',
            });

            const tag = await NfcManager.getTag();
            console.log('Read NFC tag:', tag?.id);
            setTagID(tag?.id ?? null);
        } catch (ex) {
            console.warn('NFC error', ex);
            Alert.alert('NFC Error', ex?.toString());
        } finally {
            setIsReading(false);
            await NfcManager.cancelTechnologyRequest().catch(() => { });
        }
    };

    // Sign out function
    const handleSignOut = async () => {
        try {
            await auth().signOut();
            console.log('User signed out');
            // AppNavigator will detect null user and redirect to AuthScreen
        } catch (error: any) {
            console.warn('Sign out error:', error);
            Alert.alert('Error signing out', error.message);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.text}>Kandi NFC App</Text>

            <Button
                onPress={readNfcTag}
                title={isReading ? 'Scanning...' : 'Read NFC Tag'}
                disabled={isReading}
            />

            <Text style={styles.text}>Tag: {tagID ?? 'No tag scanned'}</Text>

            <Button
                title="Sign Out"
                onPress={handleSignOut}
                color="#ff5555"
            />
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

export default NfcScreen;