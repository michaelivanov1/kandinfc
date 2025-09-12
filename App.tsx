// run:
// npx react-native run-android
// npx react-native log-android

// for metro errors on new system after git pull:
// npx react-native start --reset-cache

import React from 'react';
import AppNavigator from './android/src/navigation/AppNavigator';

export default function App() {
  return <AppNavigator />;
}


