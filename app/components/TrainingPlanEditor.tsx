import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { TrainingPlan, TrainingExercise } from '../../lib/supabase';
import { TrainingPlanService } from '../services/trainingPlanService';

interface SectionDraft {
  tempId: string;
  name: string;    // "warm up", "set 1", etc.
  content: string; // texte libre multi-lignes
}

interface TrainingPlanEditorProps {
  planId?: string;
  coachId: string;
  onSaved: () => void;
  onCancel: () => void;
}

let uid = 0;
const nextId = () => `s-${++uid}`;

const todayISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const DEFAULT_SECTIONS = ['warm up', 'set 1', 'set 2', 'set 3', 'kick set'];

export default function TrainingPlanEditor({
  planId, coachId, onSaved, onCancel,
}: TrainingPlanEditorProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState('');
  const [sections, setSections] = useState<SectionDraft[]>([
    { tempId: nextId(), name: 'warm up', content: '' },
    { tempId: nextId(), name: 'set 1', content: '' },
  ]);
  const [loading, setLoading] = useState(!!planId);
  const [saving, setSaving] = useState(false);

  // ─── Chargement mode édition ──────────────────────────────────
  useEffect(() => {
    if (!planId) return;
    TrainingPlanService.getPlanWithExercises(planId).then(result => {
      if (!result) { Alert.alert('Erreur', 'Plan introuvable'); onCancel(); return; }
      setTitle(result.plan.title);
      setDate(result.plan.date);
      setNotes(result.plan.notes ?? '');
      setSections(
        result.exercises.length > 0
          ? result.exercises.map(ex => ({ tempId: nextId(), name: ex.name, content: ex.content }))
          : [{ tempId: nextId(), name: 'warm up', content: '' }]
      );
      setLoading(false);
    });
  }, [planId]);

  // ─── Sections ─────────────────────────────────────────────────
  const addSection = (name = '') =>
    setSections(prev => [...prev, { tempId: nextId(), name, content: '' }]);

  const removeSection = (tempId: string) =>
    setSections(prev => prev.filter(s => s.tempId !== tempId));

  const updateSection = (tempId: string, field: 'name' | 'content', value: string) =>
    setSections(prev => prev.map(s => s.tempId === tempId ? { ...s, [field]: value } : s));

  // ─── Sauvegarde ───────────────────────────────────────────────
  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Erreur', 'Le titre est obligatoire'); return; }
    if (!date) { Alert.alert('Erreur', 'La date est obligatoire'); return; }
    const filled = sections.filter(s => s.content.trim());
    if (!filled.length) { Alert.alert('Erreur', 'Ajoutez au moins une section avec du contenu'); return; }

    setSaving(true);
    const exList = filled.map((s, idx) => ({
      orderIndex: idx,
      name: s.name.trim() || `section ${idx + 1}`,
      content: s.content.trim(),
    }));

    let ok = false;
    if (planId) {
      ok = await TrainingPlanService.updatePlan(
        planId,
        { title: title.trim(), date, notes: notes.trim() || undefined, lastModifiedBy: coachId },
        exList
      );
    } else {
      const result = await TrainingPlanService.createPlan(
        { title: title.trim(), date, createdBy: coachId, notes: notes.trim() || undefined },
        exList
      );
      ok = !!result;
    }

    setSaving(false);
    if (ok) {
      Alert.alert('Succès', planId ? 'Plan mis à jour !' : 'Plan créé !');
      onSaved();
    } else {
      Alert.alert('Erreur', 'Impossible de sauvegarder. Vérifiez les logs.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardShouldPersistTaps="handled"
    >
      {/* ─── Infos du plan ─── */}
      <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.label, { color: colors.text }]}>Titre *</Text>
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
          placeholder="Ex: Jeudi 29 — Technique libre"
          placeholderTextColor={colors.textSecondary}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>Date *</Text>
        {Platform.OS === 'web' ? (
          <input
            type="date"
            title="Date du plan"
            aria-label="Date du plan"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 16,
              color: colors.text,
              backgroundColor: colors.inputBackground,
              width: '100%',
              boxSizing: 'border-box',
              marginBottom: 4,
            } as any}
          />
        ) : (
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
            placeholder="AAAA-MM-JJ"
            placeholderTextColor={colors.textSecondary}
            value={date}
            onChangeText={setDate}
          />
        )}

        <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>Notes générales</Text>
        <TextInput
          style={[styles.input, styles.multiline, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
          placeholder="Objectifs du jour, remarques..."
          placeholderTextColor={colors.textSecondary}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={2}
        />
      </View>

      {/* ─── Sections ─── */}
      <Text style={[styles.sectionsTitle, { color: colors.text }]}>
        Sections ({sections.length})
      </Text>

      {sections.map((section, idx) => (
        <View
          key={section.tempId}
          style={[styles.sectionCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
        >
          {/* En-tête : numéro + nom + supprimer */}
          <View style={styles.sectionHeader}>
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{idx + 1}</Text>
            </View>
            <TextInput
              style={[styles.sectionNameInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Titre de la section"
              placeholderTextColor={colors.textSecondary}
              value={section.name}
              onChangeText={v => updateSection(section.tempId, 'name', v)}
            />
            <TouchableOpacity onPress={() => removeSection(section.tempId)} style={styles.removeBtn}>
              <Text style={{ color: colors.error, fontSize: 18, fontWeight: '600' }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Zone de texte libre */}
          <TextInput
            style={[
              styles.contentInput,
              { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border },
            ]}
            placeholder={`Ex:\n300 modéré @ 4:45\n200 fast @ 3:15 cible 2:35\n100 ez back`}
            placeholderTextColor={colors.textSecondary}
            value={section.content}
            onChangeText={v => updateSection(section.tempId, 'content', v)}
            multiline
            textAlignVertical="top"
          />
        </View>
      ))}

      {/* ─── Ajouter section ─── */}
      <View style={styles.addRow}>
        {/* Suggestions rapides */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestions}>
          {DEFAULT_SECTIONS.map(name => (
            <TouchableOpacity
              key={name}
              style={[styles.suggestionChip, { backgroundColor: colors.background, borderColor: colors.primary }]}
              onPress={() => addSection(name)}
            >
              <Text style={[styles.suggestionText, { color: colors.primary }]}>+ {name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity
        style={[styles.addSectionBtn, { borderColor: colors.primary }]}
        onPress={() => addSection('')}
      >
        <Text style={[styles.addSectionText, { color: colors.primary }]}>+ Section personnalisée</Text>
      </TouchableOpacity>

      {/* ─── Actions ─── */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.cancelBtn, { borderColor: colors.border }]}
          onPress={onCancel}
          disabled={saving}
        >
          <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Annuler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: saving ? colors.textSecondary : colors.success }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>{planId ? 'Mettre à jour' : 'Créer le plan'}</Text>
          }
        </TouchableOpacity>
      </View>

      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  card: { borderRadius: 16, padding: 18, margin: 14, marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 2,
  },
  multiline: { height: 64, textAlignVertical: 'top' },

  sectionsTitle: { fontSize: 17, fontWeight: '700', marginHorizontal: 14, marginTop: 10, marginBottom: 6 },

  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 14,
    marginBottom: 10,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  badge: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  sectionNameInput: {
    flex: 1,
    borderBottomWidth: 1,
    paddingVertical: 4,
    fontSize: 15,
    fontWeight: '600',
  },
  removeBtn: { padding: 4 },

  contentInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    lineHeight: 22,
    minHeight: 120,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  addRow: { marginHorizontal: 14, marginBottom: 8 },
  suggestions: { flexDirection: 'row' },
  suggestionChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  suggestionText: { fontSize: 13, fontWeight: '600' },

  addSectionBtn: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    marginHorizontal: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  addSectionText: { fontSize: 15, fontWeight: '600' },

  actions: { flexDirection: 'row', gap: 12, marginHorizontal: 14 },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 16, fontWeight: '600' },
  saveBtn: { flex: 2, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', minHeight: 50 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
