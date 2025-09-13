// src/screens/HomeScreen.tsx
import React from 'react';
import { SafeAreaView, Text, StyleSheet } from 'react-native';

const HomeScreen = () => {
    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.text}>Home Coming Soon</Text>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f2f2f2',
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
    },
});

export default HomeScreen;