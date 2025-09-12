import React, { useEffect, useState } from 'react';
import { SafeAreaView, Text, StyleSheet, Button, FlatList, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useNavigation, useRoute } from '@react-navigation/native';

interface RouteParams {
    tagID: string;
}

const KandiDetailsScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute();
    const { tagID } = route.params as RouteParams;

    const [kandiData, setKandiData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isOwner, setIsOwner] = useState(false);

    const currentUser = auth().currentUser;

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

                // check if current user is creator
                setIsOwner(data.creatorId === currentUser?.uid);

                // fetch creator displayName
                let creatorName = 'Unknown';
                if (data.creatorId) {
                    const userDoc = await firestore().collection('users').doc(data.creatorId).get();
                    creatorName = userDoc.exists() ? userDoc.data()?.displayName || 'Unknown' : 'Unknown';
                }
                data.creatorName = creatorName;

                // fetch history displayNames
                if (data.history?.length) {
                    const updatedHistory = await Promise.all(
                        data.history.map(async (entry: any) => {
                            if (entry.userId) {
                                const userDoc = await firestore().collection('users').doc(entry.userId).get();
                                return {
                                    ...entry,
                                    displayName: userDoc.exists() ? userDoc.data()?.displayName || 'Unknown' : 'Unknown',
                                };
                            }
                            return entry;
                        })
                    );
                    data.history = updatedHistory;
                }

                setKandiData(data);
            } catch (err: any) {
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
            <Text style={styles.title}>Kandi Details</Text>

            {isOwner && <Text style={styles.ownerText}>You are the original owner of this kandi!</Text>}

            <Text style={styles.label}>Origin Location:</Text>
            <Text style={styles.value}>{kandiData.originLocation}</Text>

            <Text style={styles.label}>Creator:</Text>
            <Text style={styles.value}>{kandiData.creatorName}</Text>

            <Text style={styles.label}>Lore:</Text>
            {kandiData.lore?.length ? (
                <FlatList
                    data={kandiData.lore}
                    keyExtractor={(_, index) => index.toString()}
                    renderItem={({ item, index }) => <Text style={styles.value}>{index + 1}. {item}</Text>}
                />
            ) : (
                <Text style={styles.value}>No lore yet</Text>
            )}

            <Text style={styles.label}>History:</Text>
            {kandiData.history?.length ? (
                <FlatList
                    data={kandiData.history}
                    keyExtractor={(_, index) => index.toString()}
                    renderItem={({ item }) => (
                        <Text style={styles.value}>
                            {item.action} by {item.displayName} at {item.timestamp?.toDate().toLocaleString()}
                        </Text>
                    )}
                />
            ) : (
                <Text style={styles.value}>No history yet</Text>
            )}

            <Button title="Back" onPress={() => navigation.goBack()} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#000' },
    title: { color: '#00ffcc', fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    ownerText: { color: '#ffcc00', fontSize: 18, marginBottom: 10, textAlign: 'center', fontWeight: 'bold' },
    label: { color: '#fff', fontSize: 18, marginTop: 10, fontWeight: 'bold' },
    value: { color: '#00ffcc', fontSize: 16, marginLeft: 5 },
    text: { color: '#fff', fontSize: 20, textAlign: 'center', marginTop: 50 },
});

export default KandiDetailsScreen;
