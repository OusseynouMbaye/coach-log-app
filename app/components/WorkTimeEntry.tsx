import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { SupabaseWorkSessionService } from '../services/supabaseService';
import { useCategories } from '../hooks/useCategories';
import NativeDateTimePicker from './NativeDateTimePicker';

interface WorkTimeEntryProps {
  userId: string;
  onSessionCreated?: () => void;
}

export default function WorkTimeEntry({ userId, onSessionCreated }: WorkTimeEntryProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [startTime, setStartTime] = useState<Date>(() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    return d;
  });
  const [endTime, setEndTime] = useState<Date>(() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    return d;
  });
  const [isSaving, setIsSaving] = useState(false);

  const { categories, loading: categoriesLoading } = useCategories();

  const calculateDuration = (): number => {
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return Math.max(0, diffMinutes);
  };

  const validateInput = (): { isValid: boolean; error?: string } => {
    if (!selectedCategory) {
      return { isValid: false, error: 'Veuillez sélectionner une catégorie' };
    }

    if (endTime <= startTime) {
      return { isValid: false, error: 'L\'heure de fin doit être après l\'heure de début' };
    }

    const duration = calculateDuration();
    if (duration === 0) {
      return { isValid: false, error: 'La durée doit être supérieure à 0 minutes' };
    }

    if (duration > 24 * 60) {
      return { isValid: false, error: 'La durée ne peut pas dépasser 24 heures' };
    }

    return { isValid: true };
  };

  const handleSave = async () => {
    const validation = validateInput();
    if (!validation.isValid) {
      Alert.alert('Erreur', validation.error);
      return;
    }

    setIsSaving(true);
    try {
      const duration = calculateDuration();

      console.log('🔄 Tentative de création de session...');
      console.log('📊 Données de la session:', {
        userId,
        category: selectedCategory,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        durationInMinutes: duration,
      });

      const newSession = await SupabaseWorkSessionService.createSession({
        userId,
        category: selectedCategory,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        durationInMinutes: duration,
      });

      if (newSession) {
        console.log('✅ Session créée avec succès:', newSession);
        Alert.alert('Succès', `Session de ${formatDuration(duration)} enregistrée !`);

        // Réinitialiser le formulaire
        setSelectedCategory('');
        const reset = new Date();
        reset.setMinutes(0, 0, 0);
        setStartTime(reset);
        const resetEnd = new Date(reset);
        resetEnd.setHours(resetEnd.getHours() + 1);
        setEndTime(resetEnd);

        onSessionCreated?.();
      } else {
        console.error('❌ Aucune session retournée');
        Alert.alert(
          'Erreur',
          'Échec de la création de la session. Vérifiez les logs de la console pour plus de détails.'
        );
      }
    } catch (error) {
      console.error('❌ Exception lors de la sauvegarde:', error);
      Alert.alert('Erreur', `Impossible d'enregistrer la session: ${error}`);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins}min`;
    }

    return mins === 0 ? `${hours}h` : `${hours}h ${mins}min`;
  };

  const duration = calculateDuration();
  const validation = validateInput();

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          Entrer mon temps de travail
        </Text>

        {/* Sélection de la catégorie */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>
            Catégorie de travail *
          </Text>

          {categoriesLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : categories.length === 0 ? (
            <Text style={[styles.noCategoriesText, { color: colors.error }]}>
              ⚠️ Aucune catégorie trouvée. Vérifiez votre connexion Supabase ou ajoutez des catégories.
            </Text>
          ) : (
            <View style={styles.categoriesContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    {
                      backgroundColor: selectedCategory === category
                        ? colors.primary
                        : colors.background,
                      borderColor: colors.border,
                    }
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      {
                        color: selectedCategory === category
                          ? '#fff'
                          : colors.text
                      }
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Heure de début */}
        <View style={styles.section}>
          <NativeDateTimePicker
            label="Heure de début *"
            value={startTime}
            onDateChange={setStartTime}
          />
        </View>

        {/* Heure de fin */}
        <View style={styles.section}>
          <NativeDateTimePicker
            label="Heure de fin *"
            value={endTime}
            onDateChange={setEndTime}
          />
        </View>

        {/* Aperçu de la durée */}
        <View style={[styles.durationPreview, { backgroundColor: colors.background }]}>
          <Text style={[styles.durationLabel, { color: colors.textSecondary }]}>
            Durée totale
          </Text>
          <Text style={[styles.durationValue, { color: colors.primary }]}>
            {formatDuration(duration)}
          </Text>
          <Text style={[styles.durationMinutes, { color: colors.textSecondary }]}>
            ({duration} minutes)
          </Text>
        </View>

        {/* Messages de validation — toujours visible */}
        {!validation.isValid && (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.error }]}>
              ⚠️ {validation.error}
            </Text>
          </View>
        )}

        {/* Bouton d'enregistrement */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: validation.isValid && !isSaving
                ? colors.success
                : colors.textSecondary,
            }
          ]}
          onPress={handleSave}
          disabled={!validation.isValid || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              Enregistrer la session
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    margin: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  noCategoriesText: {
    fontSize: 14,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  categoryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  durationPreview: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  durationLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  durationValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  durationMinutes: {
    fontSize: 12,
  },
  errorContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
