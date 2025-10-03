// import React, { useEffect, useState } from 'react';
// import { SafeAreaView, Text, StyleSheet, TouchableOpacity, View, Image, Alert, ScrollView } from 'react-native';
// import firestore from '@react-native-firebase/firestore';
// import { useNavigation, useRoute } from '@react-navigation/native';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';

// interface RouteParams {
//     tagID: string;
// }

// const KandiDetailsScreen = () => {
//     const navigation = useNavigation<any>();
//     const route = useRoute();
//     const insets = useSafeAreaInsets();
//     const { tagID } = route.params as RouteParams;

//     const [kandiData, setKandiData] = useState<any>(null);
//     const [loading, setLoading] = useState(true);
//     const [creatorPhoto, setCreatorPhoto] = useState<string | null>(null);
//     const [creatorName, setCreatorName] = useState<string>('Unknown');

//     useEffect(() => {
//         const fetchKandi = async () => {
//             try {
//                 const doc = await firestore().collection('kandis').doc(tagID).get();
//                 if (!doc.exists) {
//                     Alert.alert('Error', 'Kandi not found');
//                     navigation.goBack();
//                     return;
//                 }

//                 const data = doc.data();
//                 if (!data) {
//                     Alert.alert('Error', 'Kandi data is missing');
//                     navigation.goBack();
//                     return;
//                 }

//                 setKandiData(data);

//                 // Fetch creator info
//                 if (data.creatorId) {
//                     const userDoc = await firestore().collection('users').doc(data.creatorId).get();
//                     if (userDoc.exists()) {
//                         setCreatorName(userDoc.data()?.displayName || 'Unknown');
//                         setCreatorPhoto(userDoc.data()?.profilePhoto || null);
//                     }
//                 }
//             } catch (err) {
//                 console.warn(err);
//                 Alert.alert('Error', 'Failed to fetch kandi data');
//                 navigation.goBack();
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchKandi();
//     }, [tagID]);

//     if (loading) return <Text style={styles.text}>Loading...</Text>;

//     return (
//         <SafeAreaView style={styles.container}>
//             {/* Top Back Arrow */}
//             <View style={[styles.headerContainer, { marginTop: insets.top + 100 }]}>
//                 <TouchableOpacity
//                     onPress={() => navigation.goBack()}
//                     style={styles.backButton}
//                 >
//                     <Icon name="arrow-back" size={28} color="#000" />
//                 </TouchableOpacity>
//             </View>

//             <ScrollView contentContainerStyle={styles.scrollContainer}>
//                 <Text style={styles.title}>Kandi Details</Text>

//                 {kandiData && (
//                     <View style={styles.infoContainer}>
//                         <Text style={styles.label}>Origin Location:</Text>
//                         <Text style={styles.value}>{kandiData.originLocation}</Text>

//                         <Text style={styles.label}>Creator:</Text>
//                         <View style={styles.creatorContainer}>
//                             <Image
//                                 source={creatorPhoto ? { uri: creatorPhoto } : require('../assets/default-profile.png')}
//                                 style={styles.creatorPhoto}
//                             />
//                             <Text style={styles.creatorName}>{creatorName}</Text>
//                         </View>

//                         <TouchableOpacity
//                             style={styles.button}
//                             onPress={() =>
//                                 navigation.navigate('Profile', { userId: kandiData.creatorId })
//                             }
//                         >
//                             <Text style={styles.buttonText}>View Creator Profile</Text>
//                         </TouchableOpacity>
//                     </View>
//                 )}
//             </ScrollView>
//         </SafeAreaView>
//     );
// };

// const styles = StyleSheet.create({
//     container: { flex: 1, backgroundColor: '#f2f2f2' },
//     scrollContainer: { padding: 20, paddingBottom: 40 },
//     title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#000' },
//     infoContainer: { marginBottom: 20 },
//     label: { fontSize: 18, fontWeight: 'bold', marginTop: 10, color: '#000' },
//     value: { fontSize: 16, marginLeft: 5, marginBottom: 15, color: '#000' },
//     creatorContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
//     creatorPhoto: { width: 60, height: 60, borderRadius: 30, marginRight: 10, backgroundColor: '#ddd' },
//     creatorName: { fontSize: 16, fontWeight: 'bold', color: '#000' },
//     button: {
//         backgroundColor: '#000',
//         paddingVertical: 14,
//         borderRadius: 10,
//         alignItems: 'center',
//         marginTop: 10,
//     },
//     buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
//     text: { color: '#000', fontSize: 20, textAlign: 'center', marginTop: 50 },

//     headerContainer: {
//         width: '100%',
//         paddingHorizontal: 16,
//         paddingVertical: 8,
//         backgroundColor: '#f2f2f2',
//         flexDirection: 'row',
//         alignItems: 'center',
//         zIndex: 999,
//     },
//     backButton: {
//         backgroundColor: '#fff',
//         borderRadius: 20,
//         padding: 6,
//         shadowColor: '#000',
//         shadowOpacity: 0.1,
//         shadowRadius: 4,
//         elevation: 3,
//     },
// });

