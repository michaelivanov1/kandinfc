// src/screens/AuthScreen.tsx
import React from 'react';
import { SafeAreaView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const AuthScreen = () => {
    const navigation = useNavigation<any>();

    return (
        <LinearGradient
            colors={['#00c6ff', '#0072ff']}
            style={styles.container}
        >
            <SafeAreaView style={styles.content}>
                <Text style={styles.title}>Kandi NFC</Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('SignIn')} // replace with actual sign in screen
                >
                    <Text style={styles.buttonText}>Sign In</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.signUpButton]}
                    onPress={() => navigation.navigate('SignUp')} // replace with actual sign up screen
                >
                    <Text style={styles.buttonText}>Sign Up</Text>
                </TouchableOpacity>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 80,
    },
    button: {
        width: '80%',
        paddingVertical: 16,
        backgroundColor: '#ffffff33', // semi-transparent white
        borderRadius: 12,
        alignItems: 'center',
        marginVertical: 10,
    },
    signUpButton: {
        backgroundColor: '#ffffff66', // slightly more opaque
    },
    buttonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
    },
});

export default AuthScreen;
