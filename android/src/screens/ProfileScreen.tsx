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
    ScrollView
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

    // Show back button if the screen was opened via navigation (scanning a kandi or other user)
    const showBackButton = !!route.params;

    const [displayName, setDisplayName] = useState('');
    const [photoURL, setPhotoURL] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isEditable, setIsEditable] = useState(false);
    const [editingName, setEditingName] = useState(false);
    const [lore, setLore] = useState<string[]>([]);
    const [history, setHistory] = useState<any[]>([]);

    // Load user data whenever screen focuses
    useFocusEffect(
        useCallback(() => {
            const loadUser = async () => {
                if (!userId) return;

                setIsEditable(userId === currentUser?.uid);

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

                    const userLore: string[] = [];
                    const userHistory: any[] = [];

                    kandisSnapshot.forEach(doc => {
                        const data = doc.data();
                        if (data.lore) userLore.push(...data.lore);
                        if (data.history) userHistory.push(...data.history);
                    });

                    setLore(userLore);
                    setHistory(userHistory);
                } catch (err) {
                    console.warn('Error loading profile:', err);
                    Alert.alert('Error', 'Failed to load profile.');
                }
            };

            loadUser();
        }, [userId])
    );

    const pickAndUploadImage = async () => {
        if (!isEditable) return;

        try {
            const image = await ImagePicker.openPicker({
                width: 400,
                height: 400,
                cropping: true,
                compressImageQuality: 0.8
            });
            if (image.path) {
                setUploading(true);
                const filePath = image.path.startsWith('file://') ? image.path : `file://${image.path}`;
                const ref = storage().ref(`profilePhotos/${userId}.jpg`);
                await ref.putFile(filePath);
                const url = await ref.getDownloadURL();
                await firestore().collection('users').doc(userId).update({ profilePhoto: url });
                setPhotoURL(url);
            }
        } catch (err: any) {
            if (err.code !== 'E_PICKER_CANCELLED') {
                console.warn(err);
                Alert.alert('Error', err.message);
            }
        } finally {
            setUploading(false);
        }
    };

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

    return (
        <SafeAreaView style={styles.container}>
            {/* Back button only if screen opened via navigation */}
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
                <TouchableOpacity onPress={pickAndUploadImage} disabled={!isEditable}>
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

                {/* Lore */}
                <Text style={styles.sectionTitle}>Lore</Text>
                {lore.length ? lore.map((l, i) => (
                    <Text key={i} style={styles.itemText}>{i + 1}. {l}</Text>
                )) : <Text style={styles.emptyText}>No lore yet</Text>}

                {/* History */}
                <Text style={styles.sectionTitle}>History</Text>
                {history.length ? history.map((h, i) => (
                    <Text key={i} style={styles.itemText}>
                        {h.action} at {h.timestamp?.toDate().toLocaleString()}
                    </Text>
                )) : <Text style={styles.emptyText}>No history yet</Text>}
            </ScrollView>
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
    itemText: { fontSize: 13, color: '#444', alignSelf: 'flex-start', marginBottom: 4 },
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
});

export default ProfileScreen;
