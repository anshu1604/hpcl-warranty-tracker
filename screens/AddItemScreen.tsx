import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { Google_Sheet_Creds } from '../sheetCredentials';
import { ScreenWrapper } from '../components/ScreenWrapper';

const initialFormData: FormDataType = {
  itemName: '',
  make: [],
  warranty: '',
  workTypeName: '',
  workTypeID: '',
};

type FormDataType = {
  itemName: string;
  make: Array<string>;
  warranty: string;
  workTypeName: string;
  workTypeID: string;
};

const AddItemScreen = () => {
  const [makes, setMakes] = useState<Array<Array<string>>>([]);
  const [items, setItems] = useState<Array<Array<string>>>([]);
  const [workTypes, setWorkTypes] = useState<Array<Array<string>>>([]);
  const [formData, setFormData] = useState<FormDataType>({
    ...initialFormData,
  });
  const [showMakePicker, setShowMakePicker] = useState<boolean>(false);
  const [showWorkTypePicker, setShowWorkTypePicker] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [expandedCards, setExpandedCards] = useState<{
    [key: string]: boolean;
  }>({});
  const [errors, setErrors] = useState<{
    itemName?: string;
    make?: string;
    warranty?: string;
    workType?: string;
  }>({});

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [makesList, itemsList, workTypeList] = await Promise.all([
          axios.get(Google_Sheet_Creds.makeMasterData),
          axios.get(Google_Sheet_Creds.itemMasterData),
          axios.get(Google_Sheet_Creds.workTypeMasterData),
        ]);
        const makeData = (makesList.data.values || []).slice(1); // remove header
        const itemData = (itemsList.data.values || []).slice(1); // remove header
        const workTypeData = (workTypeList.data.values || []).slice(1); // remove header
        setMakes(makeData);
        setItems(itemData);
        setWorkTypes(workTypeData);
      } catch (error) {
        console.error('Error fetching make data:', error);
      }
    };
    fetchMasterData();
  }, []);

  const handleAdd = async () => {
    const newErrors: typeof errors = {};

    if (!formData.itemName.trim()) newErrors.itemName = 'Item Name is required';
    if (formData.make.length === 0)
      newErrors.make = 'At least one Make is required';
    if (!formData.warranty.trim()) newErrors.warranty = 'Warranty is required';
    if (!formData.workTypeID.trim())
      newErrors.workType = 'Work Type is required';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        // Map selected make names to their IDs
        const makeIds = formData.make
          .map(name => {
            const makeObj = makes.find(m => m[1] === name);
            return makeObj ? parseInt(makeObj[0]) : null;
          })
          .filter(Boolean); // remove nulls

        const dataToSend = {
          action: 'addItemMasterData',
          itemName: formData.itemName,
          warranty: formData.warranty,
          make: JSON.stringify(makeIds),
          workType: formData.workTypeID,
        };

        // Send to backend
        await axios.post(Google_Sheet_Creds.WEB_APP_URL, dataToSend);

        // Update items list locally
        const newItem = [
          (items.length + 1).toString(), // temporary ID
          formData.itemName,
          formData.warranty,
          JSON.stringify(makeIds),
          formData.workTypeID,
        ];
        setItems(prev => [newItem, ...prev]);

        // Reset form
        setFormData({ ...initialFormData });
        setShowMakePicker(false);
        setErrors({});
      } catch (error) {
        console.error('Error adding item:', error);
      }
    }
  };

  return (
    <ScreenWrapper scrollable>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          {/* Item Name Input */}
          <Text style={styles.label}>
            Item Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter item name"
            value={formData.itemName}
            onChangeText={text =>
              setFormData({
                ...formData,
                itemName: text,
              })
            }
          />
          {errors.itemName && (
            <Text style={styles.errorText}>{errors.itemName}</Text>
          )}

          {/* Type of Work Input */}
          <Text style={styles.label}>
            Type of Work <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[styles.input]}
            onPress={() => setShowWorkTypePicker(true)}
          >
            <Text
              style={
                formData.workTypeID
                  ? styles.dropdownText
                  : styles.placeholderText
              }
            >
              {formData.workTypeName || 'Select Type of Work'}
            </Text>
          </TouchableOpacity>
          {errors.workType ? (
            <Text style={styles.errorText}>{errors.workType}</Text>
          ) : null}

          {/* Make Input */}
          <Text style={styles.label}>
            Make <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[styles.input]}
            onPress={() => setShowMakePicker(true)}
          >
            <Text
              style={
                formData.make.length
                  ? styles.dropdownText
                  : styles.placeholderText
              }
            >
              {formData.make.length > 0
                ? formData.make.join(', ')
                : 'Select Make'}
            </Text>
          </TouchableOpacity>

          {errors.make && <Text style={styles.errorText}>{errors.make}</Text>}

          {/* Warranty Input */}
          <Text style={styles.label}>
            Warranty <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter warranty period"
            value={formData.warranty}
            onChangeText={text =>
              setFormData({
                ...formData,
                warranty: text,
              })
            }
          />
          {errors.warranty && (
            <Text style={styles.errorText}>{errors.warranty}</Text>
          )}

          {/* Add Button */}
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>

          {/* Search Box */}
          <TextInput
            style={styles.searchInput}
            placeholder="Search Items..."
            value={searchText}
            onChangeText={setSearchText}
          />

          {/* Make Picker Modal */}
          <Modal visible={showMakePicker} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Make</Text>
                  <TouchableOpacity
                    onPress={() => setShowMakePicker(false)}
                    style={styles.closeButton}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.optionsList}>
                  {makes.map(make => {
                    const isSelected = formData.make.includes(make[1]);
                    return (
                      <TouchableOpacity
                        key={make[0]}
                        style={[
                          styles.optionItem,
                          isSelected && styles.selectedOption,
                        ]}
                        onPress={() => {
                          if (isSelected) {
                            // Remove if already selected
                            setFormData(prev => ({
                              ...prev,
                              make: prev.make.filter(m => m !== make[1]),
                            }));
                          } else {
                            // Add to selection
                            setFormData(prev => ({
                              ...prev,
                              make: [...prev.make, make[1]],
                            }));
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            isSelected && styles.selectedOptionText,
                          ]}
                        >
                          {make[1]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Work Type Picker Modal */}
          <Modal visible={showWorkTypePicker} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Type of Work</Text>
                  <TouchableOpacity
                    onPress={() => setShowWorkTypePicker(false)}
                    style={styles.closeButton}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.optionsList}>
                  {workTypes.map(type => (
                    <TouchableOpacity
                      key={type[0]}
                      style={[
                        styles.optionItem,
                        formData.workTypeName === type[1] &&
                          styles.selectedOption,
                      ]}
                      onPress={() => {
                        setFormData({
                          ...formData,
                          workTypeID: type[0],
                          workTypeName: type[1],
                        });
                        setShowWorkTypePicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          formData.workTypeName === type[1] &&
                            styles.selectedOptionText,
                        ]}
                      >
                        {type[1]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>
        <ScrollView style={{ flex: 1, marginTop: 20 }}>
          {items
            .filter(item =>
              item[1].toLowerCase().includes(searchText.toLowerCase()),
            )
            .map(item => {
              // Map make IDs to names
              let makeNames = '';
              try {
                const makeIds: string[] = JSON.parse(item[3]);
                makeNames = makeIds
                  .map(id => {
                    const makeObj = makes.find(m => m[0] === id.toString());
                    return makeObj ? makeObj[1] : '';
                  })
                  .filter(Boolean)
                  .join(', ');
              } catch (e) {
                makeNames = '';
              }

              const isExpanded = !!expandedCards[item[0]];

              return (
                <TouchableOpacity
                  key={item[0]}
                  activeOpacity={0.9}
                  onPress={() =>
                    setExpandedCards(prev => ({
                      ...prev,
                      [item[0]]: !prev[item[0]],
                    }))
                  }
                >
                  <View style={styles.card}>
                    {/* Card Header */}
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{item[1]}</Text>

                      <View
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                      >
                        <View style={styles.warrantyBadge}>
                          <Text style={styles.warrantyText}>
                            {item[2]} {parseInt(item[2]) > 1 ? 'years' : 'year'}
                          </Text>
                        </View>
                        <Text style={styles.arrowIcon}>
                          {isExpanded ? '▲' : '▼'}
                        </Text>
                      </View>
                    </View>

                    {/* Card Body (expandable) */}
                    {isExpanded && (
                      <View style={styles.cardBody}>
                        <Text style={styles.cardLabel}>Work Type</Text>
                        <View style={styles.cardRow}>
                          <View style={styles.badgeContainer}>
                            {workTypes.map((workType, idx) => {
                              if (workType[0] === item[4]) {
                                return (
                                  <View key={idx} style={styles.badge}>
                                    <Text style={styles.badgeText}>
                                      {workType[1]}
                                    </Text>
                                  </View>
                                );
                              }
                            })}
                          </View>
                        </View>
                        <Text style={styles.cardLabel}>Makes</Text>
                        <View style={styles.cardRow}>
                          <View style={styles.badgeContainer}>
                            {makeNames.split(', ').map((name, idx) => (
                              <View key={idx} style={styles.badge}>
                                <Text style={styles.badgeText}>{name}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
        </ScrollView>
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
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500',
  },
  required: {
    color: '#ff0000',
    fontSize: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    textAlignVertical: 'center',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  optionsList: {
    maxHeight: 300,
  },
  optionItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedOption: {
    backgroundColor: '#e8f0fe',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOptionText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  searchInput: {
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    marginTop: 20,
  },
  cardText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#555',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginHorizontal: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  cardBody: {
    padding: 15,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  cardLabel: {
    fontWeight: '600',
    color: '#333',
    marginRight: 5,
    fontSize: 14,
  },
  cardValue: {
    fontSize: 14,
    color: '#555',
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  badge: {
    backgroundColor: '#e0f2f1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 12,
    color: '#00796b',
    fontWeight: '500',
  },
  cardHeader: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16, // smaller than before
    fontWeight: 'bold',
  },
  warrantyBadge: {
    backgroundColor: '#C8E6C9', // slightly lighter green badge
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  warrantyText: {
    color: '#2E7D32',
    fontWeight: '600',
    fontSize: 12,
  },
  arrowIcon: {
    fontSize: 16,
    marginLeft: 8,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ff0000',
    fontSize: 12,
    marginBottom: 8,
    marginTop: -8,
  },
});

export default AddItemScreen;
