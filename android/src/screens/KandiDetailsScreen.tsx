import React, { useEffect, useState } from 'react';
import { SafeAreaView, Text, StyleSheet, Button, FlatList, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
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

                // fetch displayName for creator
                if (data?.creatorId) {
                    const creatorDoc = await firestore().collection('users').doc(data.creatorId).get();
                    data.creatorName = creatorDoc.exists() ? creatorDoc.data()?.displayName || 'Unknown' : 'Unknown';
                }

                // fetch displayNames for history entries
                if (data?.history?.length) {
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

            <Text style={styles.label}>Origin Location:</Text>
            <Text style={styles.value}>{kandiData.originLocation}</Text>

            <Text style={styles.label}>Creator:</Text>
            <Text style={styles.value}>{kandiData.creatorName}</Text>

            <Text style={styles.label}>Lore:</Text>
            {kandiData.lore?.length ? (
                <FlatList
                    data={kandiData.lore}
                    keyExtractor={(_, index) => index.toString()}
                    renderItem={({ item, index }) => (
                        <Text style={styles.value}>{index + 1}. {item}</Text>
                    )}
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
    label: { color: '#fff', fontSize: 18, marginTop: 10, fontWeight: 'bold' },
    value: { color: '#00ffcc', fontSize: 16, marginLeft: 5 },
    text: { color: '#fff', fontSize: 20, textAlign: 'center', marginTop: 50 },
});

export default KandiDetailsScreen;
