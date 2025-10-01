import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import axios from 'axios';
import { Google_Sheet_Creds } from '../sheetCredentials';
import { CustomDatePicker } from '../components/CustomDatePicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { USER_ROLES } from '../helper/constant';
import { ScreenWrapper } from '../components/ScreenWrapper';

const InitialFormData = {
  outletName: '',
  workType: '',
  make: '',
  warrantyTillDate: '',
  vendor: '',
};

type Props = NativeStackScreenProps<RootStackParamList, 'RetrieveData'>;

export const RetrieveDataScreen: React.FC<Props> = ({ navigation }) => {
  const [formData, setFormData] = useState({ ...InitialFormData });

  const [showOutletPicker, setShowOutletPicker] = useState(false);
  const [showWorkTypePicker, setShowWorkTypePicker] = useState(false);
  const [showMakePicker, setShowMakePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showVendorPicker, setShowVendorPicker] = useState(false);

  const [OutletNames, setOutLetNames] = useState<Array<Array<string>>>([]);
  const [WorkTypes, setWorkTypes] = useState<Array<Array<string>>>([]);
  const [Makes, setMakes] = useState<Array<Array<string>>>([]);
  const [dealerOutlets, setDealerOutlets] = useState<string>('');
  const [vendorsList, setVendorsList] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const promiseList = [
          axios.get(Google_Sheet_Creds.outletMasterData),
          axios.get(Google_Sheet_Creds.workTypeMasterData),
          axios.get(Google_Sheet_Creds.makeMasterData),
        ];

        // Get user info from AsyncStorage
        const storedUser = await AsyncStorage.getItem('user');
        const parsedStoredUser = JSON.parse(storedUser || '{}');
        const userId = parsedStoredUser.userID;
        const userRole = parsedStoredUser.role;

        if (userRole === USER_ROLES.DEALER || userRole === USER_ROLES.HPCL) {
          promiseList.push(axios.get(Google_Sheet_Creds.userList));
        }

        const [outlets, workTypes, makes, users] = await Promise.all([
          ...promiseList,
        ]);

        const outletData = (outlets.data.values || []).slice(1);
        const workTypeData = (workTypes.data.values || []).slice(1);
        const makeData = (makes.data.values || []).slice(1);
        const usersData: Array<Array<string>> = (
          users?.data.values || []
        ).slice(1);

        if (userRole === USER_ROLES.HPCL && usersData && usersData.length > 0) {
          const vendors: { [key: string]: string } = {};
          usersData.forEach(user => {
            if (user[6] === USER_ROLES.VENDOR) {
              vendors[user[2]] = user[0];
            }
          });
          setVendorsList(vendors);
        }

        if (
          userRole === USER_ROLES.DEALER &&
          usersData &&
          usersData.length > 0
        ) {
          usersData.forEach(user => {
            if (userId === user[0]) setDealerOutlets(user[7]);
          });
        }

        setOutLetNames([...outletData]);
        setWorkTypes([...workTypeData]);
        setMakes([...makeData]);
      } catch (error) {
        console.error('Error fetching master data:', error);
      }
    };
    fetchMasterData();
  }, []);

  const handleRetrieve = () => {
    navigation.navigate('ItemsList', {
      outletName: formData.outletName,
      workType: formData.workType,
      make: formData.make,
      warrantyTillDate: formData.warrantyTillDate,
      vendor: vendorsList[formData.vendor] || '',
      otherMake: false,
    });
    setFormData({ ...InitialFormData });
  };

  // Parse dealerOutlets string to array
  const dealerOutletIds: string[] = dealerOutlets
    ? JSON.parse(dealerOutlets).map((id: number) => id.toString())
    : [];

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Text style={styles.heading}>Select Filters</Text>

        {/* Outlet Name Input */}
        <Text style={styles.label}>Outlet Name</Text>
        <TouchableOpacity
          style={[styles.input]}
          onPress={() => setShowOutletPicker(true)}
        >
          <Text
            style={
              formData.outletName ? styles.dropdownText : styles.placeholderText
            }
          >
            {formData.outletName || 'Select Outlet'}
          </Text>
        </TouchableOpacity>

        {/* Vendor Name Input */}
        {Object.keys(vendorsList).length > 0 && (
          <>
            <Text style={styles.label}>Vendors</Text>
            <TouchableOpacity
              style={[styles.input]}
              onPress={() => setShowVendorPicker(true)}
            >
              <Text
                style={
                  formData.vendor ? styles.dropdownText : styles.placeholderText
                }
              >
                {formData.vendor || 'Select Vendor'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Work Type Input */}
        <Text style={styles.label}>Work Type</Text>
        <TouchableOpacity
          style={[styles.input]}
          onPress={() => setShowWorkTypePicker(true)}
        >
          <Text
            style={
              formData.workType ? styles.dropdownText : styles.placeholderText
            }
          >
            {formData.workType || 'Select Work Type'}
          </Text>
        </TouchableOpacity>

        {/* Make Input */}
        <Text style={styles.label}>Make</Text>
        <TouchableOpacity
          style={[styles.input]}
          onPress={() => setShowMakePicker(true)}
        >
          <Text
            style={formData.make ? styles.dropdownText : styles.placeholderText}
          >
            {formData.make || 'Select Make'}
          </Text>
        </TouchableOpacity>

        {/* Warranty till Date */}
        <Text style={styles.label}>Warranty Till Date</Text>
        <TouchableOpacity
          style={[styles.input]}
          onPress={() => setShowDatePicker(true)}
        >
          <Text
            style={
              formData.warrantyTillDate
                ? styles.dateText
                : styles.placeholderText
            }
          >
            {formData.warrantyTillDate || 'Select Date'}
          </Text>
        </TouchableOpacity>

        {/* Retrieve Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleRetrieve}>
          <Text style={styles.submitButtonText}>Retrieve</Text>
        </TouchableOpacity>

        {/* Outlet Picker Modal */}
        <Modal visible={showOutletPicker} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Outlet</Text>
                <TouchableOpacity
                  onPress={() => setShowOutletPicker(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.optionsList}>
                {OutletNames.filter(outlet => {
                  if (dealerOutletIds.length === 0) return true;
                  return dealerOutletIds.includes(outlet[0]);
                }).map(outlet => (
                  <TouchableOpacity
                    key={outlet[0]}
                    style={[
                      styles.optionItem,
                      formData.outletName === outlet[1] &&
                        styles.selectedOption,
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, outletName: outlet[1] });
                      setShowOutletPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        formData.outletName === outlet[1] &&
                          styles.selectedOptionText,
                      ]}
                    >
                      {outlet[1]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Vendor Picker Modal */}
        <Modal visible={showVendorPicker} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Vendor</Text>
                <TouchableOpacity
                  onPress={() => setShowVendorPicker(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.optionsList}>
                {Object.keys(vendorsList).map((vendor, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionItem,
                      formData.vendor === vendor && styles.selectedOption,
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, vendor });
                      setShowVendorPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        formData.vendor === vendor && styles.selectedOptionText,
                      ]}
                    >
                      {vendor}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Work Type Picker Modal */}
        <Modal visible={showWorkTypePicker} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Work Type</Text>
                <TouchableOpacity
                  onPress={() => setShowWorkTypePicker(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.optionsList}>
                {WorkTypes.map(work => (
                  <TouchableOpacity
                    key={work[0]}
                    style={[
                      styles.optionItem,
                      formData.workType === work[1] && styles.selectedOption,
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, workType: work[1] });
                      setShowWorkTypePicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        formData.workType === work[1] &&
                          styles.selectedOptionText,
                      ]}
                    >
                      {work[1]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

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
                {Makes.map(make => (
                  <TouchableOpacity
                    key={make[0]}
                    style={[
                      styles.optionItem,
                      formData.make === make[1] && styles.selectedOption,
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, make: make[1] });
                      setShowMakePicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        formData.make === make[1] && styles.selectedOptionText,
                      ]}
                    >
                      {make[1]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Date Picker */}
        <CustomDatePicker
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          onDateSelect={date => {
            setFormData(prev => ({ ...prev, warrantyTillDate: date }));
          }}
          value={formData.warrantyTillDate}
          isWarranty
        />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500',
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
  },
  submitButton: {
    backgroundColor: '#007AFF',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  required: {
    color: '#ff0000',
    fontSize: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    textAlignVertical: 'center',
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
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  submitButtonDisabled: {
    backgroundColor: '#7fb5e6', // lighter blue when disabled
    opacity: 0.7,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'center',
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
});
