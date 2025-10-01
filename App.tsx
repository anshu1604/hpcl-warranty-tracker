import React, { useEffect, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
  View,
  TouchableOpacity,
  Text,
  BackHandler,
  Image,
} from 'react-native';
import {
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import your screens here
import { LoginScreen } from './screens/LoginScreen';
import { SignUpScreen } from './screens/SignUpScreen';
import { FormScreen } from './screens/FormScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { RetrieveDataScreen } from './screens/RetrieveDataScreen';
import { ItemsListScreen } from './screens/ItemsListScreen';
import MasterDataScreen from './screens/MasterDataScreen';
import AddOutletScreen from './screens/AddOutletScreen';
import AddMakeScreen from './screens/AddMakeScreen';
import AddWorkTypeScreen from './screens/AddWorkTypeScreen';
import AddItemScreen from './screens/AddItemScreen';
import { Footer } from './components/Footer';
import { USER_ROLES } from './helper/constant';

// Define the types for our navigation
export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Form: undefined;
  Dashboard: undefined;
  RetrieveData: undefined;
  ItemsList: {
    outletName: string;
    workType: string;
    make: string;
    warrantyTillDate: string;
    vendor: string;
    otherMake: boolean;
  };
  MasterData: undefined;
  AddOutlet: undefined;
  AddMake: undefined;
  AddWorkType: undefined;
  AddItem: undefined;
  // Add more screens here as needed
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  const [initialRoute, setInitialRoute] =
    useState<keyof RootStackParamList>('Login');
  const [isLoading, setIsLoading] = useState(true);

  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      await new Promise((resolve: any) => setTimeout(resolve, 1500));
      const data = await AsyncStorage.getItem('user');
      const userData = JSON.parse(data || '{}');

      if (userData && userData.isLoggedIn) {
        // Check role
        if (userData.role === USER_ROLES.DEALER) {
          setInitialRoute('RetrieveData'); // Role 1 -> home = RetrieveData
        } else {
          setInitialRoute('Dashboard'); // Others -> Dashboard
        }
      }
    } catch (error) {
      console.error('Error checking login status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const backAction = () => {
      if (!navigationRef.isReady()) return false;

      const currentRoute = navigationRef.getCurrentRoute()?.name;

      // Exit app only on Dashboard or RetrieveData screen
      if (
        currentRoute === 'Dashboard' ||
        currentRoute === 'RetrieveData' ||
        currentRoute === 'Login'
      ) {
        BackHandler.exitApp();
        return true;
      }

      // Otherwise, go back in navigation stack
      navigationRef.goBack();
      return true; // prevent default behavior
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View
          style={[
            styles.loadingContainer,
            { backgroundColor: isDarkMode ? '#000' : '#fff' },
          ]}
        >
          <Image
            source={require('./assets/delivering_happiness_logo.png')}
            style={styles.logo}
          />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <StatusBar hidden={true} />
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={({ navigation, route }) => ({
            headerShown: route.name !== 'Login' && route.name !== 'SignUp',
            headerTitleAlign: 'center',
            headerTitle: () => (
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000' }}>
                HPCL Warranty App
              </Text>
            ),
            headerBackVisible:
              route.name !== 'Login' &&
              route.name !== 'SignUp' &&
              route.name !== 'Dashboard',
            headerLeft: () =>
              route.name !== 'Login' && route.name !== 'SignUp' ? (
                <Image
                  source={require('./assets/logo_round.png')}
                  style={{
                    width: 35,
                    height: 35,
                    resizeMode: 'contain',
                    marginLeft: 10,
                  }}
                />
              ) : null,
            headerRight: () =>
              route.name !== 'Login' && route.name !== 'SignUp' ? (
                <TouchableOpacity
                  style={{
                    marginRight: 15,
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    backgroundColor: 'white',
                  }}
                  onPress={async () => {
                    await AsyncStorage.removeItem('user');
                    navigation.replace('Login');
                  }}
                >
                  <Image
                    source={require('./assets/power.png')}
                    style={{ width: 24, height: 24, resizeMode: 'contain' }}
                  />
                </TouchableOpacity>
              ) : null,
          })}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="Form" component={FormScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="RetrieveData" component={RetrieveDataScreen} />
          <Stack.Screen name="ItemsList" component={ItemsListScreen} />
          <Stack.Screen name="MasterData" component={MasterDataScreen} />
          <Stack.Screen name="AddOutlet" component={AddOutletScreen} />
          <Stack.Screen name="AddMake" component={AddMakeScreen} />
          <Stack.Screen name="AddWorkType" component={AddWorkTypeScreen} />
          <Stack.Screen name="AddItem" component={AddItemScreen} />
          {/* Add more screens here as needed */}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 15, // adjusted spacing for app name
  },
});

export default App;
