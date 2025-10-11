import React from 'react';
import { SafeAreaView, StyleSheet, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import Button from '../components/Button';
import Text from '../components/Text';
import { Colors } from '../theme';

const SettingsScreen = () => {
    const navigation = useNavigation<any>();

    const handleSignOut = async () => {
        try {
            await auth().signOut();
            navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
        } catch (err: any) {
            Alert.alert('Error', err.message);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text variant="title" style={{ marginBottom: 30 }}>
                Settings
            </Text>
            <Button title="Sign Out" onPress={handleSignOut} variant="primary" />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
        padding: 20,
    },
});

export default SettingsScreen;
