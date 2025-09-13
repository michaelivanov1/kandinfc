import React, { useEffect, useState } from 'react';
import { SafeAreaView, Text, StyleSheet, TouchableOpacity, View, Image, Alert, ScrollView } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface RouteParams {
    tagID: string;
}

const KandiDetailsScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute();
    const insets = useSafeAreaInsets();
    const { tagID } = route.params as RouteParams;

    const [kandiData, setKandiData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [creatorPhoto, setCreatorPhoto] = useState<string | null>(null);
    const [creatorName, setCreatorName] = useState<string>('Unknown');

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

                // Fetch creator info
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

    if (loading) return <Text style={styles.text}>Loading...</Text>;

    return (
        <SafeAreaView style={styles.container}>
            {/* Top Back Arrow */}
            <View style={[styles.headerContainer, { marginTop: insets.top + 100 }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Icon name="arrow-back" size={28} color="#000" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.title}>Kandi Details</Text>

                {kandiData && (
                    <View style={styles.infoContainer}>
                        <Text style={styles.label}>Origin Location:</Text>
                        <Text style={styles.value}>{kandiData.originLocation}</Text>

                        <Text style={styles.label}>Creator:</Text>
                        <View style={styles.creatorContainer}>
                            <Image
                                source={creatorPhoto ? { uri: creatorPhoto } : require('../assets/default-profile.png')}
                                style={styles.creatorPhoto}
                            />
                            <Text style={styles.creatorName}>{creatorName}</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.button}
                            onPress={() =>
                                navigation.navigate('Profile', { userId: kandiData.creatorId })
                            }
                        >
                            <Text style={styles.buttonText}>View Creator Profile</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f2f2' },
    scrollContainer: { padding: 20, paddingBottom: 40 },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#000' },
    infoContainer: { marginBottom: 20 },
    label: { fontSize: 18, fontWeight: 'bold', marginTop: 10, color: '#000' },
    value: { fontSize: 16, marginLeft: 5, marginBottom: 15, color: '#000' },
    creatorContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    creatorPhoto: { width: 60, height: 60, borderRadius: 30, marginRight: 10, backgroundColor: '#ddd' },
    creatorName: { fontSize: 16, fontWeight: 'bold', color: '#000' },
    button: {
        backgroundColor: '#000',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    text: { color: '#000', fontSize: 20, textAlign: 'center', marginTop: 50 },

    headerContainer: {
        width: '100%',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#f2f2f2',
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

export default KandiDetailsScreen;
