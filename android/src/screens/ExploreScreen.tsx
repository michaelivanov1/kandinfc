// src/screens/ExploreScreen.tsx
import React from 'react';
import { SafeAreaView, View, StyleSheet } from 'react-native';
import Text from '../components/Text';
import { Colors, Spacing } from '../theme';

const ExploreScreen = () => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text variant="title" style={styles.title}>Explore</Text>
                <Text style={styles.subtitle}>
                    eventually..
                </Text>
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
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
    },
    title: {
        marginBottom: Spacing.sm,
    },
    subtitle: {
        textAlign: 'center',
    },
});

export default ExploreScreen;
