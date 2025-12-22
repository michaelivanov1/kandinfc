// src/screens/KandiDetailsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
    SafeAreaView,
    View,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    Platform,
    PermissionsAndroid,
    StyleSheet,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import ImagePicker from 'react-native-image-crop-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Text from '../components/Text';
import Button from '../components/Button';
import { Colors, Spacing } from '../theme';

interface RouteParams {
    tagID: string;
}

const KandiDetailsScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute();
    const { tagID } = route.params as RouteParams;

    const [kandiData, setKandiData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [creatorPhoto, setCreatorPhoto] = useState<string | null>(null);
    const [creatorName, setCreatorName] = useState<string>('Unknown');

    const currentUser = auth().currentUser;

    const formatDateOnly = (ts: any) => {
        if (!ts) return '';
        const date = ts.toDate ? ts.toDate() : new Date(ts);
        return date.toLocaleDateString('default', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    useEffect(() => {
        const fetchKandi = async () => {
            try {
                const doc = await firestore().collection('kandis').doc(tagID).get();
                if (!doc.exists) {
                    Alert.alert('Error', 'Kandi not found');
                    navigation.goBack();
                    return;
                }

                const data = doc.data();
                if (!data) {
                    Alert.alert('Error', 'Kandi data is missing');
                    navigation.goBack();
                    return;
                }

                setKandiData(data);

                if (data.creatorId) {
                    const userDoc = await firestore()
                        .collection('users')
                        .doc(data.creatorId)
                        .get();

                    if (userDoc.exists()) {
                        setCreatorName(userDoc.data()?.displayName || 'Unknown');
                        setCreatorPhoto(userDoc.data()?.profilePhoto || null);
                    }
                }
            } catch (err) {
                console.warn(err);
                Alert.alert('Error', 'Failed to fetch kandi data');
                navigation.goBack();
            } finally {
                setLoading(false);
            }
        };

        fetchKandi();
    }, [tagID, navigation]);

    const isOwnedByCurrentUser = () => {
        if (!currentUser || !kandiData) return false;
        return kandiData.history?.some((h: any) => h.userId === currentUser.uid);
    };

    const handleAdoptKandi = async () => {
        if (!currentUser)
            return Alert.alert('Login Required', 'You must be logged in to adopt a kandi.');

        if (currentUser.uid === kandiData.creatorId)
            return Alert.alert('Oops', 'You cannot adopt your own kandi.');

        if (isOwnedByCurrentUser())
            return Alert.alert('Oops', 'You already own this kandi.');

        try {
            let photoURL: string | null = null;

            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    {
                        title: 'Camera Permission',
                        message: 'Camera access is required to adopt a kandi.',
                        buttonPositive: 'OK',
                        buttonNegative: 'Cancel',
                    }
                );

                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    return Alert.alert('Permission denied', 'Camera is required.');
                }
            }

            const image = await ImagePicker.openCamera({
                width: 400,
                height: 400,
                cropping: true,
                compressImageQuality: 0.8,
            });

            if (image.path) {
                const ref = storage().ref(`kandiPhotos/${tagID}_${currentUser.uid}.jpg`);
                await ref.putFile(
                    image.path.startsWith('file://')
                        ? image.path
                        : `file://${image.path}`
                );
                photoURL = await ref.getDownloadURL();
            }

            const userRef = firestore().collection('users').doc(currentUser.uid);
            const userDoc = await userRef.get();
            const displayName = userDoc.data()?.displayName || 'Unknown';

            const historyEntry = {
                userId: currentUser.uid,
                displayName,
                action: 'adopted',
                timestamp: firestore.Timestamp.now(),
                photo: photoURL,
            };

            await firestore().collection('kandis').doc(tagID).update({
                history: firestore.FieldValue.arrayUnion(historyEntry),
            });

            await userRef.update({
                kandis: firestore.FieldValue.arrayUnion(tagID),
            });

            Alert.alert('Success', 'You adopted this kandi!');

            const updatedDoc = await firestore().collection('kandis').doc(tagID).get();
            setKandiData(updatedDoc.data());
        } catch (err) {
            console.warn(err);
            Alert.alert('Error', 'Failed to adopt kandi.');
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.center}>
                <Text variant="caption">Loading...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.backButton}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={28} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text variant="title" style={styles.header}>
                    Kandi Details
                </Text>

                <View style={styles.creatorContainer}>
                    {creatorPhoto && (
                        <Image source={{ uri: creatorPhoto }} style={styles.creatorPhoto} />
                    )}
                    <Text variant="subtitle">Created by {creatorName}</Text>
                </View>

                <View style={styles.divider} />

                {kandiData.history && kandiData.history.length > 0 && (
                    <>
                        <Text variant="subtitle" style={styles.sectionTitle}>
                            Timeline
                        </Text>

                        {kandiData.history
                            .slice()
                            .reverse()
                            .map((h: any, idx: number) => {
                                const historyIndex = kandiData.history.length - 1 - idx;
                                const journeyEntry = kandiData.journey[historyIndex];

                                return (
                                    <View key={idx} style={styles.timelineItem}>
                                        {journeyEntry?.photo && (
                                            <View style={styles.photoWrapper}>
                                                <Image
                                                    source={{ uri: journeyEntry.photo }}
                                                    style={styles.journeyPhoto}
                                                />

                                                {journeyEntry?.location && (
                                                    <View style={styles.photoOverlay}>
                                                        <Text variant="caption" style={styles.overlayText}>
                                                            {journeyEntry.location}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        )}

                                        <Text variant="caption" style={styles.timelineText}>
                                            {h.displayName} {h.action} on{' '}
                                            {formatDateOnly(h.timestamp)}
                                        </Text>
                                    </View>
                                );
                            })}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 105,
        left: 20,
        zIndex: 10,
    },
    scrollContent: {
        padding: Spacing.lg,
        paddingTop: 100,
    },
    header: {
        marginBottom: Spacing.lg,
    },
    creatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    creatorPhoto: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: Spacing.md,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.mutedText,
        marginVertical: Spacing.md,
    },
    sectionTitle: {
        marginBottom: Spacing.sm,
        marginTop: Spacing.md,
    },
    timelineItem: {
        marginBottom: Spacing.md,
        paddingBottom: Spacing.md,
    },
    timelineText: {
        marginTop: 6,
    },
    photoWrapper: {
        position: 'relative',
        marginTop: Spacing.sm,
    },
    journeyPhoto: {
        width: '100%',
        height: 180,
        borderRadius: 12,
    },
    photoOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
    },
    overlayText: {
        color: '#fff',
    },
});

export default KandiDetailsScreen;
