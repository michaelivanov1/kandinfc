// src/screens/ProfileScreen.tsx
import React, { useState, useCallback } from 'react';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import {
    SafeAreaView,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Alert,
    View,
    Image,
    ActivityIndicator,
    ScrollView,
    FlatList,
    Modal,
    Platform,
    PermissionsAndroid
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import ImagePicker from 'react-native-image-crop-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface RouteParams {
    userId?: string;
}

const ProfileScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute();
    const insets = useSafeAreaInsets();

    const routeUserId = (route.params as RouteParams)?.userId;
    const currentUser = auth().currentUser;
    const userId = routeUserId || currentUser?.uid;

    const showBackButton = !!route.params;
    const isOwnProfile = userId === currentUser?.uid;

    const [displayName, setDisplayName] = useState('');
    const [photoURL, setPhotoURL] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isEditable, setIsEditable] = useState(false);
    const [editingName, setEditingName] = useState(false);
    const [journey, setJourney] = useState<{ id: string; location: string; photo?: string }[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [photoModalVisible, setPhotoModalVisible] = useState(false);

    // Load user data whenever screen focuses
    useFocusEffect(
        useCallback(() => {
            const loadUser = async () => {
                if (!userId) return;

                setIsEditable(isOwnProfile);

                try {
                    // User info
                    const doc = await firestore().collection('users').doc(userId).get();
                    if (doc.exists()) {
                        const data = doc.data();
                        setDisplayName(data?.displayName || '');
                        setPhotoURL(data?.profilePhoto || null);
                    }

                    // Kandi data
                    const kandisSnapshot = await firestore()
                        .collection('kandis')
                        .where('creatorId', '==', userId)
                        .get();

                    const userJourney: { id: string; location: string; photo?: string }[] = [];
                    const userHistory: any[] = [];

                    kandisSnapshot.forEach(doc => {
                        const data = doc.data();
                        if (data.journey && data.journey.length) {
                            data.journey.forEach((j: any) => {
                                userJourney.push({
                                    id: doc.id,
                                    location: j.location,
                                    photo: j.photo || undefined,
                                });
                            });
                        }
                        if (data.history) userHistory.push(...data.history);
                    });

                    setJourney(userJourney);
                    setHistory(userHistory);
                } catch (err) {
                    console.warn('Error loading profile:', err);
                    Alert.alert('Error', 'Failed to load profile.');
                }
            };

            loadUser();
        }, [userId])
    );

    // ======== Profile Photo Handlers ========
    const pickOrTakeProfilePhoto = () => {
        if (!isEditable) return;
        setPhotoModalVisible(true);
    };

    const requestCameraPermission = async (): Promise<boolean> => {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.CAMERA,
                {
                    title: 'Camera Permission',
                    message: 'We need access to your camera to take a profile photo.',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
    };

    const takeProfilePhoto = async () => {
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
            if (image.path) await uploadProfilePhoto(image.path);
        } catch (err: any) {
            if (err.code !== 'E_PICKER_CANCELLED') {
                console.warn(err);
                Alert.alert('Error', err.message);
            }
        } finally {
            setPhotoModalVisible(false);
        }
    };

    const pickProfilePhotoFromGallery = async () => {
        try {
            const image = await ImagePicker.openPicker({
                width: 400,
                height: 400,
                cropping: true,
                compressImageQuality: 0.8,
            });
            if (image.path) await uploadProfilePhoto(image.path);
        } catch (err: any) {
            if (err.code !== 'E_PICKER_CANCELLED') {
                console.warn(err);
                Alert.alert('Error', err.message);
            }
        } finally {
            setPhotoModalVisible(false);
        }
    };

    const uploadProfilePhoto = async (filePath: string) => {
        try {
            setUploading(true);
            const path = filePath.startsWith('file://') ? filePath : `file://${filePath}`;
            const ref = storage().ref(`profilePhotos/${userId}.jpg`);
            await ref.putFile(path);
            const url = await ref.getDownloadURL();
            await firestore().collection('users').doc(userId).update({ profilePhoto: url });
            setPhotoURL(url);
        } catch (err) {
            console.warn(err);
            Alert.alert('Error', 'Failed to upload profile photo');
        } finally {
            setUploading(false);
        }
    };

    // ======== Display Name Handlers ========
    const handleSaveName = async () => {
        try {
            setLoading(true);
            await firestore().collection('users').doc(userId).update({ displayName });
            setEditingName(false);
        } catch (err) {
            console.warn(err);
            Alert.alert('Error', 'Failed to update display name');
        } finally {
            setLoading(false);
        }
    };

    // ======== Journey Photo ========
    const pickJourneyPhoto = async (index: number) => {
        try {
            const image = await ImagePicker.openPicker({
                width: 400,
                height: 400,
                cropping: true,
                compressImageQuality: 0.8
            });
            if (image.path) {
                const filePath = image.path.startsWith('file://') ? image.path : `file://${image.path}`;
                const journeyItem = journey[index];
                const storageRef = storage().ref(`kandiPhotos/${journeyItem.id}.jpg`);
                await storageRef.putFile(filePath);
                const url = await storageRef.getDownloadURL();

                const kandiRef = firestore().collection('kandis').doc(journeyItem.id);
                const kandiDoc = await kandiRef.get();
                if (kandiDoc.exists()) {
                    const data = kandiDoc.data();
                    const updatedJourney = data?.journey.map((j: any) =>
                        j.location === journeyItem.location ? { ...j, photo: url } : j
                    );
                    await kandiRef.update({ journey: updatedJourney });
                }

                const newJourney = [...journey];
                newJourney[index].photo = url;
                setJourney(newJourney);
            }
        } catch (err: any) {
            if (err.code !== 'E_PICKER_CANCELLED') {
                console.warn(err);
                Alert.alert('Error', err.message);
            }
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {showBackButton && (
                <View style={[styles.headerContainer, { marginTop: insets.top + 10 }]}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Icon name="arrow-back" size={28} color="#000" />
                    </TouchableOpacity>
                </View>
            )}

            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {/* Profile Photo */}
                <TouchableOpacity onPress={pickOrTakeProfilePhoto} disabled={!isEditable}>
                    {uploading ? (
                        <View style={[styles.profilePhoto, styles.loadingPhoto]}>
                            <ActivityIndicator size="large" color="#fff" />
                        </View>
                    ) : (
                        <Image
                            source={photoURL ? { uri: photoURL } : require('../assets/default-profile.png')}
                            style={styles.profilePhoto}
                        />
                    )}
                </TouchableOpacity>

                {/* Display Name */}
                <View style={styles.nameContainer}>
                    {editingName ? (
                        <View style={styles.editNameContainer}>
                            <TextInput
                                style={styles.nameInput}
                                value={displayName}
                                onChangeText={setDisplayName}
                                autoFocus
                                onSubmitEditing={handleSaveName}
                            />
                            <TouchableOpacity onPress={handleSaveName} disabled={loading}>
                                <Icon name="check" size={20} color="#000" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.nameDisplayContainer}>
                            <Text style={styles.displayName}>{displayName || 'Unnamed User'}</Text>
                            {isEditable && (
                                <TouchableOpacity onPress={() => setEditingName(true)}>
                                    <Icon name="edit" size={18} color="#555" style={{ marginLeft: 6 }} />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>

                {/* Journey */}
                <Text style={styles.sectionTitle}>{isOwnProfile ? 'Your Kandi:' : 'Their Kandi:'}</Text>
                {journey.filter(j => j.location).length ? (
                    <FlatList
                        data={journey.filter(j => j.location)}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item, index) => index.toString()}
                        contentContainerStyle={{ paddingVertical: 10 }}
                        renderItem={({ item, index }) => (
                            <View style={styles.journeyCard}>
                                <Text style={styles.journeyTitle}>{item.location}</Text>
                                <TouchableOpacity onPress={() => isEditable && pickJourneyPhoto(index)}>
                                    <Image
                                        source={
                                            item.photo
                                                ? { uri: item.photo }
                                                : require('../assets/add-kandi-image.png')
                                        }
                                        style={styles.journeyPhoto}
                                    />
                                </TouchableOpacity>
                            </View>
                        )}
                    />
                ) : (
                    <Text style={styles.emptyText}>No kandi yet! scan a kandi to get started</Text>
                )}
            </ScrollView>

            {/* Profile Photo Modal */}
            <Modal visible={photoModalVisible} transparent animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Update Profile Photo</Text>
                        <TouchableOpacity style={styles.modalButton} onPress={takeProfilePhoto}>
                            <Text style={styles.buttonText}>Take Photo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalButton} onPress={pickProfilePhotoFromGallery}>
                            <Text style={styles.buttonText}>Choose from Gallery</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#888' }]} onPress={() => setPhotoModalVisible(false)}>
                            <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f8f8' },
    scrollContainer: { alignItems: 'center', padding: 20 },
    profilePhoto: { width: 100, height: 100, borderRadius: 50, marginTop: 20, marginBottom: 12, backgroundColor: '#ddd' },
    loadingPhoto: { justifyContent: 'center', alignItems: 'center' },
    nameContainer: { alignItems: 'center', marginBottom: 20 },
    nameDisplayContainer: { flexDirection: 'row', alignItems: 'center' },
    displayName: { fontSize: 18, fontWeight: '600', color: '#000' },
    editNameContainer: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#ccc' },
    nameInput: { fontSize: 16, color: '#000', paddingVertical: 2, paddingRight: 10, minWidth: 120 },
    sectionTitle: { fontSize: 14, fontWeight: '600', color: '#333', alignSelf: 'flex-start', marginTop: 16 },
    emptyText: { fontSize: 13, color: '#999', alignSelf: 'flex-start', fontStyle: 'italic' },
    headerContainer: {
        width: '100%',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#f8f8f8',
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 999,
    },
    backButton: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 6,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    journeyCard: {
        width: 200,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginRight: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
        alignItems: 'center',
    },
    journeyTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
        textAlign: 'center',
    },
    journeyPhoto: {
        width: 160,
        height: 160,
        borderRadius: 12,
    },
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00000099' },
    modalContent: { width: '85%', padding: 20, backgroundColor: '#fff', borderRadius: 12, alignItems: 'center' },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#000', marginBottom: 15 },
    modalButton: { width: '100%', paddingVertical: 14, backgroundColor: '#000', borderRadius: 10, alignItems: 'center', marginBottom: 10 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: '600', textAlign: 'center' },
});

export default ProfileScreen;
