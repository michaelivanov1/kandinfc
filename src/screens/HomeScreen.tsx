// src/screens/HomeScreen.tsx
import React from 'react';
import { SafeAreaView, View, StyleSheet } from 'react-native';
import Text from '../components/Text';
import { Colors, Spacing } from '../theme';

const HomeScreen = () => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text variant="title">Home Coming Soon</Text>
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
});

export default HomeScreen;
