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
    const navigation = useNavigation<any>();

    const handleSignUp = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }

        try {
            setLoading(true);
            // create user in firebase auth
            const userCredential = await auth().createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;



            // const addNewDocument = async () => {
            //     try {
            //         const docRef = await firestore().collection('userstest').add({
            //             field1: 'value1',
            //             field2: 'value2',
            //         });
            //         Alert.alert('Document written with ID: ', docRef.id);
            //     } catch (error) {
            //         Alert.alert('Error adding document: ');
            //     }
            // };
            // addNewDocument();


            // 2. Add user to Firestore
            await firestore().collection('users').doc(user.uid).set({
                uid: user.uid,
                email: user.email,
                displayName: '',
                // createdAt: firestore.FieldValue.serverTimestamp(),
            });

            console.log('User profile created in Firestore');
            Alert.alert('Success', 'User profile created!');

            //navigate to NFC screen
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
