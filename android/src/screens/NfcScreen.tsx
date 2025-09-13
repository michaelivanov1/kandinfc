// src/screens/NfcScreen.tsx
import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text, StyleSheet, Alert, Modal, View, TextInput, TouchableOpacity } from 'react-native';
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

    useEffect(() => {
        NfcManager.start();

        NfcManager.registerTagEvent()
            .then(() => console.log('NFC tag event registered'))
            .catch(err => console.warn('NFC tag registration failed', err));

        return () => {
            NfcManager.unregisterTagEvent().catch(() => { });
        };
    }, []);

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
                navigation.navigate('KandiDetails', { tagID: id });
                return;
            }

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

    const handleClaimKandi = async () => {
        if (!tagID) return;
        if (!originLocation.trim()) return Alert.alert('Error', 'Please enter the origin location.');

        try {
            const user = auth().currentUser;
            if (!user) return Alert.alert('Error', 'You must be signed in to claim a kandi.');

            const kandiRef = firestore().collection('kandis').doc(tagID);

            await kandiRef.set({
                originLocation,
                creatorId: user.uid,
                lore: [originLocation],
                createdAt: firestore.FieldValue.serverTimestamp(),
                history: [
                    {
                        userId: user.uid,
                        action: 'claimed',
                        timestamp: firestore.Timestamp.now()
                    }
                ]
            });

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

    const handleSignOut = async () => {
        try {
            await auth().signOut();
        } catch (error: any) {
            Alert.alert('Error signing out', error.message);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Kandi NFC App</Text>

                <TouchableOpacity style={styles.button} onPress={readNfcTag} disabled={isReading}>
                    <Text style={styles.buttonText}>{isReading ? 'Scanning...' : 'Scan Kandi'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, styles.signUpButton]} onPress={() => navigation.navigate('Profile')}>
                    <Text style={[styles.buttonText, styles.signUpText]}>Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, styles.signOutButton]} onPress={handleSignOut}>
                    <Text style={styles.buttonText}>Sign Out</Text>
                </TouchableOpacity>

                <Text style={styles.tagText}>Tag: {tagID ?? 'No tag scanned'}</Text>

                <Modal visible={modalVisible} transparent animationType="slide">
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            {isExistingKandi ? (
                                <>
                                    <Text style={styles.modalTitle}>This kandi is already claimed!</Text>
                                    <Text style={styles.modalInfo}>Origin: {originLocation}</Text>
                                    <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
                                        <Text style={styles.buttonText}>OK</Text>
                                    </TouchableOpacity>
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
                                    <TouchableOpacity style={styles.modalButton} onPress={handleClaimKandi}>
                                        <Text style={styles.buttonText}>Claim Kandi</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.modalButton, styles.signOutButton]} onPress={() => setModalVisible(false)}>
                                        <Text style={styles.buttonText}>Cancel</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>
                </Modal>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f2f2' },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    title: { fontSize: 36, fontWeight: 'bold', color: '#000', marginBottom: 60, textAlign: 'center' },
    button: {
        width: '85%',
        paddingVertical: 12,
        backgroundColor: '#000',
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 15,
    },
    signUpButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#000',
    },
    signOutButton: {
        backgroundColor: '#ff5555',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    signUpText: {
        color: '#000',
    },
    tagText: { color: '#000', fontSize: 14, marginTop: 50, textAlign: 'center' },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#00000099',
    },
    modalContent: {
        width: '85%',
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 12,
        alignItems: 'center',
    },
    modalTitle: { color: '#000', fontSize: 22, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    modalInfo: { color: '#000', fontSize: 16, marginBottom: 20, textAlign: 'center' },
    modalButton: {
        width: '100%',
        paddingVertical: 14,
        backgroundColor: '#000',
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 10,
    },
    input: {
        width: '100%',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: '#f2f2f2',
        color: '#000',
        fontSize: 16,
        marginBottom: 15,
    },
});

export default NfcScreen;
