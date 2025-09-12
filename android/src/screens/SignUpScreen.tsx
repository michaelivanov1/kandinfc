// src/screens/SignUpScreen.tsx
import React, { useState } from 'react';
import { SafeAreaView, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';

const SignUpScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const navigation = useNavigation<any>();

    const handleSignUp = async () => {
        if (!email || !password || !displayName.trim()) {
            Alert.alert('Error', 'Please enter email, password, and display name');
            return;
        }

        try {
            setLoading(true);
            const userCredential = await auth().createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // create user profile in Firestore
            const userRef = firestore().collection('users').doc(user.uid);
            await userRef.set({
                uid: user.uid,
                email: user.email,
                displayName: displayName.trim(),
                kandis: [],
                createdAt: firestore.FieldValue.serverTimestamp(),
            });

            Alert.alert('Success', 'Account created!');

            // navigate to NFC screen
            navigation.replace('Nfc');
        } catch (error: any) {
            console.warn('Sign up error:', error);
            Alert.alert('Sign Up Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={['#00c6ff', '#0072ff']} style={styles.container}>
            <SafeAreaView style={styles.content}>
                <Text style={styles.title}>Sign Up</Text>

                <TextInput
                    placeholder="Display Name"
                    placeholderTextColor="#fffaaa"
                    value={displayName}
                    onChangeText={setDisplayName}
                    style={styles.input}
                />

                <TextInput
                    placeholder="Email"
                    placeholderTextColor="#fffaaa"
                    value={email}
                    onChangeText={setEmail}
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <TextInput
                    placeholder="Password"
                    placeholderTextColor="#fffaaa"
                    value={password}
                    onChangeText={setPassword}
                    style={styles.input}
                    secureTextEntry
                />

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleSignUp}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>{loading ? 'Signing Up...' : 'Sign Up'}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                    <Text style={styles.switchText}>Already have an account? Sign In</Text>
                </TouchableOpacity>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    title: { fontSize: 40, fontWeight: 'bold', color: '#fff', marginBottom: 40 },
    input: {
        width: '80%',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: '#ffffff33',
        color: '#fff',
        fontSize: 18,
        marginVertical: 10,
    },
    button: {
        width: '80%',
        paddingVertical: 16,
        backgroundColor: '#ffffff66',
        borderRadius: 12,
        alignItems: 'center',
        marginVertical: 20,
    },
    buttonText: { color: '#fff', fontSize: 20, fontWeight: '600' },
    switchText: { color: '#fff', fontSize: 16, marginTop: 10 },
});

export default SignUpScreen;