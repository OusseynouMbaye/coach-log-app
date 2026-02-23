import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';

// Import conditionnel pour éviter les erreurs sur le web
let DateTimePicker: any = null;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

interface NativeDateTimePickerProps {
  label: string;
  value: Date;
  onDateChange: (date: Date) => void;
  disabled?: boolean;
}

export default function NativeDateTimePicker({
  label,
  value,
  onDateChange,
  disabled = false
}: NativeDateTimePickerProps) {
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

  // Format pour les inputs HTML (web)
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTimeForInput = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleWebDateChange = (e: any) => {
    if (!e.target.value) return;
    const [year, month, day] = e.target.value.split('-').map(Number);
    const newDate = new Date(value);
    newDate.setFullYear(year, month - 1, day);
    onDateChange(newDate);
  };

  const handleWebTimeChange = (e: any) => {
    if (!e.target.value) return;
    const [hours, minutes] = e.target.value.split(':').map(Number);
    const newDate = new Date(value);
    newDate.setHours(hours, minutes, 0, 0);
    onDateChange(newDate);
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

  const onDatePickerChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (selectedDate) {
        onDateChange(selectedDate);
      }
    } else {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const onTimePickerChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
      if (selectedDate) {
        onDateChange(selectedDate);
      }
    } else {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const confirmDateChange = () => {
    onDateChange(tempDate);
    setShowDatePicker(false);
  };

  const confirmTimeChange = () => {
    onDateChange(tempDate);
    setShowTimePicker(false);
  };

  const cancelDatePicker = () => {
    setTempDate(value);
    setShowDatePicker(false);
  };

  const cancelTimePicker = () => {
    setTempDate(value);
    setShowTimePicker(false);
  };

  // ─── RENDU WEB ───────────────────────────────────────────────
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        <View style={styles.pickersRow}>
          {/* Date — input HTML natif */}
          <View style={[
            styles.pickerButton,
            styles.dateButton,
            { backgroundColor: colors.cardBackground, borderColor: colors.border, opacity: disabled ? 0.6 : 1 }
          ]}>
            <View style={styles.pickerContent}>
              <Text style={[styles.pickerIcon, { color: colors.primary }]}>📅</Text>
              <View style={styles.pickerTextContainer}>
                <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Date</Text>
                <input
                  type="date"
                  title={label}
                  aria-label={label}
                  disabled={disabled}
                  value={formatDateForInput(value)}
                  onChange={handleWebDateChange}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontSize: 15,
                    fontWeight: '600',
                    color: colors.text,
                    outline: 'none',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    width: '100%',
                  } as any}
                />
              </View>
            </View>
          </View>

          {/* Heure — input HTML natif */}
          <View style={[
            styles.pickerButton,
            styles.timeButton,
            { backgroundColor: colors.cardBackground, borderColor: colors.border, opacity: disabled ? 0.6 : 1 }
          ]}>
            <View style={styles.pickerContent}>
              <Text style={[styles.pickerIcon, { color: colors.primary }]}>🕐</Text>
              <View style={styles.pickerTextContainer}>
                <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Heure</Text>
                <input
                  type="time"
                  title={label}
                  aria-label={label}
                  disabled={disabled}
                  value={formatTimeForInput(value)}
                  onChange={handleWebTimeChange}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontSize: 15,
                    fontWeight: '600',
                    color: colors.text,
                    outline: 'none',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    width: '100%',
                  } as any}
                />
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // ─── RENDU iOS / Android ──────────────────────────────────────
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>

      <View style={styles.pickersRow}>
        {/* Sélecteur de date */}
        <TouchableOpacity
          style={[
            styles.pickerButton,
            styles.dateButton,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
              opacity: disabled ? 0.6 : 1
            }
          ]}
          onPress={openDatePicker}
          disabled={disabled}
        >
          <View style={styles.pickerContent}>
            <Text style={[styles.pickerIcon, { color: colors.primary }]}>📅</Text>
            <View style={styles.pickerTextContainer}>
              <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Date</Text>
              <Text style={[styles.pickerValue, { color: colors.text }]}>
                {formatDate(value)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Sélecteur d'heure */}
        <TouchableOpacity
          style={[
            styles.pickerButton,
            styles.timeButton,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
              opacity: disabled ? 0.6 : 1
            }
          ]}
          onPress={openTimePicker}
          disabled={disabled}
        >
          <View style={styles.pickerContent}>
            <Text style={[styles.pickerIcon, { color: colors.primary }]}>🕐</Text>
            <View style={styles.pickerTextContainer}>
              <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Heure</Text>
              <Text style={[styles.pickerValue, { color: colors.text }]}>
                {formatTime(value)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Modal pour le sélecteur de date iOS */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={cancelDatePicker}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={cancelDatePicker}>
                  <Text style={[styles.modalButton, { color: colors.primary }]}>Annuler</Text>
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Sélectionner une date</Text>
                <TouchableOpacity onPress={confirmDateChange}>
                  <Text style={[styles.modalButton, { color: colors.primary }]}>Confirmer</Text>
                </TouchableOpacity>
              </View>

              {DateTimePicker && (
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  onChange={onDatePickerChange}
                  textColor={colors.text}
                  locale="fr-FR"
                />
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* Modal pour le sélecteur d'heure iOS */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showTimePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={cancelTimePicker}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={cancelTimePicker}>
                  <Text style={[styles.modalButton, { color: colors.primary }]}>Annuler</Text>
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Sélectionner l'heure</Text>
                <TouchableOpacity onPress={confirmTimeChange}>
                  <Text style={[styles.modalButton, { color: colors.primary }]}>Confirmer</Text>
                </TouchableOpacity>
              </View>

              {DateTimePicker && (
                <DateTimePicker
                  value={tempDate}
                  mode="time"
                  display="spinner"
                  onChange={onTimePickerChange}
                  textColor={colors.text}
                  locale="fr-FR"
                />
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* DateTimePicker pour Android */}
      {Platform.OS === 'android' && showDatePicker && DateTimePicker && (
        <DateTimePicker
          value={value}
          mode="date"
          display="calendar"
          onChange={onDatePickerChange}
        />
      )}

      {Platform.OS === 'android' && showTimePicker && DateTimePicker && (
        <DateTimePicker
          value={value}
          mode="time"
          display="clock"
          onChange={onTimePickerChange}
        />
      )}
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
    marginBottom: 12,
  },
  pickersRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    minHeight: 80,
  },
  dateButton: {
    flex: 1.2,
  },
  timeButton: {
    flex: 1,
  },
  pickerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  pickerTextContainer: {
    alignItems: 'center',
    width: '100%',
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  pickerValue: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalButton: {
    fontSize: 16,
    fontWeight: '600',
  },
});
