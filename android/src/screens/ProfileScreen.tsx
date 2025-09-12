// src/screens/ProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';

const ProfileScreen = () => {
    const navigation = useNavigation<any>();
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(false);
    const email = auth().currentUser?.email;

    // Load user data on mount
    useEffect(() => {
        const loadUser = async () => {
            try {
                const userDoc = await firestore().collection('users').doc(auth().currentUser?.uid).get();
                if (userDoc.exists()) {
                    setDisplayName(userDoc.data()?.displayName ?? '');
                }
            } catch (error) {
                console.warn('Error loading profile:', error);
                Alert.alert('Error', 'Failed to load profile.');
            }
        };

        loadUser();
    }, []);

    const handleSave = async () => {
        try {
            setLoading(true);
            await firestore().collection('users').doc(auth().currentUser?.uid).update({
                displayName,
            });
            Alert.alert('Success', 'Display name updated!');
        } catch (error) {
            console.warn('Error updating profile:', error);
            Alert.alert('Error', 'Failed to update display name.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.label}>Email (read-only)</Text>
            <Text style={styles.value}>{email}</Text>

            <Text style={styles.label}>Display Name</Text>
            <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter display name"
                placeholderTextColor="#aaa"
            />

            <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#000', justifyContent: 'center' },
    label: { color: '#00ffcc', fontSize: 16, marginBottom: 5 },
    value: { color: '#fff', fontSize: 18, marginBottom: 20 },
    input: {
        backgroundColor: '#111',
        color: '#fff',
        padding: 12,
        borderRadius: 10,
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#00ffcc',
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 10,
    },
    buttonText: { color: '#000', fontSize: 16, fontWeight: '600' },
    backButton: {
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        borderColor: '#00ffcc',
        borderWidth: 1,
    },
    backText: { color: '#00ffcc', fontSize: 16 },
});

export default ProfileScreen;
