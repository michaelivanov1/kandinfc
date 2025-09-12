// src/screens/NfcScreen.tsx
import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text, StyleSheet, Button, Alert, Modal, View, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// initialize nfc manager once
NfcManager.start();

const NfcScreen = () => {
    const [tagID, setTagID] = useState<string | null>(null);
    const [isReading, setIsReading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [originLocation, setOriginLocation] = useState('');
    const [isExistingKandi, setIsExistingKandi] = useState(false);
    const navigation = useNavigation<any>();

    // register nfc events on mount
    useEffect(() => {
        NfcManager.start();

        NfcManager.registerTagEvent()
            .then(() => console.log('NFC tag event registered'))
            .catch(err => console.warn('NFC tag registration failed', err));

        return () => {
            // unregister to avoid memory leaks
            NfcManager.unregisterTagEvent().catch(() => { });
        };
    }, []);

    // function to read nfc tag when button is pressed
    const readNfcTag = async () => {
        if (isReading) return;

        try {
            setIsReading(true);
            await NfcManager.cancelTechnologyRequest().catch(() => { });
            await NfcManager.requestTechnology(NfcTech.Ndef, { alertMessage: 'Ready to scan NFC tag' });

            const tag = await NfcManager.getTag();
            const id = tag?.id ?? null;
            setTagID(id);

            if (!id) return;

            const doc = await firestore().collection('kandis').doc(id).get();

            if (doc.exists()) {
                // kandi already exists -> navigate to details screen
                navigation.navigate('KandiDetails', { tagID: id });
                return;
            }

            // if it doesn't exist, show claim modal for new kandi
            setIsExistingKandi(false);
            setOriginLocation('');
            setModalVisible(true);

        } catch (ex) {
            console.warn('NFC error', ex);
            Alert.alert('NFC Error', ex?.toString());
        } finally {
            setIsReading(false);
            await NfcManager.cancelTechnologyRequest().catch(() => { });
        }
    };


    // function to claim a new kandi
    const handleClaimKandi = async () => {
        if (!tagID) return;
        if (!originLocation.trim()) return Alert.alert('Error', 'Please enter the origin location.');

        try {
            const user = auth().currentUser;
            if (!user) return Alert.alert('Error', 'You must be signed in to claim a kandi.');

            const kandiRef = firestore().collection('kandis').doc(tagID);

            // create kandi doc with originLocation, creatorId, and history
            await kandiRef.set({
                originLocation: originLocation,
                creatorId: user.uid,
                lore: [originLocation], // initial lore array with first entry
                createdAt: firestore.FieldValue.serverTimestamp(),
                history: [
                    {
                        userId: user.uid,
                        action: 'claimed',
                        timestamp: firestore.Timestamp.now()
                    }
                ]
            });

            // add kandi id to user's kandis array
            const userRef = firestore().collection('users').doc(user.uid);
            await userRef.update({
                kandis: firestore.FieldValue.arrayUnion(tagID)
            });

            Alert.alert('Success', 'Kandi claimed and added to your profile!');
            setModalVisible(false);
            setOriginLocation('');
        } catch (err: any) {
            console.warn('Failed to claim kandi:', err);
            Alert.alert('Error', err.message ?? 'Could not claim kandi.');
        }
    };

    // sign out function
    const handleSignOut = async () => {
        try {
            await auth().signOut();
            console.log('User signed out');
        } catch (error: any) {
            console.warn('Sign out error:', error);
            Alert.alert('Error signing out', error.message);
        }
    };

    return (
        <SafeAreaView style={styles.container}>

            <Button
                title="Profile"
                onPress={() => navigation.navigate('Profile')}
            />

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

            {/* modal for claiming or showing existing kandi */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        {isExistingKandi ? (
                            <>
                                <Text style={styles.modalTitle}>This kandi is already claimed!</Text>
                                <Text style={{ marginBottom: 15 }}>Origin: {originLocation}</Text>
                                <Button title="OK" onPress={() => setModalVisible(false)} />
                            </>
                        ) : (
                            <>
                                <Text style={styles.modalTitle}>New kandi found!</Text>
                                <TextInput
                                    placeholder="Enter origin location"
                                    placeholderTextColor="#aaa"
                                    style={styles.input}
                                    value={originLocation}
                                    onChangeText={setOriginLocation}
                                />
                                <Button title="Claim Kandi" onPress={handleClaimKandi} />
                                <Button title="Cancel" color="red" onPress={() => setModalVisible(false)} />
                            </>
                        )}
                    </View>
                </View>
            </Modal>
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
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#00000099',
    },
    modalContent: {
        width: '80%',
        padding: 20,
        backgroundColor: '#111',
        borderRadius: 12,
        alignItems: 'center',
    },
    modalTitle: {
        color: '#00ffcc',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    input: {
        width: '100%',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: '#ffffff33',
        color: '#fff',
        fontSize: 16,
        marginBottom: 10,
    },
});

export default NfcScreen;
