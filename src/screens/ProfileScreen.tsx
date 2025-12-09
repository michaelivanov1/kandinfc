// src/screens/ProfileScreen.tsx
import React, { useState, useCallback } from 'react';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import {
    SafeAreaView,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Alert,
    View,
    Image,
    ActivityIndicator,
    FlatList,
    Modal,
    Platform,
    PermissionsAndroid,
    Dimensions
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import ImagePicker from 'react-native-image-crop-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/Text';
import Button from '../components/Button';
import { Colors, FontSizes } from '../theme';

const screenWidth = Dimensions.get('window').width;

interface RouteParams { userId?: string; }
interface HistoryEntry { userId: string; displayName: string; action: string; timestamp: any; photo?: string; }
interface KandiItem { id: string; journey: { location: string; photo?: string }[]; history?: HistoryEntry[]; }

const ProfileScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute();
    const insets = useSafeAreaInsets();

    const routeUserId = (route.params as RouteParams)?.userId;
    const currentUser = auth().currentUser;
    const userId = routeUserId || currentUser?.uid;
    const isOwnProfile = userId === currentUser?.uid;
    const showBackButton = !!route.params;

    const [displayName, setDisplayName] = useState('');
    const [photoURL, setPhotoURL] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [editingName, setEditingName] = useState(false);
    const [kandis, setKandis] = useState<KandiItem[]>([]);
    const [photoModalVisible, setPhotoModalVisible] = useState(false);

    const formatTimestamp = (ts: any) => {
        if (!ts) return '';
        if (ts.toDate) return ts.toDate().toLocaleString();
        if (typeof ts === 'number') return new Date(ts).toLocaleString();
        return '';
    };

    // Load User & Kandis
    useFocusEffect(useCallback(() => {
        const loadUserData = async () => {
            if (!userId) return;
            try {
                const userDoc = await firestore().collection('users').doc(userId).get();
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setDisplayName(data?.displayName || '');
                    setPhotoURL(data?.profilePhoto || null);

                    const kandiIds: string[] = data?.kandis || [];
                    const loadedKandis: KandiItem[] = [];

                    for (const id of kandiIds) {
                        const doc = await firestore().collection('kandis').doc(id).get();
                        if (doc.exists()) {
                            const kData = doc.data();
                            loadedKandis.push({
                                id: doc.id,
                                journey: kData?.journey || [],
                                history: kData?.history || [],
                            });
                        }
                    }
                    setKandis(loadedKandis);
                }
            } catch (err) {
                console.warn(err);
                Alert.alert('Error', 'Failed to load profile.');
            }
        };
        loadUserData();
    }, [userId]));

    // Photo
    const pickOrTakeProfilePhoto = () => setPhotoModalVisible(true);

    const requestCameraPermission = async () => {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.CAMERA,
                {
                    title: 'Camera Permission',
                    message: 'Camera access is required to take a profile photo.',
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
        if (!(await requestCameraPermission())) {
            Alert.alert('Permission denied', 'Camera access is required.');
            return;
        }
        try {
            const image = await ImagePicker.openCamera({ width: 400, height: 400, cropping: true, compressImageQuality: 0.8 });
            if (image.path) await uploadProfilePhoto(image.path);
        } catch (err: any) {
            if (err.code !== 'E_PICKER_CANCELLED') Alert.alert('Error', err.message);
        } finally { setPhotoModalVisible(false); }
    };

    const pickProfilePhotoFromGallery = async () => {
        try {
            const image = await ImagePicker.openPicker({ width: 400, height: 400, cropping: true, compressImageQuality: 0.8 });
            if (image.path) await uploadProfilePhoto(image.path);
        } catch (err: any) {
            if (err.code !== 'E_PICKER_CANCELLED') Alert.alert('Error', err.message);
        } finally { setPhotoModalVisible(false); }
    };

    const uploadProfilePhoto = async (filePath: string) => {
        if (!userId) return;
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
            Alert.alert('Error', 'Failed to upload profile photo.');
        } finally { setUploading(false); }
    };

    // Display Name
    const handleSaveName = async () => {
        if (!userId) return;
        try {
            setLoading(true);
            await firestore().collection('users').doc(userId).update({ displayName });
            setEditingName(false);
        } catch (err) {
            console.warn(err);
            Alert.alert('Error', 'Failed to update display name.');
        } finally { setLoading(false); }
    };

    // Header
    const renderHeader = () => (
        <View style={{ alignItems: 'center', padding: 20 }}>
            <TouchableOpacity onPress={pickOrTakeProfilePhoto} disabled={!isOwnProfile}>
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
                            <Icon name="check" size={20} color={'white'} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.nameDisplayContainer}>
                        <Text variant='title' style={{ marginRight: 6 }}>{displayName || 'Unnamed User'}</Text>
                        {isOwnProfile && (
                            <TouchableOpacity onPress={() => setEditingName(true)}>
                                <Icon name="edit" size={18} color={'white'} />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
            <View>
                <Text style={{ color: Colors.mutedText, marginTop: 8, fontSize: 8 }}>
                    Member since {currentUser?.metadata?.creationTime
                        ? new Date(currentUser.metadata.creationTime).toLocaleString('default', {
                            month: 'short',
                            year: 'numeric',
                        })
                        : 'Unknown'}
                </Text>
            </View>
            <View style={{ marginTop: 36, marginBottom: 24, height: 0.5, backgroundColor: Colors.mutedText, width: '100%' }} />
            <Text style={{ fontSize: 16, textAlign: 'left' }}>My Collection</Text>
        </View>
    );

    // Grid item renderer 
    const renderKandiItem = ({ item }: any) => {
        const latestJourney = item.journey[item.journey.length - 1];
        const photoSource = latestJourney?.photo
            ? { uri: latestJourney.photo }
            : require('../assets/add-kandi-image.png');

        const numColumns = 2;
        const margin = 16;
        const itemWidth = (screenWidth - margin * (numColumns + 1)) / numColumns;

        return (
            <TouchableOpacity
                style={{
                    width: itemWidth,
                    aspectRatio: 1,
                    marginLeft: margin,
                    marginBottom: 16,
                    borderRadius: 8,
                    overflow: 'hidden',
                    borderWidth: 0.8,
                    borderColor: 'rgba(255,255,255,0.1)',
                    backgroundColor: '#111',
                }}
                onPress={() => navigation.navigate('KandiDetails', { tagID: item.id })}
                activeOpacity={0.8}
            >
                <Image source={photoSource} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingVertical: 6, paddingHorizontal: 8, backgroundColor: 'rgba(0, 0, 0, 0.45)' }}>
                    <Text style={{ color: '#fff', textAlign: 'center', fontSize: FontSizes.subtitle }}>
                        {latestJourney?.location || 'Unknown'}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {showBackButton && (
                <View style={[styles.headerContainer, { marginTop: insets.top + 10 }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Icon name="arrow-back" size={28} color={'white'} />
                    </TouchableOpacity>
                </View>
            )}

            <FlatList
                data={kandis}
                keyExtractor={(item) => item.id}
                numColumns={2}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={{ paddingBottom: 40 }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            No Kandi Here Yet
                        </Text>
                        <Text style={styles.emptySubText}>
                            Your collection is waiting to begin. Start scanning to add your first piece.
                        </Text>
                    </View>
                }
                renderItem={renderKandiItem}
            />

            {/* Profile Photo Modal */}
            <Modal visible={photoModalVisible} transparent animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text variant="title" style={styles.modalTitle}>Update Profile Photo</Text>
                        <Button title="Take Photo" onPress={takeProfilePhoto} style={{ marginBottom: 10 }} />
                        <Button title="Choose from Gallery" onPress={pickProfilePhotoFromGallery} style={{ marginBottom: 10 }} variant="outline" />
                        {/* <Text style={{ fontSize: 8, color: Colors.mutedText }}>A photo is required to complete your collection</Text> */}
                        <Button title="Cancel" onPress={() => setPhotoModalVisible(false)} variant="outline" />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background, paddingTop: 60 },
    profilePhoto: { width: 100, height: 100, borderRadius: 50, marginBottom: 12, backgroundColor: '#ddd' },
    loadingPhoto: { justifyContent: 'center', alignItems: 'center' },
    nameContainer: { alignItems: 'center' },
    nameDisplayContainer: { flexDirection: 'row', alignItems: 'center' },
    editNameContainer: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#ccc' },
    nameInput: { fontSize: 14, color: Colors.text, paddingVertical: 2, paddingRight: 10, minWidth: 120 },
    emptyContainer: { alignItems: 'center', marginTop: 100, },
    emptyText: { fontSize: 12, marginBottom: 14, },
    emptySubText: { fontSize: 8, paddingHorizontal: 60, textAlign: 'center' },
    headerContainer: { width: '100%', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#f8f8f8', flexDirection: 'row', alignItems: 'center', zIndex: 999 },
    backButton: { backgroundColor: '#fff', borderRadius: 20, padding: 6, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '85%', padding: 20, backgroundColor: Colors.modalBackground, borderRadius: 12, alignItems: 'center' },
    modalTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 24 },
});

export default ProfileScreen;
