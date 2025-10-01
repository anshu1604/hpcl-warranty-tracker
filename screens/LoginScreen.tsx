import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import axios from 'axios';
import { Google_Sheet_Creds } from '../sheetCredentials';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { USER_ROLES } from '../helper/constant';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { CommonActions } from '@react-navigation/native';
import { ScreenWrapper } from '../components/ScreenWrapper';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    // const minLength = password.length >= 10;
    // const hasUpperCase = /[A-Z]/.test(password);
    // const hasLowerCase = /[a-z]/.test(password);
    // const hasNumber = /[0-9]/.test(password);
    // const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    // return {
    //   isValid:
    //     minLength &&
    //     hasUpperCase &&
    //     hasLowerCase &&
    //     hasNumber &&
    //     hasSpecialChar,
    //   error:
    //     'Password must be at least 10 characters and contain uppercase, lowercase, number and special character',
    // };

    return {
      isValid: true,
      error: '',
    };
  };

  const handleLogin = async () => {
    let isValid = true;
    const newErrors = { email: '', password: '' };

    // Validate email
    // if (!validateEmail(email)) {
    //   newErrors.email = 'Please enter a valid email address';
    //   isValid = false;
    // }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.error;
      isValid = false;
    }

    setErrors(newErrors);

    if (isValid) {
      setLoading(true); // Start loader
      try {
        const res = await axios.get(Google_Sheet_Creds.userList);
        const rows = res.data.values || [];
        const users = rows.slice(1);

        let isUserFound: boolean = false;

        let userDetails: {
          fullName: string;
          email: string;
          role: string;
          userID: string;
          username: string;
          contactNumber: string;
        } = {
          fullName: '',
          email: '',
          role: '',
          userID: '',
          username: '',
          contactNumber: '',
        };

        users.forEach((user: Array<string>) => {
          if (user[1].toLowerCase() === userName && user[5] === password) {
            userDetails = {
              userID: user[0],
              username: user[1],
              fullName: user[2],
              contactNumber: user[3],
              email: user[4],
              role: user[6], // Assuming role is in the 4th column
            };
            isUserFound = true;
          }
        });

        if (isUserFound) {
          await AsyncStorage.setItem(
            'user',
            JSON.stringify({
              fullName: userDetails.fullName,
              email: userDetails.email,
              role: userDetails.role,
              userID: userDetails.userID,
              username: userDetails.username,
              contactNumber: userDetails.contactNumber,
              isLoggedIn: true,
            }),
          );
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {
                  name:
                    userDetails.role === USER_ROLES.DEALER
                      ? 'RetrieveData'
                      : 'Dashboard',
                },
              ],
            }),
          );
        } else {
          setErrors({ email: '', password: 'Invalid email or password' });
        }
      } catch (error: any) {
        console.error(
          'Google Sheets API error:',
          error.response?.data || error.message,
        );
      } finally {
        setLoading(false); // Stop loader
      }
    }
  };

  return (
    <ScreenWrapper withTagline={false}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={20} // pushes inputs a bit above keyboard
        enableOnAndroid={true} // makes it work properly on Android
      >
        <View style={styles.formContainer}>
          {/* Logo */}
          <Image
            source={require('../assets/logo_rectangle.png')}
            style={styles.logo}
          />
          <TextInput
            style={[styles.input, errors.email ? styles.inputError : null]}
            placeholder="Username"
            value={userName}
            onChangeText={text => {
              setUserName(text);
              setErrors(prev => ({ ...prev, email: '' }));
            }}
            keyboardType="default"
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

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
    marginTop: 10,
    shadowColor: '#007AFF',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 8,
    elevation: 5,
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
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signupText: {
    color: '#333',
    fontSize: 14,
  },
  signupLink: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 15, // adjusted spacing for app name
  },
  appName: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 30,
  },
});
