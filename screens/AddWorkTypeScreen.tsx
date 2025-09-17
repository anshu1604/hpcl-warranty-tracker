import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  StatusBar,
  TouchableOpacity,
  Alert,
  Platform,
  Keyboard,
} from 'react-native';
import { Google_Sheet_Creds } from '../sheetCredentials';
import axios from 'axios';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Footer } from '../components/Footer';

const AddWorkTypeScreen = () => {
  const [workTypes, setworkTypes] = useState<Array<Array<string>>>([]);
  const [filteredworkTypes, setFilteredworkTypes] = useState<
    Array<Array<string>>
  >([]);
  const [searchText, setSearchText] = useState('');
  const [newworkType, setNewworkType] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const response = await axios.get(Google_Sheet_Creds.workTypeMasterData);
        const workTypeData = (response.data.values || []).slice(1); // remove header
        setworkTypes(workTypeData);
        setFilteredworkTypes(workTypeData);
      } catch (error) {
        console.error('Error fetching workType data:', error);
      }
    };
    fetchMasterData();
  }, []);

  useEffect(() => {
    if (searchText === '') {
      setFilteredworkTypes(workTypes);
    } else {
      const filtered = workTypes.filter(item =>
        item[1].toLowerCase().includes(searchText.toLowerCase()),
      );
      setFilteredworkTypes(filtered);
    }
  }, [searchText, workTypes]);

  const addworkType = async () => {
    const trimmed = newworkType.trim();
    if (trimmed === '') return;

    // Check for duplicate
    const exists = workTypes.some(
      ([_, name]) => name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (exists) {
      setError('This outlet already exists');
      return;
    }

    // Clear previous error
    setError('');

    // Close the keyboard
    Keyboard.dismiss();

    await axios.post(Google_Sheet_Creds.WEB_APP_URL, {
      action: 'addWorkType',
      workType: trimmed,
    });

    // Generate a new ID (increment last ID or use timestamp)
    const newId =
      workTypes.length > 0
        ? Math.max(...workTypes.map(o => parseInt(o[0]))) + 1
        : 1;
    const newEntry: Array<string> = [newId.toString(), trimmed];

    const updatedworkTypes = [...workTypes, newEntry];
    setworkTypes(updatedworkTypes);
    setFilteredworkTypes(updatedworkTypes);
    setNewworkType('');
  };

  return (
    <ScreenWrapper listScreen>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          {/* New workType Input */}
          <View style={styles.addContainer}>
            <TextInput
              style={styles.addInput}
              placeholder="Enter new workType"
              value={newworkType}
              onChangeText={setNewworkType}
              onSubmitEditing={addworkType} // press Enter to add
            />
            <TouchableOpacity style={styles.addButton} onPress={addworkType}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}

          {/* Search Box */}
          <TextInput
            style={styles.searchInput}
            placeholder="Search workType..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <FlatList
          data={filteredworkTypes}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.workTypeItem}>
              <Text style={styles.workTypeText}>{item[1]}</Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListFooterComponent={filteredworkTypes.length ? <Footer /> : null}
        />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  addContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  addInput: {
    flex: 1,
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  addButton: {
    marginLeft: 10,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  searchInput: {
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  workTypeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  workTypeText: {
    fontSize: 16,
    color: '#333',
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 99, 99, 0.3)', // pastel red
    borderColor: '#C0392B', // dark red
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#C0392B',
    fontWeight: '600',
  },
});

export default AddWorkTypeScreen;
