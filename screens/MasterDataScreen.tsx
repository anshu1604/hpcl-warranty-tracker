import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RootStackParamList } from '../App';
import { ScreenWrapper } from '../components/ScreenWrapper';

type Props = NativeStackScreenProps<RootStackParamList, 'MasterData'>;

const MasterDataScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Text style={styles.title}>Select Master Data to update</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AddOutlet')}
          >
            <Text style={styles.actionButtonText}>Add Outlet</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AddWorkType')}
          >
            <Text style={styles.actionButtonText}>Add Work Type</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AddMake')}
          >
            <Text style={styles.actionButtonText}>Add Make</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AddItem')}
          >
            <Text style={styles.actionButtonText}>Add Item</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default MasterDataScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'column', // vertical arrangement
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    width: '80%',
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 3,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
