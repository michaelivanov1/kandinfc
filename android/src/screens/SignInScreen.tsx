// src/screens/SignInScreen.tsx
import React, { useState } from 'react';
import { SafeAreaView, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';

const SignInScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    try {
      setLoading(true);

      // sign in with firebase auth
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // fetch the user document from firestore
      const userDoc = await firestore().collection('users').doc(user.uid).get();

      // if (!userDoc.exists) {
      //   // this should rarely happen if signup worked
      //   Alert.alert('Error', 'No user profile found. Please sign up first.');
      //   return;
      // }

      const userData = userDoc.data();
      console.log('User document:', userData);

      // navigate to NFC screen
      navigation.replace('Nfc');

    } catch (error: any) {
      console.warn('Sign In Error:', error);
      Alert.alert('Sign In Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#00c6ff', '#0072ff']} style={styles.container}>
      <SafeAreaView style={styles.content}>
        <Text style={styles.title}>Sign In</Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#fffaaa"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#fffaaa"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleSignIn}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Signing In...' : 'Sign In'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.switchText}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  title: { fontSize: 40, fontWeight: 'bold', color: '#fff', marginBottom: 40 },
  input: {
    width: '80%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff33',
    color: '#fff',
    fontSize: 18,
    marginVertical: 10,
  },
  button: {
    width: '80%',
    paddingVertical: 16,
    backgroundColor: '#ffffff66',
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 20,
  },
  buttonText: { color: '#fff', fontSize: 20, fontWeight: '600' },
  switchText: { color: '#fff', fontSize: 16, marginTop: 10 },
});

export default SignInScreen;
