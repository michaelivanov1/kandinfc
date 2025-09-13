// src/screens/AuthScreen.tsx
import React from 'react';
import { SafeAreaView, Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const AuthScreen = () => {
    const navigation = useNavigation<any>();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Kandi NFC</Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('SignIn')}
                >
                    <Text style={styles.buttonText}>Sign In</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.signUpButton]}
                    onPress={() => navigation.navigate('SignUp')}
                >
                    <Text style={[styles.buttonText, styles.signUpText]}>Sign Up</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f2f2f2',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 40,
        fontWeight: '600',
        color: '#000',
        marginBottom: 60,
    },
    button: {
        width: '85%',
        paddingVertical: 12,
        backgroundColor: '#000',
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 15,
    },
    signUpButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#000',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    signUpText: {
        color: '#000',
    },
});

export default AuthScreen;
