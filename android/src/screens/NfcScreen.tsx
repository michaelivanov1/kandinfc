// src/screens/NfcScreen.tsx
import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text, StyleSheet, Button, Alert, Modal, View, TextInput, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
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
        <LinearGradient colors={['#00c6ff', '#0072ff']} style={styles.container}>
            <SafeAreaView style={styles.content}>
                <Text style={styles.title}>Kandi NFC App</Text>

                <TouchableOpacity style={styles.mainButton} onPress={readNfcTag} disabled={isReading}>
                    <Text style={styles.buttonText}>{isReading ? 'Scanning...' : 'Scan Kandi'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Profile')}>
                    <Text style={styles.buttonText}>Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: '#ff5555' }]} onPress={handleSignOut}>
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
                                    <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#ff5555' }]} onPress={() => setModalVisible(false)}>
                                        <Text style={styles.buttonText}>Cancel</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    title: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginBottom: 60 },
    mainButton: {
        width: '80%',
        paddingVertical: 18,
        backgroundColor: '#ffffff66',
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
    },
    secondaryButton: {
        width: '60%',
        paddingVertical: 14,
        backgroundColor: '#ffffff33',
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 15,
    },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
    tagText: { color: '#fff', fontSize: 14, marginTop: 50, textAlign: 'center' },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#00000099',
    },
    modalContent: {
        width: '85%',
        padding: 20,
        backgroundColor: '#0072ff',
        borderRadius: 12,
        alignItems: 'center',
    },
    modalTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    modalInfo: { color: '#fff', fontSize: 16, marginBottom: 20, textAlign: 'center' },
    modalButton: {
        width: '100%',
        paddingVertical: 14,
        backgroundColor: '#00c6ff',
        borderRadius: 10,
        alignItems: 'center',
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
        marginBottom: 15,
    },
});

export default NfcScreen;
