import React, { JSX } from 'react';
import { SafeAreaView, Text, StyleSheet } from 'react-native';

const App = (): JSX.Element => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>kandi app</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  text: {
    color: '#00ffcc',
    fontSize: 24,
  },
});

export default App;
