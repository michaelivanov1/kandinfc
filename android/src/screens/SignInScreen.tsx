import React, { useState } from 'react';
import { SafeAreaView, View, TextInput, StyleSheet, Alert, Text } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import Button from '../components/Button';
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
      const userData = userDoc.data();
      console.log('User document:', userData);

      navigation.reset({
        index: 0,
        routes: [{ name: 'AppTabs' }],
      });
    } catch (error: any) {
      console.warn('Sign In Error:', error);
      Alert.alert('Sign In Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
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
          <Text style={styles.label}>Password</Text>
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
  title: {
    color: Colors.text,
    fontSize: FontSizes.title,
    marginBottom: Spacing.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.mutedText,
    fontSize: FontSizes.subtitle,
    textAlign: 'center',
    marginBottom: 46
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    color: Colors.mutedText,
    fontSize: FontSizes.subtitle,
    marginBottom: Spacing.md,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.text,
    fontSize: FontSizes.subtitle,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});

export default SignInScreen;
