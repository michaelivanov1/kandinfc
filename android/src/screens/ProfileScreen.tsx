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

            <TouchableOpacity style={[styles.button, styles.signUpButton]} onPress={() => navigation.goBack()}>
                <Text style={[styles.buttonText, styles.signUpText]}>Back</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f2f2f2', justifyContent: 'center' },
    label: { color: '#000', fontSize: 16, marginBottom: 5 },
    value: { color: '#000', fontSize: 18, marginBottom: 20 },
    input: {
        backgroundColor: '#fff',
        color: '#000',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#000',
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#000',
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 15,
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    signUpButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#000',
    },
    signUpText: {
        color: '#000',
    },
});

export default ProfileScreen;
