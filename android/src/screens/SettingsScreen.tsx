import React from 'react';
import { SafeAreaView, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';

const SettingsScreen = () => {
    const navigation = useNavigation<any>();

    const handleSignOut = async () => {
        try {
            await auth().signOut();
            navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
        } catch (err: any) {
            Alert.alert('Error', err.message);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity style={styles.button} onPress={handleSignOut}>
                <Text style={styles.buttonText}>Sign Out</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f2f2f2' },
    button: { backgroundColor: '#ff5555', padding: 16, borderRadius: 10 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default SettingsScreen;