// export default KandiDetailsScreen;



// src/screens/KandiDetailsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
    SafeAreaView,
    Text,
    StyleSheet,
    TouchableOpacity,
    View,
    Image,
    Alert,
    ScrollView,
    Platform,
    PermissionsAndroid,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import ImagePicker from 'react-native-image-crop-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

interface RouteParams { tagID: string }

const KandiDetailsScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute();
    const insets = useSafeAreaInsets();
    const { tagID } = route.params as RouteParams;

    const [kandiData, setKandiData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [creatorPhoto, setCreatorPhoto] = useState<string | null>(null);
    const [creatorName, setCreatorName] = useState<string>('Unknown');

    const currentUser = auth().currentUser;

    const formatTimestamp = (ts: any) => {
        if (!ts) return '';
        if (ts.toDate) return ts.toDate().toLocaleString();
        if (typeof ts === 'number') return new Date(ts).toLocaleString();
        return '';
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
                    const userDoc = await firestore().collection('users').doc(data.creatorId).get();
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
    }, [tagID]);

    // ===== Adoption Function =====
    const handleAdoptKandi = async () => {
        if (!currentUser) return Alert.alert('Login Required', 'You must be logged in to adopt a kandi.');
        if (currentUser.uid === kandiData.creatorId) return Alert.alert('Oops', 'You cannot adopt your own kandi.');

        try {
            // Take a new photo using camera
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
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) return Alert.alert('Permission denied', 'Camera is required.');
            }

            const image = await ImagePicker.openCamera({
                width: 400,
                height: 400,
                cropping: true,
                compressImageQuality: 0.8,
            });

            if (image.path) {
                const ref = storage().ref(`kandiPhotos/${tagID}_${currentUser.uid}.jpg`);
                await ref.putFile(image.path.startsWith('file://') ? image.path : `file://${image.path}`);
                photoURL = await ref.getDownloadURL();
            }

            const userRef = firestore().collection('users').doc(currentUser.uid);
            const userDoc = await userRef.get();
            const displayName = userDoc.data()?.displayName || 'Unknown';

            // Use Firestore Timestamp explicitly
            const historyEntry = {
                userId: currentUser.uid,
                displayName,
                action: 'adopted',
                timestamp: firestore.Timestamp.now(),
                photo: photoURL,
            };

            // Update kandi history
            await firestore().collection('kandis').doc(tagID).update({
                history: firestore.FieldValue.arrayUnion(historyEntry),
            });

            // Add kandi to user's kandis array
            await userRef.update({
                kandis: firestore.FieldValue.arrayUnion(tagID),
            });

            Alert.alert('Success', 'You adopted this kandi!');

            // Refresh state so timeline updates immediately
            const updatedDoc = await firestore().collection('kandis').doc(tagID).get();
            setKandiData(updatedDoc.data());
        } catch (err) {
            console.warn(err);
            Alert.alert('Error', 'Failed to adopt kandi.');
        }
    };

    if (loading) return <SafeAreaView style={styles.center}><Text>Loading...</Text></SafeAreaView>;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            {/* Back Arrow – absolute so always clickable */}
            <View style={{ position: 'absolute', top: 40, left: 20, zIndex: 10 }}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={28} color="#000" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 100 }}>
                <Text style={styles.title}>Kandi Details</Text>

                <View style={styles.creatorContainer}>
                    {creatorPhoto && <Image source={{ uri: creatorPhoto }} style={styles.creatorPhoto} />}
                    <Text style={styles.creatorName}>Created by {creatorName}</Text>
                </View>

                {kandiData.journey && kandiData.journey.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>Journey</Text>
                        {kandiData.journey.map((j: any, idx: number) => (
                            <View key={idx} style={styles.journeyItem}>
                                <Text style={styles.journeyLocation}>{j.location}</Text>
                                {j.photo && <Image source={{ uri: j.photo }} style={styles.journeyPhoto} />}
                            </View>
                        ))}
                    </>
                )}

                {kandiData.history && kandiData.history.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>Ownership Timeline</Text>
                        {kandiData.history.slice().reverse().map((h: any, idx: number) => (
                            <Text key={idx} style={styles.historyText}>
                                {h.displayName} {h.action} on {formatTimestamp(h.timestamp)}
                            </Text>
                        ))}
                    </>
                )}

            </ScrollView>
        </SafeAreaView>

    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f8f8' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    backButton: { marginBottom: 10 },
    title: { fontSize: 22, fontWeight: '700', marginBottom: 16, color: '#000' },
    creatorContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    creatorPhoto: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
    creatorName: { fontSize: 16, color: '#333' },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#444', marginBottom: 8, marginTop: 12 },
    journeyItem: { marginBottom: 12 },
    journeyLocation: { fontSize: 14, fontWeight: '500', color: '#555' },
    journeyPhoto: { width: '100%', height: 180, borderRadius: 12, marginTop: 4 },
    historyText: { fontSize: 12, color: '#666', marginBottom: 4 },
});

export default KandiDetailsScreen;



