import React, { useState, useEffect, useRef } from 'react';
import {
    SafeAreaView,
    Text,
    StyleSheet,
    Alert,
    Modal,
    View,
    TextInput,
    TouchableOpacity,
    Animated,
    Easing,
    Image,
    Platform,
    PermissionsAndroid,
    ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import ImagePicker from 'react-native-image-crop-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';

NfcManager.start();

const NfcScreen = () => {
    const navigation = useNavigation<any>();
    const [tagID, setTagID] = useState<string | null>(null);
    const [isReading, setIsReading] = useState(false);
    const [locationModalVisible, setLocationModalVisible] = useState(false);
    const [photoModalVisible, setPhotoModalVisible] = useState(false);
    const [originLocation, setOriginLocation] = useState('');
    const [photo, setPhoto] = useState<string | null>(null);
    const [isAdopting, setIsAdopting] = useState(false);

    const currentUser = auth().currentUser;
    const pulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1.2, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();
    }, []);

    useEffect(() => {
        NfcManager.registerTagEvent().catch(err => console.warn('NFC registration failed', err));
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
                const data = doc.data();
                if (currentUser?.uid === data?.creatorId) {
                    // Your own kandi → go to details
                    navigation.navigate('KandiDetails', { tagID: id });
                    return;
                }
                // Someone else's kandi → show adoption modal
                setIsAdopting(true);
                setOriginLocation('');
                setPhoto(null);
                setLocationModalVisible(true);
            } else {
                // New kandi → normal claim flow
                setIsAdopting(false);
                setOriginLocation('');
                setPhoto(null);
                setLocationModalVisible(true);
            }
        } catch (ex) {
            console.warn('NFC error', ex);
            Alert.alert('NFC Error', ex?.toString());
        } finally {
            setIsReading(false);
            await NfcManager.cancelTechnologyRequest().catch(() => { });
        }
    };

    const handleLocationNext = () => {
        if (!originLocation.trim() && !isAdopting) {
            return Alert.alert('Error', 'Please enter the origin location.');
        }
        setLocationModalVisible(false);
        setPhotoModalVisible(true);
    };

    const requestCameraPermission = async () => {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.CAMERA,
                {
                    title: 'Camera Permission',
                    message: 'We need access to your camera to take a photo for your kandi journey.',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
    };

    const handleTakePhoto = async () => {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
            Alert.alert('Permission denied', 'Camera access is required to take a photo.');
            return;
        }

        try {
            const image = await ImagePicker.openCamera({
                width: 400,
                height: 400,
                cropping: true,
                compressImageQuality: 0.8,
            });
            if (image.path) setPhoto(image.path);
        } catch (err: any) {
            if (err.code !== 'E_PICKER_CANCELLED') {
                console.warn(err);
                Alert.alert('Error', err.message);
            }
        }
    };

    const handleClaimOrAdoptKandi = async () => {
        if (!tagID) return;
        try {
            const user = auth().currentUser;
            if (!user) return Alert.alert('Error', 'You must be signed in.');

            const userDoc = await firestore().collection('users').doc(user.uid).get();
            const displayName = userDoc.data()?.displayName || 'Unknown';

            const kandiRef = firestore().collection('kandis').doc(tagID);
            let photoURL: string | null = null;

            if (photo) {
                const ref = storage().ref(`kandiPhotos/${tagID}_${Date.now()}.jpg`);
                await ref.putFile(photo.startsWith('file://') ? photo : `file://${photo}`);
                photoURL = await ref.getDownloadURL();
            }

            if (isAdopting) {
                // Adoption: append to journey & history
                await kandiRef.update({
                    journey: firestore.FieldValue.arrayUnion({ location: originLocation, photo: photoURL }),
                    history: firestore.FieldValue.arrayUnion({
                        userId: user.uid,
                        displayName,
                        action: 'adopted',
                        timestamp: firestore.Timestamp.now(),
                        photo: photoURL,
                        location: originLocation || null
                    }),
                });
            } else {
                // New kandi: create doc
                await kandiRef.set({
                    originLocation,
                    creatorId: user.uid,
                    journey: [{ location: originLocation, photo: photoURL }],
                    createdAt: firestore.FieldValue.serverTimestamp(),
                    history: [{
                        userId: user.uid,
                        displayName,
                        action: 'claimed',
                        timestamp: firestore.Timestamp.now(),
                        photo: photoURL,
                        location: originLocation
                    }],
                });
            }

            await firestore().collection('users').doc(user.uid).update({
                kandis: firestore.FieldValue.arrayUnion(tagID),
            });

            Alert.alert('Success', isAdopting ? 'You adopted this kandi!' : 'Kandi claimed and added to your profile!');
            setPhotoModalVisible(false);
            setOriginLocation('');
            setPhoto(null);
            setIsAdopting(false);
        } catch (err: any) {
            console.warn(err);
            Alert.alert('Error', err.message ?? 'Could not complete action.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Kandi NFC</Text>
            <View style={styles.center}>
                <Animated.View style={[styles.scanButtonWrapper, { transform: [{ scale: pulse }] }]}>
                    <TouchableOpacity style={styles.scanButton} onPress={readNfcTag} disabled={isReading}>
                        <Text style={styles.scanText}>{isReading ? 'Scanning...' : 'Scan Kandi'}</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
            {tagID && <Text style={styles.tagText}>Last tag: {tagID}</Text>}

            {/* Location / Adoption Modal */}
            <Modal visible={locationModalVisible} transparent animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{isAdopting ? 'Kandi Found!' : 'New kandi found!'}</Text>

                        <TextInput
                            placeholder={isAdopting ? 'Enter adoption location (optional)' : 'Enter origin location'}
                            placeholderTextColor="#aaa"
                            style={styles.input}
                            value={originLocation}
                            onChangeText={setOriginLocation}
                        />

                        {isAdopting && (
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: '#2196F3' }]}
                                onPress={() => {
                                    setLocationModalVisible(false);
                                    navigation.navigate('KandiDetails', { tagID });
                                }}
                            >
                                <Text style={styles.buttonText}>Show Kandi History</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity style={styles.modalButton} onPress={handleLocationNext}>
                            <Text style={styles.buttonText}>{isAdopting ? 'Adopt Kandi' : 'Next'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalButton, { backgroundColor: '#ff5555' }]}
                            onPress={() => setLocationModalVisible(false)}
                        >
                            <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Photo Modal */}
            <Modal visible={photoModalVisible} transparent animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add a photo</Text>
                        {photo && <Image source={{ uri: photo }} style={{ width: 200, height: 200, marginBottom: 15, borderRadius: 12 }} />}

                        {!photo ? (
                            <TouchableOpacity style={styles.modalButton} onPress={handleTakePhoto}>
                                <Text style={styles.buttonText}>Take Photo</Text>
                            </TouchableOpacity>
                        ) : (
                            <>
                                <TouchableOpacity style={styles.modalButton} onPress={handleClaimOrAdoptKandi}>
                                    <Text style={styles.buttonText}>Add Photo</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#888' }]} onPress={handleTakePhoto}>
                                    <Text style={styles.buttonText}>Retake Photo</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {/* <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#555' }]} onPress={handleClaimOrAdoptKandi}>
                            <Text style={styles.buttonText}>Skip / Add Later</Text>
                        </TouchableOpacity> */}
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
    modalButton: { width: '100%', paddingVertical: 14, backgroundColor: '#000', borderRadius: 10, alignItems: 'center', marginBottom: 10 },
    input: { width: '100%', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#f2f2f2', color: '#000', fontSize: 16, marginBottom: 15 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: '600', textAlign: 'center' },
});

export default NfcScreen;
