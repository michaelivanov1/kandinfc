// src/screens/KandiDetailsScreen.tsx
import React, { useEffect, useState } from 'react';
import { SafeAreaView, Text, StyleSheet, TouchableOpacity, FlatList, View, Alert, ScrollView } from 'react-native';
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

                setIsOwner(data.creatorId === currentUser?.uid);

                let creatorName = 'Unknown';
                if (data.creatorId) {
                    const userDoc = await firestore().collection('users').doc(data.creatorId).get();
                    creatorName = userDoc.exists() ? userDoc.data()?.displayName || 'Unknown' : 'Unknown';
                }
                data.creatorName = creatorName;

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

    const renderCard = (title: string, items: string[] | any[], isHistory = false) => (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>{title}</Text>
            {items.length ? (
                items.map((item: any, index: number) => (
                    <View
                        key={index}
                        style={[
                            styles.cardRow,
                            { backgroundColor: index % 2 === 0 ? '#e6e6e6' : '#fff' },
                        ]}
                    >
                        <Text style={styles.cardItem}>
                            {isHistory
                                ? `${item.action} by ${item.displayName} at ${item.timestamp?.toDate().toLocaleString()}`
                                : `${index + 1}. ${item}`}
                        </Text>
                    </View>
                ))
            ) : (
                <Text style={styles.cardItem}>No {title.toLowerCase()} yet</Text>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.title}>Kandi Details</Text>

                {isOwner && <Text style={styles.ownerText}>You are the original owner of this kandi!</Text>}

                <View style={styles.infoContainer}>
                    <Text style={styles.label}>Origin Location:</Text>
                    <Text style={styles.value}>{kandiData.originLocation}</Text>

                    <Text style={styles.label}>Creator:</Text>
                    <Text style={styles.value}>{kandiData.creatorName}</Text>
                </View>

                {renderCard('Lore', kandiData.lore || [])}
                {renderCard('History', kandiData.history || [], true)}

                <TouchableOpacity style={[styles.button, styles.backButton]} onPress={() => navigation.goBack()}>
                    <Text style={[styles.buttonText, styles.signUpText]}>Back</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f2f2' },
    scrollContainer: { padding: 20, paddingBottom: 40 },
    title: { color: '#000', fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    ownerText: { color: '#ff5555', fontSize: 18, marginBottom: 15, textAlign: 'center', fontWeight: 'bold' },
    infoContainer: { marginBottom: 20 },
    label: { color: '#000', fontSize: 18, fontWeight: 'bold', marginTop: 10 },
    value: { color: '#000', fontSize: 16, marginLeft: 5, marginBottom: 5 },

    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 10,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#000' },
    cardRow: {
        padding: 8,
        borderRadius: 8,
        marginBottom: 4,
    },
    cardItem: { fontSize: 16, color: '#000' },

    text: { color: '#000', fontSize: 20, textAlign: 'center', marginTop: 50 },

    button: {
        backgroundColor: '#000',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    backButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#000',
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    signUpText: { color: '#000' },
});

export default KandiDetailsScreen;
