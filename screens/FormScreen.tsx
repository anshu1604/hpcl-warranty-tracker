import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { CustomDatePicker } from '../components/CustomDatePicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Google_Sheet_Creds } from '../sheetCredentials';
import { SHEET_ACTIONS, USER_ROLES } from '../helper/constant';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { uploadImageToCloudinary } from '../helper';
import { ScreenWrapper } from '../components/ScreenWrapper';

type Props = NativeStackScreenProps<RootStackParamList, 'Form'>;

const InitialFormData = {
  itemName: '',
  warranty: '',
  outletName: '',
  typeOfWork: '',
  make: '',
  customMake: '',
  oemName: '',
  oemTollFree: '',
  poNumber: '',
  poDate: '',
  vendorName: '',
  vendorContact: '',
  dateOfInstallation: '',
  warrantyTillDate: '',
};

export function FormScreen({ navigation }: Props) {
  const [formData, setFormData] = useState({ ...InitialFormData });

  const [errors, setErrors] = useState({
    itemName: '',
    outletName: '',
    typeOfWork: '',
    make: '',
    customMake: '', // Add this line
    oemName: '',
    oemTollFree: '',
    vendorName: '',
    vendorContact: '',
    poNumber: '',
    poDate: '',
    dateOfInstallation: '',
    images: '',
  });

  const [ItemsList, setItemsList] = useState<Array<Array<string>>>([]);
  const [MakeList, setMakeList] = useState<Array<Array<string>>>([]);
  const [OutletList, setOutletList] = useState<Array<Array<string>>>([]);
  const [workTypeList, setWorkTypeList] = useState<Array<Array<string>>>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showInstallationDatePicker, setShowInstallationDatePicker] =
    useState(false);
  const [showPODatePicker, setShowPODatePicker] = useState(false);
  const [showOutletPicker, setShowOutletPicker] = useState(false);
  const [showWorkTypePicker, setShowWorkTypePicker] = useState(false);
  const [showMakePicker, setShowMakePicker] = useState(false);
  const [customMake, setCustomMake] = useState('');
  const [showItemNamePicker, setShowItemNamePicker] = useState(false);
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [supplyType, setSupplyType] = useState<'Vendor' | 'HPCL' | ''>('');

  useEffect(() => {
    const getMasterData = async () => {
      const [items, makes, outlets, workTypes] = await Promise.all([
        axios.get(Google_Sheet_Creds.itemMasterData),
        axios.get(Google_Sheet_Creds.makeMasterData),
        axios.get(Google_Sheet_Creds.outletMasterData),
        axios.get(Google_Sheet_Creds.workTypeMasterData),
      ]);
      const itemsRows = items.data.values || [];
      const makesRows = makes.data.values || [];
      const outletsRows = outlets.data.values || [];
      const workTypeRows = workTypes.data.values || [];

      const itemsData = itemsRows.slice(1);
      const makesData: Array<Array<string>> = makesRows.slice(1);
      const outletsData: Array<Array<string>> = outletsRows.slice(1);
      const workTypesData: Array<Array<string>> = workTypeRows.slice(1);

      setItemsList(itemsData);
      setMakeList(makesData);
      setOutletList(outletsData);
      setWorkTypeList(workTypesData);
    };
    getMasterData();
  }, []);

  const getAvailableMakes = (selectedItemId: string): string[] => {
    if (!selectedItemId || !MakeList.length) return [];

    // Convert selectedItemId string into an array of IDs
    const selectedIds = selectedItemId
      .replace(/[\[\]\s]/g, '') // Remove brackets and spaces
      .split(',')
      .map(id => id.trim())
      .filter(Boolean); // Remove empty strings

    return MakeList.filter(make => selectedIds.includes(make[0]))
      .map(make => make[1]) // Extract make names
      .filter(Boolean); // Remove empty values
  };

  const calculateWarrantyTillDate = (installDate: string, warranty: string) => {
    if (!installDate || !warranty) return '';

    try {
      // split dd/mm/yyyy
      const [day, month, year] = installDate.split('/').map(Number);
      const date = new Date(year, month - 1, day);

      const years = parseInt(warranty.replace(/\D/g, ''), 10); // extract number from "5 years"
      if (!isNaN(years)) {
        date.setFullYear(date.getFullYear() + years);

        // format back to dd/mm/yyyy
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
      }
      return '';
    } catch {
      return '';
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors };

    // Item Name validation
    if (!formData.itemName) {
      newErrors.itemName = 'Item Name is required';
      isValid = false;
    }

    // Outlet Name validation
    if (!formData.outletName) {
      newErrors.outletName = 'Outlet Name is required';
      isValid = false;
    }

    // Work Type validation
    if (!formData.typeOfWork) {
      newErrors.typeOfWork = 'Work Type is required';
      isValid = false;
    }

    // Make validation
    if (!formData.make) {
      newErrors.make = 'Make is required';
      isValid = false;
    } else if (formData.make === 'Other' && !customMake.trim()) {
      newErrors.customMake = 'Please specify the Make';
      isValid = false;
    }

    // OEM Name validation
    if (!formData.oemName || formData.oemName.length < 3) {
      newErrors.oemName = 'OEM Name must be at least 3 characters';
      isValid = false;
    }

    // OEM Toll-Free validation
    if (!formData.oemTollFree || !/^\d{10}$/.test(formData.oemTollFree)) {
      newErrors.oemTollFree = 'Please enter valid 10-digit number';
      isValid = false;
    }

    if (supplyType !== 'HPCL') {
      // Vendor Name validation
      if (!formData.vendorName || formData.vendorName.length < 3) {
        newErrors.vendorName = 'Vendor Name must be at least 3 characters';
        isValid = false;
      }

      // Vendor Contact validation
      if (!formData.vendorContact || !/^\d{10}$/.test(formData.vendorContact)) {
        newErrors.vendorContact = 'Please enter valid 10-digit number';
        isValid = false;
      }
    } else {
      newErrors.vendorName = '';
      newErrors.vendorContact = '';
    }

    // Installation Date validation
    if (!formData.dateOfInstallation) {
      newErrors.dateOfInstallation = 'Installation date is required';
      isValid = false;
    }

    // **Image validation moved here**
    if (imageUris.length < 2) {
      newErrors.images = 'Please upload at least 2 images';
      isValid = false;
    } else if (imageUris.length > 5) {
      newErrors.images = 'You can upload a maximum of 5 images';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (validateForm()) {
      try {
        const data = await AsyncStorage.getItem('user');

        // Upload all selected images to Cloudinary
        const uploadedImageUrls = await Promise.all(
          imageUris.map(uri => uploadImageToCloudinary(uri)),
        );

        // Filter out nulls (in case any upload failed)
        const validUrls = uploadedImageUrls.filter(url => url);

        const userData = JSON.parse(data || '{}');
        const {
          itemName,
          warranty,
          outletName,
          typeOfWork,
          make,
          customMake,
          vendorContact,
          vendorName,
          oemName,
          oemTollFree,
          poNumber,
          poDate,
          dateOfInstallation,
          warrantyTillDate,
        } = formData;
        await axios.post(Google_Sheet_Creds.WEB_APP_URL, {
          action: SHEET_ACTIONS.addItem,
          itemName,
          warranty,
          outletName,
          typeOfWork,
          make: make === 'Other' ? customMake : make, // Use customMake if 'Other' is selected
          vendorContact,
          vendorName,
          oemName,
          oemTollFree,
          poNumber,
          poDate,
          dateOfInstallation,
          warrantyTillDate,
          approved: userData.role === USER_ROLES.HPCL,
          userID: userData.userID,
          role: userData.role,
          images: validUrls.join(','), // Store as comma-separated URLs
          suppliedBy: supplyType,
        });
        setFormData({ ...InitialFormData });
        setImageUris([]);
      } catch (error) {
        console.error('Error saving data:', error);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setIsSubmitting(false);
    }
  };

  const handleUploadImages = () => {
    Alert.alert('Upload Images', 'Choose an option', [
      {
        text: 'Take Photo',
        onPress: () => launchCamera({ mediaType: 'photo' }, handleResponse),
      },
      {
        text: 'Choose from Gallery',
        onPress: () =>
          launchImageLibrary(
            { mediaType: 'photo', selectionLimit: 5 },
            handleResponse,
          ),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleResponse = (response: any) => {
    if (response.assets) {
      const selectedUris = response.assets
        .map((asset: any) => asset.uri)
        .filter(Boolean) as string[];

      if (selectedUris.length + imageUris.length > 5) {
        return;
      }

      setImageUris(prev => [...prev, ...selectedUris]);
      setErrors(prev => ({ ...prev, images: '' }));
    }
  };

  return (
    <ScreenWrapper scrollable>
      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        enableOnAndroid={true}
        extraScrollHeight={20} // pushes input above keyboard
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          {/* Image Upload */}
          {/* Image Upload Section */}
          <Text style={styles.label}>
            Upload Images <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUploadImages}
          >
            <Text style={styles.uploadButtonText}>Upload Images</Text>
          </TouchableOpacity>

          {/* Show image validation error */}
          {errors.images ? (
            <Text style={styles.errorText}>{errors.images}</Text>
          ) : null}

          {/* Display selected images */}
          <View style={styles.selectedImagesContainer}>
            {imageUris.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.selectedImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => {
                    setImageUris(prev => prev.filter((_, i) => i !== index));
                  }}
                >
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Item Name Dropdown */}
          <Text style={styles.label}>
            Item Name <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[styles.input, errors.itemName ? styles.inputError : null]}
            onPress={() => setShowItemNamePicker(true)}
          >
            <Text
              style={
                formData.itemName ? styles.dropdownText : styles.placeholderText
              }
            >
              {formData.itemName || 'Select Item Name'}
            </Text>
          </TouchableOpacity>
          {errors.itemName ? (
            <Text style={styles.errorText}>{errors.itemName}</Text>
          ) : null}

          {/* Item Name Picker Modal */}
          <Modal visible={showItemNamePicker} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Item Name</Text>
                  <TouchableOpacity
                    onPress={() => setShowItemNamePicker(false)}
                    style={styles.closeButton}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.optionsList}>
                  {ItemsList.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.optionItem,
                        formData.itemName === item[1] && styles.selectedOption,
                      ]}
                      onPress={() => {
                        const selectedItem = item;
                        const itemId = selectedItem[0]; // Get the item ID from index 0

                        setFormData(prev => {
                          const updated = {
                            ...prev,
                            itemName: selectedItem[1],
                            warranty: selectedItem[2] || 'N/A',
                            make: '',
                          };
                          updated.warrantyTillDate = calculateWarrantyTillDate(
                            updated.dateOfInstallation,
                            updated.warranty,
                          );
                          return updated;
                        });
                        setErrors({ ...errors, itemName: '', make: '' });
                        setShowItemNamePicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          formData.itemName === item[1] &&
                            styles.selectedOptionText,
                        ]}
                      >
                        {item[1]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>

          {['Canopy LED Light', 'Yard LED Light'].includes(
            formData.itemName,
          ) && (
            <View style={{ marginBottom: 15 }}>
              <Text style={styles.label}>Supplied By</Text>
              <View style={{ flexDirection: 'row', gap: 20 }}>
                <TouchableOpacity
                  style={styles.radioButton}
                  onPress={() => setSupplyType('Vendor')}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      supplyType === 'Vendor' && styles.radioSelected,
                    ]}
                  />
                  <Text style={styles.radioLabel}>Vendor</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.radioButton}
                  onPress={() => setSupplyType('HPCL')}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      supplyType === 'HPCL' && styles.radioSelected,
                    ]}
                  />
                  <Text style={styles.radioLabel}>HPCL</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Warranty Display */}
          <Text style={styles.label}>Warranty</Text>
          <View style={[styles.input, { backgroundColor: '#f0f0f0' }]}>
            <Text style={styles.dropdownText}>
              {formData.warranty || 'N/A'}
            </Text>
          </View>

          {/* Outlet Name Input */}
          <Text style={styles.label}>
            Outlet Name <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[styles.input, errors.outletName ? styles.inputError : null]}
            onPress={() => setShowOutletPicker(true)}
          >
            <Text
              style={
                formData.outletName
                  ? styles.dropdownText
                  : styles.placeholderText
              }
            >
              {formData.outletName || 'Select Outlet'}
            </Text>
          </TouchableOpacity>
          {errors.outletName ? (
            <Text style={styles.errorText}>{errors.outletName}</Text>
          ) : null}

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
                  {OutletList.map(outlet => (
                    <TouchableOpacity
                      key={outlet[0]}
                      style={[
                        styles.optionItem,
                        formData.outletName === outlet[1] &&
                          styles.selectedOption,
                      ]}
                      onPress={() => {
                        setFormData({ ...formData, outletName: outlet[1] });
                        setErrors({ ...errors, outletName: '' });
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

          {/* Type of Work Input */}
          <Text style={styles.label}>
            Type of Work <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[styles.input, errors.typeOfWork ? styles.inputError : null]}
            onPress={() => setShowWorkTypePicker(true)}
          >
            <Text
              style={
                formData.typeOfWork
                  ? styles.dropdownText
                  : styles.placeholderText
              }
            >
              {formData.typeOfWork || 'Select Type of Work'}
            </Text>
          </TouchableOpacity>
          {errors.typeOfWork ? (
            <Text style={styles.errorText}>{errors.typeOfWork}</Text>
          ) : null}

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
                  {workTypeList.map(type => (
                    <TouchableOpacity
                      key={type[0]}
                      style={[
                        styles.optionItem,
                        formData.typeOfWork === type[1] &&
                          styles.selectedOption,
                      ]}
                      onPress={() => {
                        setFormData({ ...formData, typeOfWork: type[1] });
                        setErrors({ ...errors, typeOfWork: '' });
                        setShowWorkTypePicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          formData.typeOfWork === type[1] &&
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

          {/* Make Input */}
          <Text style={styles.label}>
            Make <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[
              styles.input,
              errors.make && !formData.make ? styles.inputError : null,
            ]}
            onPress={() => setShowMakePicker(true)}
          >
            <Text
              style={
                formData.make ? styles.dropdownText : styles.placeholderText
              }
            >
              {formData.make || 'Select Make'}
            </Text>
          </TouchableOpacity>
          {errors.make && !formData.make ? (
            <Text style={styles.errorText}>{errors.make}</Text>
          ) : null}

          {/* Show text input if 'Other' is selected */}
          {formData.make === 'Other' && (
            <>
              <TextInput
                style={[
                  styles.input,
                  errors.customMake ? styles.inputError : null,
                ]}
                placeholder="Enter Make"
                value={customMake}
                onChangeText={text => {
                  setCustomMake(text);
                  setFormData({ ...formData, customMake: text }); // Store in actualMake instead
                  setErrors({ ...errors, customMake: '' });
                }}
              />
              {errors.customMake ? (
                <Text style={styles.errorText}>{errors.customMake}</Text>
              ) : null}
            </>
          )}

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
                  {/* Get the selected item's ID */}
                  {(() => {
                    const selectedItem = ItemsList.find(
                      item => item[1] === formData.itemName,
                    );

                    const availableMakes = selectedItem
                      ? getAvailableMakes(selectedItem[3])
                      : [];

                    return [
                      ...availableMakes,
                      'Other', // Always add 'Other' option at the end
                    ].map(make => (
                      <TouchableOpacity
                        key={make}
                        style={[
                          styles.optionItem,
                          formData.make === make && styles.selectedOption,
                        ]}
                        onPress={() => {
                          if (make === 'Other') {
                            setFormData({
                              ...formData,
                              make: 'Other',
                              customMake: '',
                            });
                            setCustomMake('');
                          } else {
                            setFormData({
                              ...formData,
                              make,
                              customMake: make,
                            });
                          }
                          setErrors({ ...errors, make: '' });
                          setShowMakePicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            formData.make === make && styles.selectedOptionText,
                          ]}
                        >
                          {make}
                        </Text>
                      </TouchableOpacity>
                    ));
                  })()}
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* OEM Name Input */}
          <Text style={styles.label}>
            OEM Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.oemName ? styles.inputError : null]}
            placeholder="Enter OEM Name"
            value={formData.oemName}
            onChangeText={text => {
              setFormData({ ...formData, oemName: text });
              setErrors({ ...errors, oemName: '' });
            }}
          />
          {errors.oemName ? (
            <Text style={styles.errorText}>{errors.oemName}</Text>
          ) : null}

          {/* OEM Toll-Free Input */}
          <Text style={styles.label}>
            OEM Toll-Free <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              errors.oemTollFree ? styles.inputError : null,
            ]}
            placeholder="Enter 10-digit number"
            value={formData.oemTollFree}
            onChangeText={text => {
              setFormData({
                ...formData,
                oemTollFree: text.replace(/[^0-9]/g, ''),
              });
              setErrors({ ...errors, oemTollFree: '' });
            }}
            keyboardType="numeric"
            maxLength={10}
          />
          {errors.oemTollFree ? (
            <Text style={styles.errorText}>{errors.oemTollFree}</Text>
          ) : null}

          {/* Vendor Name Input */}
          <Text style={styles.label}>
            Vendor Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              errors.vendorName ? styles.inputError : null,
              supplyType === 'HPCL' && { backgroundColor: '#e0e0e0' }, // greyed out
            ]}
            placeholder="Enter Vendor Name"
            value={formData.vendorName}
            editable={supplyType !== 'HPCL'} // disable input if HPCL
            onChangeText={text => {
              setFormData({ ...formData, vendorName: text });
              setErrors({ ...errors, vendorName: '' });
            }}
          />
          {errors.vendorName ? (
            <Text style={styles.errorText}>{errors.vendorName}</Text>
          ) : null}

          {/* Vendor Contact Input */}
          <Text style={styles.label}>
            Vendor Contact <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              errors.vendorContact ? styles.inputError : null,
              supplyType === 'HPCL' && { backgroundColor: '#e0e0e0' },
            ]}
            placeholder="Enter 10-digit number"
            value={formData.vendorContact}
            editable={supplyType !== 'HPCL'}
            onChangeText={text => {
              setFormData({
                ...formData,
                vendorContact: text.replace(/[^0-9]/g, ''),
              });
              setErrors({ ...errors, vendorContact: '' });
            }}
            keyboardType="numeric"
            maxLength={10}
          />
          {errors.vendorContact ? (
            <Text style={styles.errorText}>{errors.vendorContact}</Text>
          ) : null}

          {/* P.O Contact Input */}
          <Text style={styles.label}>
            P.O Number <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.poNumber ? styles.inputError : null]}
            placeholder="Enter 10-digit number"
            value={formData.poNumber}
            onChangeText={text => {
              setFormData({
                ...formData,
                poNumber: text.replace(/[^0-9]/g, ''),
              });
              setErrors({ ...errors, poNumber: '' });
            }}
            keyboardType="numeric"
            maxLength={10}
          />
          {errors.poNumber ? (
            <Text style={styles.errorText}>{errors.poNumber}</Text>
          ) : null}

          {/* P.O Date */}
          <Text style={styles.label}>
            P.O Date <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[styles.input, errors.poDate ? styles.inputError : null]}
            onPress={() => setShowPODatePicker(true)}
          >
            <Text
              style={formData.poDate ? styles.dateText : styles.placeholderText}
            >
              {formData.poDate || 'Select Date'}
            </Text>
          </TouchableOpacity>
          {errors.poDate ? (
            <Text style={styles.errorText}>{errors.poDate}</Text>
          ) : null}

          <CustomDatePicker
            visible={showPODatePicker}
            onClose={() => setShowPODatePicker(false)}
            onDateSelect={date => {
              const updated = { ...formData, poDate: date };
              setFormData(updated);
              setErrors({ ...errors, poDate: '' });
            }}
            value={formData.poDate}
          />

          {/* Installation Date Input */}
          <Text style={styles.label}>
            Date of Installation <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[
              styles.input,
              errors.dateOfInstallation ? styles.inputError : null,
            ]}
            onPress={() => setShowInstallationDatePicker(true)}
          >
            <Text
              style={
                formData.dateOfInstallation
                  ? styles.dateText
                  : styles.placeholderText
              }
            >
              {formData.dateOfInstallation || 'Select Date'}
            </Text>
          </TouchableOpacity>
          {errors.dateOfInstallation ? (
            <Text style={styles.errorText}>{errors.dateOfInstallation}</Text>
          ) : null}

          <CustomDatePicker
            visible={showInstallationDatePicker}
            onClose={() => setShowInstallationDatePicker(false)}
            onDateSelect={date => {
              const updated = { ...formData, dateOfInstallation: date };
              updated.warrantyTillDate = calculateWarrantyTillDate(
                updated.dateOfInstallation,
                updated.warranty,
              );
              setFormData(updated);
              setErrors({ ...errors, dateOfInstallation: '' });
            }}
            value={formData.dateOfInstallation}
          />

          {/* Warranty Till Date Display */}
          <Text style={styles.label}>Warranty Till Date</Text>
          <View style={[styles.input, { backgroundColor: '#f0f0f0' }]}>
            <Text style={styles.dropdownText}>
              {formData.warrantyTillDate || 'N/A'}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  formContainer: {
    padding: 20,
    paddingBottom: 40,
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
  inputError: {
    borderColor: '#ff0000',
  },
  errorText: {
    color: '#ff0000',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
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
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  required: {
    color: '#ff0000',
    fontSize: 16,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    textAlignVertical: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  submitButtonDisabled: {
    backgroundColor: '#7fb5e6', // lighter blue when disabled
    opacity: 0.7,
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
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  imageUpload: {
    height: 150,
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 8,
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedImagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    marginBottom: 15,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 10,
    marginBottom: 10,
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff0000',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: '#007AFF',
  },
  radioLabel: {
    fontSize: 16,
    marginLeft: 5,
  },
});
