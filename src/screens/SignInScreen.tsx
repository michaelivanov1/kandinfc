import React, { useState } from 'react';
import { SafeAreaView, View, TextInput, StyleSheet, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import Button from '../components/Button';
import Text from '../components/Text';
import { Colors, Spacing, FontSizes } from '../theme';

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
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      const userDoc = await firestore().collection('users').doc(user.uid).get();
      console.log('User document:', userDoc.data());

      navigation.reset({
        index: 0,
        routes: [{ name: 'AppTabs' }],
      });
    } catch (error: any) {
      Alert.alert('Sign In Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text variant="title">Welcome back</Text>
        <Text variant="subtitle" color="mutedText" style={{ marginBottom: 46, textAlign: 'center' }}>
          Sign in to your account
        </Text>

        <View style={styles.inputGroup}>
          <Text variant="subtitle" color="mutedText">
            Email
          </Text>
          <TextInput
            placeholder="you@example.com"
            placeholderTextColor={Colors.mutedText}
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text variant="subtitle" color="mutedText">
            Password
          </Text>
          <TextInput
            placeholder="••••••••"
            placeholderTextColor={Colors.mutedText}
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
          />
        </View>

        <Button
          title={loading ? 'Signing In...' : 'Sign In'}
          onPress={handleSignIn}
          style={{ marginTop: Spacing.lg }}
          disabled={loading}
        />

        <Button
          variant="ghost"
          title="Create account"
          style={{ marginTop: Spacing.md }}
          onPress={() => navigation.navigate('SignUp')}
        />
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
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0a101bff',
    borderRadius: 12,
    padding: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.text,
    fontSize: FontSizes.caption,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});

export default SignInScreen;
