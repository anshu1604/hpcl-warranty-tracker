import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

interface CustomDatePickerProps {
  visible: boolean;
  onClose: () => void;
  onDateSelect: (date: string) => void;
  value?: string;
  isWarranty?: boolean;
}

const generateArrayOfYears = (isWarrantyMode = false) => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];

  if (isWarrantyMode) {
    // Warranty mode: from currentYear - 10 to currentYear + 20
    for (let i = currentYear + 20; i >= currentYear - 10; i--) {
      years.push(i);
    }
  } else {
    // Default mode: current year to current year - 10
    for (let i = currentYear; i >= currentYear - 10; i--) {
      years.push(i);
    }
  }

  return years;
};

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const getDaysInMonth = (month: number, year: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const initialSelectedDate = {
  day: '',
  month: '',
  year: '',
};

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  visible,
  onClose,
  onDateSelect,
  value,
  isWarranty,
}) => {
  const [selectedDate, setSelectedDate] = React.useState({
    ...initialSelectedDate,
  });

  useEffect(() => {
    if (!value) {
      setSelectedDate({ ...initialSelectedDate });
      return;
    }
  }, [value]);

  const handleDateChange = (type: 'day' | 'month' | 'year', value: string) => {
    const newDate = { ...selectedDate, [type]: value };
    setSelectedDate(newDate);

    if (newDate.day && newDate.month && newDate.year) {
      const formattedDate = `${newDate.day.padStart(2, '0')}/${(
        parseInt(newDate.month) + 1
      )
        .toString()
        .padStart(2, '0')}/${newDate.year}`;
      onDateSelect(formattedDate);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Date</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.datePickerContainer}>
            {/* Day Picker */}
            <ScrollView style={styles.pickerColumn}>
              {[
                ...Array(
                  getDaysInMonth(
                    selectedDate.month
                      ? parseInt(selectedDate.month)
                      : new Date().getMonth(),
                    selectedDate.year
                      ? parseInt(selectedDate.year)
                      : new Date().getFullYear(),
                  ),
                ),
              ].map((_, index) => (
                <TouchableOpacity
                  key={`day-${index + 1}`}
                  style={[
                    styles.pickerItem,
                    selectedDate.day === (index + 1).toString() &&
                      styles.selectedItem,
                  ]}
                  onPress={() =>
                    handleDateChange('day', (index + 1).toString())
                  }
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      selectedDate.day === (index + 1).toString() &&
                        styles.selectedItemText,
                    ]}
                  >
                    {(index + 1).toString().padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Month Picker */}
            <ScrollView style={styles.pickerColumn}>
              {months.map((month, index) => (
                <TouchableOpacity
                  key={`month-${index}`}
                  style={[
                    styles.pickerItem,
                    selectedDate.month === index.toString() &&
                      styles.selectedItem,
                  ]}
                  onPress={() => handleDateChange('month', index.toString())}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      selectedDate.month === index.toString() &&
                        styles.selectedItemText,
                    ]}
                  >
                    {month}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Year Picker */}
            <ScrollView style={styles.pickerColumn}>
              {generateArrayOfYears(isWarranty).map(year => (
                <TouchableOpacity
                  key={`year-${year}`}
                  style={[
                    styles.pickerItem,
                    selectedDate.year === year.toString() &&
                      styles.selectedItem,
                  ]}
                  onPress={() => handleDateChange('year', year.toString())}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      selectedDate.year === year.toString() &&
                        styles.selectedItemText,
                    ]}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  datePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 200,
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: 5,
  },
  pickerItem: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  selectedItem: {
    backgroundColor: '#007AFF',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedItemText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
