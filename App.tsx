import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { firebase } from '@react-native-firebase/app';

// Initialize Firebase once
if (!firebase.apps.length) {
  firebase.initializeApp();
}

export default function App() {
  return <AppNavigator />;
}

