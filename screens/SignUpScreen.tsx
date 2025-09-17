import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import axios from 'axios';
import { Google_Sheet_Creds } from '../sheetCredentials';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SHEET_ACTIONS, USER_ROLES } from '../helper/constant';
import { CommonActions } from '@react-navigation/native';
import { ScreenWrapper } from '../components/ScreenWrapper';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

export function SignUpScreen({ navigation }: Props) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    password: '',
  });

  const validateFullName = (name: string) => {
    return name.length >= 2;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    const minLength = password.length >= 10;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      isValid:
        minLength &&
        hasUpperCase &&
        hasLowerCase &&
        hasNumber &&
        hasSpecialChar,
      error:
        'Password must be at least 10 characters and contain uppercase, lowercase, number and special character',
    };
  };

  const handleSignUp = async () => {
    let isValid = true;
    const newErrors = { fullName: '', email: '', password: '' };

    // Validate full name
    if (!validateFullName(fullName)) {
      newErrors.fullName = 'Please enter a valid full name';
      isValid = false;
    }

    // Validate email
    if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.error;
      isValid = false;
    }

    setErrors(newErrors);

    if (isValid) {
      try {
        // ✅ First check if email already exists
        const res = await axios.get(Google_Sheet_Creds.userList);
        const rows = res.data.values || [];
        const users: Array<Array<string>> = rows.slice(1); // skip header

        const emailExists = users.some(
          (user: Array<string>) =>
            user[1]?.toLowerCase() === email.toLowerCase(),
        );

        if (emailExists) {
          setErrors(prev => ({
            ...prev,
            email: 'Email already registered',
          }));
          return;
        }

        await axios.post(Google_Sheet_Creds.WEB_APP_URL, {
          userID: users.length + 1, // Assuming userID is the next index
          fullName,
          email,
          password,
          role: USER_ROLES.VENDOR,
          action: SHEET_ACTIONS.addUser,
        });

        // Set login state and navigate
        await AsyncStorage.setItem(
          'user',
          JSON.stringify({
            fullName: fullName,
            email: email,
            role: USER_ROLES.VENDOR,
            userID: users.length + 1,
            isLoggedIn: true,
          }),
        );
        await AsyncStorage.setItem('isLoggedIn', 'true');

        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Dashboard' }],
          }),
        );
      } catch (error: any) {
        console.error(
          'Google Sheets API error:',
          error.response?.data || error.message,
        );
      }
    }
  };

  return (
    <ScreenWrapper withTagline={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.formContainer}>
          <TextInput
            style={[styles.input, errors.fullName ? styles.inputError : null]}
            placeholder="Full Name"
            value={fullName}
            onChangeText={text => {
              setFullName(text);
              setErrors(prev => ({ ...prev, fullName: '' }));
            }}
            autoCapitalize="words"
          />
          {errors.fullName ? (
            <Text style={styles.errorText}>{errors.fullName}</Text>
          ) : null}

          <TextInput
            style={[styles.input, errors.email ? styles.inputError : null]}
            placeholder="Email"
            value={email}
            onChangeText={text => {
              setEmail(text);
              setErrors(prev => ({ ...prev, email: '' }));
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email ? (
            <Text style={styles.errorText}>{errors.email}</Text>
          ) : null}

          <TextInput
            style={[styles.input, errors.password ? styles.inputError : null]}
            placeholder="Password"
            value={password}
            onChangeText={text => {
              setPassword(text);
              setErrors(prev => ({ ...prev, password: '' }));
            }}
            secureTextEntry
          />
          {errors.password ? (
            <Text style={styles.errorText}>{errors.password}</Text>
          ) : null}

          <TouchableOpacity style={styles.button} onPress={handleSignUp}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputError: {
    borderColor: '#ff0000',
  },
  errorText: {
    color: '#ff0000',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#333',
    fontSize: 14,
  },
  loginLink: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
