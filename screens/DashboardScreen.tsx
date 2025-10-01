import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { USER_ROLES } from '../helper/constant';
import { Footer } from '../components/Footer';
import { ScreenWrapper } from '../components/ScreenWrapper';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await AsyncStorage.getItem('user');
        if (data) {
          const user = JSON.parse(data);
          if (user && typeof user.role === 'string') {
            setRole(user.role);
          }
        }
      } catch (error) {
        console.error('Error reading user from AsyncStorage:', error);
      }
    };

    fetchUser();
  }, []);

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Add Data → Form */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Form')}
        >
          <Text style={styles.buttonText}>Add Data</Text>
        </TouchableOpacity>

        {/* Retrieve Data */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('RetrieveData')}
        >
          <Text style={styles.buttonText}>Retrieve Data</Text>
        </TouchableOpacity>

        {/* Retrieve Data with Other Make*/}
        {role === USER_ROLES.HPCL && (
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              navigation.navigate('ItemsList', {
                outletName: '',
                workType: '',
                make: '',
                warrantyTillDate: '',
                vendor: '',
                otherMake: true,
              })
            }
          >
            <Text style={styles.buttonText}>Retrieve Data with Other Make</Text>
          </TouchableOpacity>
        )}

        {/* Add Master Data → Only if role is HPCL */}
        {role === USER_ROLES.HPCL && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('MasterData')}
          >
            <Text style={styles.buttonText}>Add Master Data</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
  },
  button: {
    width: '80%',
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
