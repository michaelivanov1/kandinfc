// src/navigation/AppTabs.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import NfcScreen from '../screens/NfcScreen';
import ProfileScreen from '../screens/ProfileScreen';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ExploreScreen from '../screens/ExploreScreen';

const Tab = createBottomTabNavigator();

// Custom floating Scan Button
const ScanButton = (props: any) => {
    return (
        <TouchableOpacity
            style={styles.scanButton}
            onPress={() => {
                if (props.onPress) props.onPress();
            }}
        >
            <View style={styles.scanButtonInner}>
                <Icon name="qr-code-scanner" size={30} color="#fff" />
            </View>
        </TouchableOpacity>
    );
};

const AppTabs = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: {
                    backgroundColor: '#fff',
                    height: 70,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    position: 'absolute',
                    shadowColor: '#000',
                    shadowOpacity: 0.1,
                    shadowOffset: { width: 0, height: -3 },
                    shadowRadius: 5,
                    elevation: 8,
                },
            }}
        >
            {/* Home Tab */}
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <Icon
                            name="home"
                            size={28}
                            color={focused ? '#000' : '#888'}
                        />
                    ),
                }}
            />

            {/* Explore Button Tab */}
            <Tab.Screen
                name="Explore"
                component={ExploreScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <Icon
                            name="search"
                            size={28}
                            color={focused ? '#000' : '#888'}
                        />
                    ),
                }}
            />

            {/* Scan Button Tab */}
            <Tab.Screen
                name="Scan"
                component={NfcScreen}
                options={{
                    tabBarButton: (props) => <ScanButton {...props} />,
                }}
            />

            {/* Profile Tab */}
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <Icon
                            name="person"
                            size={28}
                            color={focused ? '#000' : '#888'}
                        />
                    ),
                }}
            />

            {/* Settings Tab */}
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <Icon name="settings" color={focused ? '#000' : '#888'} size={28} />
                    ),
                    headerShown: false,
                }}
            />

        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    scanButton: {
        top: -25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanButtonInner: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 5,
        elevation: 5,
    },
});

export default AppTabs;
