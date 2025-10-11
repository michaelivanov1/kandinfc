// src/screens/AuthScreen.tsx
import React from 'react';
import { SafeAreaView, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Text from '../components/Text';
import Button from '../components/Button';
import { Colors, Spacing } from '../theme';

const AuthScreen = () => {
    const navigation = useNavigation<any>();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text variant="title" style={styles.title}>Kandi NFC</Text>

                <Button
                    title="Sign In"
                    onPress={() => navigation.navigate('SignIn')}
                    variant="primary"
                    style={{ marginBottom: Spacing.lg, width: '80%' }}
                />
                <Button
                    title="Sign Up"
                    onPress={() => navigation.navigate('SignUp')}
                    variant="primary"
                    style={{ width: '80%' }}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
    },
    title: {
        marginBottom: Spacing.xl,
    },
});

export default AuthScreen;
