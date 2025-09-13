// src/screens/ExploreScreen.tsx
import React from 'react';
import { SafeAreaView, Text, StyleSheet, View } from 'react-native';

const ExploreScreen = () => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Explore</Text>
                <Text style={styles.subtitle}>eventually..</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f2f2', justifyContent: 'center', alignItems: 'center' },
    content: { alignItems: 'center', padding: 20 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#000', marginBottom: 10 },
    subtitle: { fontSize: 16, color: '#555', textAlign: 'center' },
});

export default ExploreScreen;
