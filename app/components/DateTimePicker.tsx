import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';

interface CustomDateTimePickerProps {
  label: string;
  value: Date;
  onDateChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export default function CustomDateTimePicker({
  label,
  value,
  onDateChange,
  minimumDate,
  maximumDate,
  disabled = false
}: CustomDateTimePickerProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(value);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const generateDateList = () => {
    const dates = [];
    const baseDate = new Date(value); // Utilise la date actuelle de la session comme référence
    
    // Génère 60 jours (30 avant, 30 après la date de la session)
    for (let i = -30; i <= 30; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    
    return dates.sort((a, b) => a.getTime() - b.getTime());
  };

  const generateTimeList = () => {
    const times = [];
    for (let hour = 6; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = new Date();
        time.setHours(hour, minute, 0, 0);
        times.push(time);
      }
    }
    return times;
  };

  const handleDateSelect = (selectedDate: Date) => {
    const newDate = new Date(value);
    newDate.setFullYear(selectedDate.getFullYear());
    newDate.setMonth(selectedDate.getMonth());
    newDate.setDate(selectedDate.getDate());
    
    console.log('Date sélectionnée:', newDate);
    setTempDate(newDate);
    onDateChange(newDate);
    setShowDatePicker(false);
  };

  const handleTimeSelect = (selectedTime: Date) => {
    const newDate = new Date(value);
    newDate.setHours(selectedTime.getHours());
    newDate.setMinutes(selectedTime.getMinutes());
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    
    console.log('Heure sélectionnée:', newDate);
    setTempDate(newDate);
    onDateChange(newDate);
    setShowTimePicker(false);
  };

  const openDatePicker = () => {
    if (!disabled) {
      setTempDate(value);
      setShowDatePicker(true);
    }
  };

  const openTimePicker = () => {
    if (!disabled) {
      setTempDate(value);
      setShowTimePicker(true);
    }
  };

  const isDateDisabled = (date: Date) => {
    if (minimumDate && date < minimumDate) return true;
    if (maximumDate && date > maximumDate) return true;
    return false;
  };

  const renderDatePicker = () => (
    <Modal
      visible={showDatePicker}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowDatePicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.textSecondary }]}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.modalButtonText}>Annuler</Text>
            </TouchableOpacity>
            
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Sélectionner une date
            </Text>
            
            <View style={styles.modalButton} />
          </View>
          
          <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false}>
            {generateDateList().map((date, index) => {
              const isSelected = date.toDateString() === value.toDateString();
              const isDisabled = isDateDisabled(date);
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.pickerItem,
                    { 
                      backgroundColor: isSelected ? colors.primary : 'transparent',
                      opacity: isDisabled ? 0.4 : 1
                    }
                  ]}
                  onPress={() => {
                    if (!isDisabled) {
                      console.log('Clic sur date:', formatDate(date));
                      handleDateSelect(date);
                    }
                  }}
                  disabled={isDisabled}
                >
                  <Text style={[
                    styles.pickerItemText,
                    { 
                      color: isSelected ? '#fff' : colors.text,
                      fontWeight: isSelected ? '600' : '400'
                    }
                  ]}>
                    {formatDate(date)}
                  </Text>
                  <Text style={[
                    styles.pickerItemSubtext,
                    { color: isSelected ? '#fff' : colors.textSecondary }
                  ]}>
                    {date.toLocaleDateString('fr-FR', { weekday: 'long' })}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderTimePicker = () => (
    <Modal
      visible={showTimePicker}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowTimePicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.textSecondary }]}
              onPress={() => setShowTimePicker(false)}
            >
              <Text style={styles.modalButtonText}>Annuler</Text>
            </TouchableOpacity>
            
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Sélectionner l'heure
            </Text>
            
            <View style={styles.modalButton} />
          </View>
          
          <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false}>
            {generateTimeList().map((time, index) => {
              const isSelected = time.getHours() === value.getHours() && 
                               time.getMinutes() === value.getMinutes();
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.pickerItem,
                    { backgroundColor: isSelected ? colors.primary : 'transparent' }
                  ]}
                  onPress={() => {
                    console.log('Clic sur heure:', formatTime(time));
                    handleTimeSelect(time);
                  }}
                >
                  <Text style={[
                    styles.pickerItemText,
                    { 
                      color: isSelected ? '#fff' : colors.text,
                      fontWeight: isSelected ? '600' : '400'
                    }
                  ]}>
                    {formatTime(time)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      
      <View style={styles.pickersContainer}>
        <TouchableOpacity
          style={[
            styles.pickerButton,
            styles.dateButton,
            { 
              backgroundColor: colors.inputBackground,
              borderColor: colors.border,
              opacity: disabled ? 0.6 : 1
            }
          ]}
          onPress={openDatePicker}
          disabled={disabled}
        >
          <View style={styles.pickerContent}>
            <Text style={[styles.pickerIcon, { color: colors.primary }]}>📅</Text>
            <Text style={[styles.pickerText, { color: colors.text }]}>
              {formatDate(value)}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.pickerButton,
            styles.timeButton,
            { 
              backgroundColor: colors.inputBackground,
              borderColor: colors.border,
              opacity: disabled ? 0.6 : 1
            }
          ]}
          onPress={openTimePicker}
          disabled={disabled}
        >
          <View style={styles.pickerContent}>
            <Text style={[styles.pickerIcon, { color: colors.primary }]}>🕐</Text>
            <Text style={[styles.pickerText, { color: colors.text }]}>
              {formatTime(value)}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {renderDatePicker()}
      {renderTimePicker()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  pickersContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  dateButton: {
    flex: 2,
  },
  timeButton: {
    flex: 1,
  },
  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pickerIcon: {
    fontSize: 18,
  },
  pickerText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  pickerList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  pickerItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginVertical: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 56,
  },
  pickerItemText: {
    fontSize: 16,
  },
  pickerItemSubtext: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
});