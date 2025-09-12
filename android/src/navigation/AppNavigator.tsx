import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

import AuthScreen from '../screens/AuthScreen';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import NfcScreen from '../screens/NfcScreen';
import ProfileScreen from '../screens/ProfileScreen';
import KandiDetailsScreen from '../screens/KandiDetailsScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Subscribe to auth state changes
        const unsubscribe = auth().onAuthStateChanged(u => {
            setUser(u);
            setLoading(false);
        });

        return unsubscribe; // cleanup
    }, []);

    if (loading) return null; // or a splash/loading screen

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    // User is signed in -> go directly to NFC screen
                    <Stack.Screen name="Nfc" component={NfcScreen} />
                ) : (
                    // User not signed in -> show auth screen first
                    <Stack.Screen name="Auth" component={AuthScreen} />
                )}

                {/* Secondary screens */}
                <Stack.Screen name="SignIn" component={SignInScreen} />
                <Stack.Screen name="SignUp" component={SignUpScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen name="KandiDetails" component={KandiDetailsScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
