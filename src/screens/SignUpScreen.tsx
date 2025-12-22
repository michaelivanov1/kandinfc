import React, { useState } from 'react';
import { SafeAreaView, View, TextInput, StyleSheet, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import Button from '../components/Button';
import Text from '../components/Text';
import { Colors, Spacing, FontSizes } from '../theme';

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
            console.warn('Sign Up Error:', error);
            Alert.alert('Sign Up Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.card}>
                <Text variant="title">Create Account</Text>
                <Text
                    variant="subtitle"
                    color="mutedText"
                    style={{ textAlign: 'center', marginBottom: 46 }}
                >
                    Join the community
                </Text>

                <View style={styles.inputGroup}>
                    <Text variant="subtitle" color="mutedText">
                        Display Name
                    </Text>
                    <TextInput
                        placeholder="Your display name"
                        placeholderTextColor={Colors.mutedText}
                        value={displayName}
                        onChangeText={setDisplayName}
                        style={styles.input}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text variant="subtitle" color="mutedText">
                        Email
                    </Text>
                    <TextInput
                        placeholder="you@example.com"
                        placeholderTextColor={Colors.mutedText}
                        value={email}
                        onChangeText={setEmail}
                        style={styles.input}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text variant="subtitle" color="mutedText">
                        Password
                    </Text>
                    <TextInput
                        placeholder="••••••••"
                        placeholderTextColor={Colors.mutedText}
                        value={password}
                        onChangeText={setPassword}
                        style={styles.input}
                        secureTextEntry
                    />
                </View>

                <Button
                    title={loading ? 'Creating Account...' : 'Sign Up'}
                    onPress={handleSignUp}
                    style={{ marginTop: Spacing.lg }}
                    disabled={loading}
                />

                <Button
                    variant="ghost"
                    title="Already have an account? Sign In"
                    style={{ marginTop: Spacing.md }}
                    textStyle={{ fontSize: FontSizes.caption }}
                    onPress={() => navigation.navigate('SignIn')}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    card: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: '#0a101bff',
        borderRadius: 12,
        padding: Spacing.xl,
    },
    inputGroup: {
        marginBottom: Spacing.md,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        color: Colors.text,
        fontSize: FontSizes.caption,
        borderWidth: 1,
        borderColor: Colors.border,
    },
});

export default SignUpScreen;