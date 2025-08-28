import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';

interface SimpleDateTimePickerProps {
  label: string;
  value: Date;
  onDateChange: (date: Date) => void;
  disabled?: boolean;
}

export default function SimpleDateTimePicker({
  label,
  value,
  onDateChange,
  disabled = false
}: SimpleDateTimePickerProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  const [showEditor, setShowEditor] = useState(false);
  const [dateInput, setDateInput] = useState('');
  const [timeInput, setTimeInput] = useState('');

  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
  };

  const formatTimeForInput = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

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

  const openEditor = () => {
    if (!disabled) {
      setDateInput(formatDateForInput(value));
      setTimeInput(formatTimeForInput(value));
      setShowEditor(true);
    }
  };

  const handleSave = () => {
    try {
      // Parse date input (DD/MM/YYYY)
      const [day, month, year] = dateInput.split('/').map(Number);
      // Parse time input (HH:MM)
      const [hours, minutes] = timeInput.split(':').map(Number);
      
      if (!day || !month || !year || isNaN(hours) || isNaN(minutes)) {
        Alert.alert('Erreur', 'Format invalide. Utilisez DD/MM/YYYY pour la date et HH:MM pour l\'heure');
        return;
      }
      
      if (month < 1 || month > 12 || day < 1 || day > 31) {
        Alert.alert('Erreur', 'Date invalide');
        return;
      }
      
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        Alert.alert('Erreur', 'Heure invalide. Utilisez le format 24h (00:00 - 23:59)');
        return;
      }
      
      const newDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
      
      if (isNaN(newDate.getTime())) {
        Alert.alert('Erreur', 'Date/heure invalide');
        return;
      }
      
      console.log('Nouvelle date créée:', newDate);
      onDateChange(newDate);
      setShowEditor(false);
    } catch (error) {
      Alert.alert('Erreur', 'Format invalide');
    }
  };

  const handleCancel = () => {
    setShowEditor(false);
  };

  // Fonctions pour les boutons rapides
  const addMinutes = (mins: number) => {
    const newDate = new Date(value);
    newDate.setMinutes(newDate.getMinutes() + mins);
    onDateChange(newDate);
  };

  const addHours = (hrs: number) => {
    const newDate = new Date(value);
    newDate.setHours(newDate.getHours() + hrs);
    onDateChange(newDate);
  };

  const addDays = (days: number) => {
    const newDate = new Date(value);
    newDate.setDate(newDate.getDate() + days);
    onDateChange(newDate);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      
      <TouchableOpacity
        style={[
          styles.mainButton,
          { 
            backgroundColor: colors.inputBackground,
            borderColor: colors.border,
            opacity: disabled ? 0.6 : 1
          }
        ]}
        onPress={openEditor}
        disabled={disabled}
      >
        <View style={styles.mainButtonContent}>
          <View style={styles.dateTimeDisplay}>
            <Text style={[styles.dateText, { color: colors.text }]}>
              📅 {formatDate(value)}
            </Text>
            <Text style={[styles.timeText, { color: colors.text }]}>
              🕐 {formatTime(value)}
            </Text>
          </View>
          <Text style={[styles.editIcon, { color: colors.primary }]}>✏️</Text>
        </View>
      </TouchableOpacity>

      {/* Boutons rapides */}
      {!disabled && (
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickButton, { backgroundColor: colors.cardBackground }]}
            onPress={() => addDays(-1)}
          >
            <Text style={[styles.quickButtonText, { color: colors.primary }]}>-1j</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.quickButton, { backgroundColor: colors.cardBackground }]}
            onPress={() => addHours(-1)}
          >
            <Text style={[styles.quickButtonText, { color: colors.primary }]}>-1h</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.quickButton, { backgroundColor: colors.cardBackground }]}
            onPress={() => addMinutes(-15)}
          >
            <Text style={[styles.quickButtonText, { color: colors.primary }]}>-15min</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.quickButton, { backgroundColor: colors.cardBackground }]}
            onPress={() => addMinutes(15)}
          >
            <Text style={[styles.quickButtonText, { color: colors.primary }]}>+15min</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.quickButton, { backgroundColor: colors.cardBackground }]}
            onPress={() => addHours(1)}
          >
            <Text style={[styles.quickButtonText, { color: colors.primary }]}>+1h</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.quickButton, { backgroundColor: colors.cardBackground }]}
            onPress={() => addDays(1)}
          >
            <Text style={[styles.quickButtonText, { color: colors.primary }]}>+1j</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal d'édition */}
      <Modal
        visible={showEditor}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Modifier {label.toLowerCase()}
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Date (DD/MM/YYYY)</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                  color: colors.text
                }]}
                value={dateInput}
                onChangeText={setDateInput}
                placeholder="15/01/2024"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Heure (HH:MM)</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                  color: colors.text
                }]}
                value={timeInput}
                onChangeText={setTimeInput}
                placeholder="14:30"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.textSecondary }]}
                onPress={handleCancel}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleSave}
              >
                <Text style={styles.modalButtonText}>Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  mainButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  mainButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTimeDisplay: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  editIcon: {
    fontSize: 20,
  },
  quickActions: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 6,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  quickButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});