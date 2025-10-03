import React, { useState } from 'react';
import { SafeAreaView, TextInput, StyleSheet, View, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import Button from '../components/Button';
import Text from '../components/Text';

const SignUpScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation<any>();

    const handleSignUp = async () => {
        if (!email || !password || !displayName.trim()) {
            Alert.alert('Error', 'Please enter display name, email, and password');
            return;
        }

        try {
            setLoading(true);

            const userCredential = await auth().createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            await firestore().collection('users').doc(user.uid).set({
                uid: user.uid,
                email: user.email,
                displayName: displayName.trim(),
                kandis: [],
                createdAt: firestore.FieldValue.serverTimestamp(),
            });

            Alert.alert('Success', 'Account created!');
            navigation.reset({
                index: 0,
                routes: [{ name: 'AppTabs' }],
            });
        } catch (error: any) {
            console.warn('Sign up error:', error);
            Alert.alert('Sign Up Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text variant="title" style={{ marginBottom: 40 }}>Sign Up</Text>

                <View style={styles.inputContainer}>
                    <Text variant="section" style={styles.label}>Display Name</Text>
                    <TextInput
                        placeholder="Enter your display name"
                        placeholderTextColor="#555"
                        value={displayName}
                        onChangeText={setDisplayName}
                        style={styles.input}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text variant="section" style={styles.label}>Email</Text>
                    <TextInput
                        placeholder="Enter your email"
                        placeholderTextColor="#555"
                        value={email}
                        onChangeText={setEmail}
                        style={styles.input}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text variant="section" style={styles.label}>Password</Text>
                    <TextInput
                        placeholder="Enter your password"
                        placeholderTextColor="#555"
                        value={password}
                        onChangeText={setPassword}
                        style={styles.input}
                        secureTextEntry
                    />
                </View>

                <Button
                    title={loading ? 'Signing Up...' : 'Create Account'}
                    onPress={handleSignUp}
                    variant="primary"
                    style={{ marginBottom: 15 }}
                />

                <Text variant="body" style={styles.switchText} onPress={() => navigation.navigate('SignIn')}>
                    Already have an account? <Text style={styles.switchLink}>Sign In</Text>
                </Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f8f8' },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    inputContainer: { width: '85%', marginBottom: 20 },
    label: { marginBottom: 6, fontSize: 12 },
    input: {
        width: '100%',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 8,
        backgroundColor: '#deddddbf',
        color: '#000',
        fontSize: 10,
    },
    switchText: { fontSize: 10, color: '#444' },
    switchLink: { color: '#000', fontSize: 10, fontWeight: 600 },
});

export default SignUpScreen;
