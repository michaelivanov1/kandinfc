import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, Text, StyleSheet, Alert, Modal, View, TextInput, TouchableOpacity, Animated, Easing } from 'react-native';
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

    const pulse = useRef(new Animated.Value(1)).current;

    // Pulse animation for scan button
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1.2, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();
    }, []);

    useEffect(() => {
        NfcManager.start();
        NfcManager.registerTagEvent()
            .then(() => console.log('NFC tag event registered'))
            .catch(err => console.warn('NFC tag registration failed', err));

        return () => { NfcManager.unregisterTagEvent().catch(() => { }); };
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
                history: [{ userId: user.uid, action: 'claimed', timestamp: firestore.Timestamp.now() }],
            });

            const userRef = firestore().collection('users').doc(user.uid);
            await userRef.update({ kandis: firestore.FieldValue.arrayUnion(tagID) });

            Alert.alert('Success', 'Kandi claimed and added to your profile!');
            setModalVisible(false);
            setOriginLocation('');
        } catch (err: any) {
            console.warn('Failed to claim kandi:', err);
            Alert.alert('Error', err.message ?? 'Could not claim kandi.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <Text style={styles.title}>Kandi NFC</Text>

            {/* Center pulsing scan button */}
            <View style={styles.center}>
                <Animated.View style={[styles.scanButtonWrapper, { transform: [{ scale: pulse }] }]}>
                    <TouchableOpacity style={styles.scanButton} onPress={readNfcTag} disabled={isReading}>
                        <Text style={styles.scanText}>{isReading ? 'Scanning...' : 'Scan Kandi'}</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>

            {/* Last scanned tag */}
            {tagID && <Text style={styles.tagText}>Last tag: {tagID}</Text>}

            {/* Modal */}
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
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f2f2', padding: 20 },
    title: { fontSize: 36, fontWeight: 'bold', color: '#000', textAlign: 'center', marginBottom: 60 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scanButtonWrapper: {
        borderRadius: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
        marginBottom: 30,
    },
    scanButton: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanText: { color: '#fff', fontSize: 18, fontWeight: '600', textAlign: 'center' },
    tagText: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#000' },

    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00000099' },
    modalContent: { width: '85%', padding: 20, backgroundColor: '#fff', borderRadius: 12, alignItems: 'center' },
    modalTitle: { color: '#000', fontSize: 22, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    modalInfo: { color: '#000', fontSize: 16, marginBottom: 20, textAlign: 'center' },
    modalButton: { width: '100%', paddingVertical: 14, backgroundColor: '#000', borderRadius: 10, alignItems: 'center', marginBottom: 10 },
    input: { width: '100%', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#f2f2f2', color: '#000', fontSize: 16, marginBottom: 15 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: '600', textAlign: 'center' },
});

export default NfcScreen;
