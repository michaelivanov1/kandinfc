import React, { useState, useEffect, useRef } from 'react';
import {
    SafeAreaView,
    View,
    StyleSheet,
    Alert,
    Modal,
    TextInput,
    Animated,
    Easing,
    Image,
    Platform,
    PermissionsAndroid,
    TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import NfcManager, { NfcTech, NfcEvents, Ndef } from 'react-native-nfc-manager';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import ImagePicker from 'react-native-image-crop-picker';
import Button from '../components/Button';
import Text from '../components/Text';
import { Colors } from '../theme';

// Start NFC
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
    const [kandiData, setKandiData] = useState<any>(null);

    const currentUser = auth().currentUser;
    const pulse = useRef(new Animated.Value(1)).current;

    // Pulse animation
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, {
                    toValue: 1.2,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulse, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    // NFC initialization for Android
    useEffect(() => {
        if (Platform.OS === 'android') {
            NfcManager.start()
                .then(() => NfcManager.registerTagEvent())
                .catch(() => { });
            return () => {
                NfcManager.unregisterTagEvent().catch(() => { });
            };
        }
    }, []);

    // --- NFC Read function (cross-platform) ---
    const readNfcTag = async () => {
        if (isReading) return;

        try {
            setIsReading(true);

            if (Platform.OS === 'ios') {
                await NfcManager.requestTechnology(NfcTech.Ndef, {
                    alertMessage: 'Hold your phone near the tag',
                });
                const tag = await NfcManager.getTag();
                NfcManager.invalidateSessionIOS();

                if (!tag) throw new Error('No tag detected');

                let id: string | null = null;
                const record = tag.ndefMessage?.[0];
                if (record?.payload) {
                    const payload = new Uint8Array(record.payload);
                    id = Ndef.text.decodePayload(payload);
                }

                if (!id) throw new Error('Failed to read tag ID');

                setTagID(id);
                Alert.alert('Tag Read', `ID: ${id}`);
            } else {
                // Android flow
                await NfcManager.requestTechnology(NfcTech.Ndef);
                const tag = await NfcManager.getTag();
                setTagID(tag?.id ?? null);
            }
        } catch (err: any) {
            Alert.alert('NFC Error', err.message || 'Scan failed');
        } finally {
            setIsReading(false);
            if (Platform.OS === 'ios') NfcManager.invalidateSessionIOS();
            else await NfcManager.cancelTechnologyRequest().catch(() => { });
        }
    };

    // --- Camera, photo, location, claim/adopt code remains unchanged ---
    const handleLocationNext = () => {
        if (!originLocation.trim() && !isAdopting) {
            return Alert.alert('Error', 'Please enter the origin location.');
        }
        setLocationModalVisible(false);
        setPhotoModalVisible(true);
    };

    const requestCameraPermission = async () => {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
                title: 'Camera Permission',
                message: 'We need access to your camera to take a photo for your kandi journey.',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
            });
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
                await kandiRef.update({
                    journey: firestore.FieldValue.arrayUnion({ location: originLocation, photo: photoURL }),
                    history: firestore.FieldValue.arrayUnion({
                        userId: user.uid,
                        displayName,
                        action: 'adopted',
                        timestamp: firestore.Timestamp.now(),
                        photo: photoURL,
                        location: originLocation || null,
                    }),
                });
            } else {
                await kandiRef.set({
                    originLocation,
                    creatorId: user.uid,
                    journey: [{ location: originLocation, photo: photoURL }],
                    createdAt: firestore.FieldValue.serverTimestamp(),
                    history: [
                        {
                            userId: user.uid,
                            displayName,
                            action: 'claimed',
                            timestamp: firestore.Timestamp.now(),
                            photo: photoURL,
                            location: originLocation,
                        },
                    ],
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

    const currentOwnerId = kandiData?.history?.length ? kandiData.history[kandiData.history.length - 1].userId : null;
    const [currentOwnerPhoto, setCurrentOwnerPhoto] = useState<string | null>(null);
    const [currentOwnerName, setCurrentOwnerName] = useState<string>('Unknown');

    useEffect(() => {
        if (currentOwnerId) {
            firestore()
                .collection('users')
                .doc(currentOwnerId)
                .get()
                .then(doc => {
                    if (doc.exists()) {
                        setCurrentOwnerPhoto(doc.data()?.profilePhoto || null);
                        setCurrentOwnerName(doc.data()?.displayName || 'Unknown');
                    }
                });
        }
    }, [currentOwnerId]);

    // --- UI Rendering ---
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.center}>
                <Animated.View style={[styles.scanButtonWrapper, { transform: [{ scale: pulse }] }]}>
                    <Button
                        title={isReading ? 'Scanning...' : 'Scan Kandi'}
                        onPress={readNfcTag}
                        disabled={false}
                        style={styles.scanButton}
                    />
                </Animated.View>
            </View>
            {tagID && <Text variant="caption" style={styles.tagText}>Last tag: {tagID}</Text>}

            {/* Location Modal */}
            {/* ... same as before ... */}

            {/* Photo Modal */}
            {/* ... same as before ... */}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background, padding: 20 },
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
    scanButton: { width: 160, height: 160, borderRadius: 80, justifyContent: 'center', alignItems: 'center' },
    tagText: { textAlign: 'center', marginTop: 20, color: '#000' },
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { width: '90%', padding: 16, backgroundColor: Colors.modalBackground, borderRadius: 12, alignItems: 'center' },
    modalTitle: { marginBottom: 24, textAlign: 'center' },
    modalSubtitle: { marginBottom: 36, textAlign: 'center' },
    inputLabel: { alignSelf: 'flex-start', marginBottom: 12 },
    modalButtonRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 10 },
    modalButton: { flex: 1, marginHorizontal: 5 },
    input: {
        width: '100%',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 15,
        backgroundColor: 'rgba(255,255,255,0.05)',
        color: '#fff',
    },
});

export default NfcScreen;
