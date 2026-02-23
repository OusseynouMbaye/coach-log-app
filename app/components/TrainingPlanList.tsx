import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { TrainingPlan, TrainingExercise } from '../../lib/supabase';
import { TrainingPlanService } from '../services/trainingPlanService';
import { useTrainingPlans } from '../hooks/useTrainingPlans';
import TrainingPlanEditor from './TrainingPlanEditor';
import UserSelector from './UserSelector';

interface TrainingPlanListProps {
  onClose: () => void;
}

type Screen =
  | { type: 'list' }
  | { type: 'pick-coach-for-new' }
  | { type: 'pick-coach-for-edit'; planId: string }
  | { type: 'new'; coachId: string }
  | { type: 'view'; planId: string }
  | { type: 'edit'; planId: string; coachId: string };

export default function TrainingPlanList({ onClose }: TrainingPlanListProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { plans, loading, error, refresh, deletePlan } = useTrainingPlans();
  const [screen, setScreen] = useState<Screen>({ type: 'list' });
  const [viewPlan, setViewPlan] = useState<{ plan: TrainingPlan; exercises: TrainingExercise[] } | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const openView = async (planId: string) => {
    setViewLoading(true);
    const result = await TrainingPlanService.getPlanWithExercises(planId);
    setViewLoading(false);
    if (result) {
      setViewPlan(result);
      setScreen({ type: 'view', planId });
    }
  };

  const handleDelete = (plan: TrainingPlan) => {
    Alert.alert(
      'Supprimer le plan',
      `Supprimer "${plan.title}" ? Tous les exercices seront perdus.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive',
          onPress: async () => {
            await deletePlan(plan.id);
            setScreen({ type: 'list' });
          },
        },
      ]
    );
  };

  // ─── Rendu selon l'écran actif ───────────────────────────────

  const renderContent = () => {
    // Sélection de coach pour nouveau plan
    if (screen.type === 'pick-coach-for-new') {
      return (
        <View style={{ flex: 1 }}>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Qui crée ce plan ?
          </Text>
          <UserSelector
            selectedUserId=""
            onSelectUser={coachId => setScreen({ type: 'new', coachId })}
          />
        </View>
      );
    }

    // Sélection de coach pour modifier
    if (screen.type === 'pick-coach-for-edit') {
      return (
        <View style={{ flex: 1 }}>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Qui modifie ce plan ?
          </Text>
          <UserSelector
            selectedUserId=""
            onSelectUser={coachId =>
              setScreen({ type: 'edit', planId: screen.planId, coachId })
            }
          />
        </View>
      );
    }

    // Éditeur (création ou modification)
    if (screen.type === 'new' || screen.type === 'edit') {
      return (
        <TrainingPlanEditor
          planId={screen.type === 'edit' ? screen.planId : undefined}
          coachId={screen.coachId}
          onSaved={() => { refresh(); setScreen({ type: 'list' }); }}
          onCancel={() => setScreen({ type: 'list' })}
        />
      );
    }

    // Vue détaillée d'un plan
    if (screen.type === 'view' && viewPlan) {
      return renderPlanView(viewPlan);
    }

    // Liste principale
    return renderList();
  };

  const renderList = () => {
    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.error }]}>❌ {error}</Text>
          <TouchableOpacity onPress={refresh} style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.retryBtnText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (plans.length === 0) {
      return (
        <View style={styles.center}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🏊</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Aucun plan d'entraînement pour l'instant.
          </Text>
          <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
            Appuyez sur "+ Nouveau plan" pour créer le premier.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {plans.map(plan => (
          <TouchableOpacity
            key={plan.id}
            style={[styles.planCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
            onPress={() => openView(plan.id)}
            activeOpacity={0.8}
          >
            <View style={styles.planCardTop}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.planDate, { color: colors.primary }]}>
                  {TrainingPlanService.formatDate(plan.date)}
                </Text>
                <Text style={[styles.planTitle, { color: colors.text }]} numberOfLines={2}>
                  {plan.title}
                </Text>
              </View>
              <Text style={{ fontSize: 28 }}>🏊</Text>
            </View>

            <View style={styles.planCardMeta}>
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                Par {TrainingPlanService.formatCoachName(plan.createdBy)}
              </Text>
              {plan.lastModifiedBy && plan.lastModifiedBy !== plan.createdBy && (
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  · Modifié par {TrainingPlanService.formatCoachName(plan.lastModifiedBy)}
                </Text>
              )}
            </View>

            {plan.notes ? (
              <Text style={[styles.planNotes, { color: colors.textSecondary }]} numberOfLines={2}>
                {plan.notes}
              </Text>
            ) : null}
          </TouchableOpacity>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>
    );
  };

  const renderPlanView = ({ plan, exercises }: { plan: TrainingPlan; exercises: TrainingExercise[] }) => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* En-tête plan */}
      <View style={[styles.viewHeader, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.viewDate, { color: colors.primary }]}>
          {TrainingPlanService.formatDate(plan.date)}
        </Text>
        <Text style={[styles.viewTitle, { color: colors.text }]}>{plan.title}</Text>
        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
          Créé par {TrainingPlanService.formatCoachName(plan.createdBy)}
          {plan.lastModifiedBy && plan.lastModifiedBy !== plan.createdBy
            ? ` · Modifié par ${TrainingPlanService.formatCoachName(plan.lastModifiedBy)}`
            : ''}
        </Text>
        {plan.notes ? (
          <Text style={[styles.viewNotes, { color: colors.textSecondary, borderColor: colors.border }]}>
            {plan.notes}
          </Text>
        ) : null}
      </View>

      {/* Sections */}
      {exercises.map((ex, idx) => (
        <View key={ex.id} style={[styles.exCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          {/* Titre de la section */}
          <View style={styles.exCardHeader}>
            <View style={[styles.exBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.exBadgeText}>{idx + 1}</Text>
            </View>
            <Text style={[styles.exSectionName, { color: colors.primary }]}>
              {ex.name.toUpperCase()}
            </Text>
          </View>

          {/* Contenu texte libre — affiché tel quel, police mono */}
          <Text style={[styles.exContent, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}>
            {ex.content}
          </Text>
        </View>
      ))}

      {/* Actions */}
      <View style={styles.viewActions}>
        <TouchableOpacity
          style={[styles.editBtn, { backgroundColor: colors.primary }]}
          onPress={() => setScreen({ type: 'pick-coach-for-edit', planId: plan.id })}
        >
          <Text style={styles.editBtnText}>✏️ Modifier</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.deleteActionBtn, { borderColor: colors.error }]}
          onPress={() => handleDelete(plan)}
        >
          <Text style={[styles.deleteActionText, { color: colors.error }]}>🗑 Supprimer</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  // ─── Entête modal ────────────────────────────────────────────

  const headerTitle = () => {
    if (screen.type === 'new') return 'Nouveau plan';
    if (screen.type === 'edit') return 'Modifier le plan';
    if (screen.type === 'view') return 'Plan d\'entraînement';
    if (screen.type === 'pick-coach-for-new' || screen.type === 'pick-coach-for-edit') return 'Choisir le coach';
    return 'Entraînements';
  };

  const goBack = () => {
    if (screen.type === 'list') { onClose(); return; }
    if (screen.type === 'pick-coach-for-new') { setScreen({ type: 'list' }); return; }
    if (screen.type === 'pick-coach-for-edit') { setScreen({ type: 'view', planId: screen.planId }); return; }
    if (screen.type === 'new' || screen.type === 'edit') { setScreen({ type: 'list' }); return; }
    if (screen.type === 'view') { setScreen({ type: 'list' }); return; }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ─── Header ─── */}
      <View style={[styles.header, { backgroundColor: colors.headerBackground }]}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>
            {screen.type === 'list' ? '✕' : '←'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{headerTitle()}</Text>
        {screen.type === 'list' ? (
          <TouchableOpacity
            style={[styles.newBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={() => setScreen({ type: 'pick-coach-for-new' })}
          >
            <Text style={styles.newBtnText}>+ Nouveau</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {viewLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: screen.type === 'list' ? 12 : 0 }}>
          {renderContent()}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 16,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  backBtnText: { color: '#fff', fontSize: 22, fontWeight: '600' },
  headerTitle: { flex: 1, color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  newBtn: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  newBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  subtitle: { fontSize: 15, textAlign: 'center', marginVertical: 12 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 17, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
  emptyHint: { fontSize: 14, textAlign: 'center' },
  retryBtn: { marginTop: 16, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  retryBtnText: { color: '#fff', fontWeight: '600' },

  // Plan cards (liste)
  planCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  planCardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  planDate: { fontSize: 12, fontWeight: '600', marginBottom: 4, textTransform: 'capitalize' },
  planTitle: { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  planCardMeta: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
  metaText: { fontSize: 12 },
  planNotes: { fontSize: 13, lineHeight: 18, marginTop: 4 },

  // Vue détaillée
  viewHeader: { padding: 20, margin: 12, borderRadius: 16 },
  viewDate: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize', marginBottom: 4 },
  viewTitle: { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  viewNotes: { marginTop: 12, padding: 12, borderWidth: 1, borderRadius: 10, fontSize: 14, lineHeight: 20 },

  exercisesLabel: { fontSize: 16, fontWeight: '700', marginHorizontal: 12, marginTop: 4, marginBottom: 8 },

  exCard: { marginHorizontal: 12, marginBottom: 10, borderRadius: 12, borderWidth: 1, padding: 14 },
  exCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  exBadge: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  exBadgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  exSectionName: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5, flex: 1 },
  exContent: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  viewActions: { flexDirection: 'row', gap: 12, margin: 12, marginTop: 20 },
  editBtn: { flex: 2, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  editBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  deleteActionBtn: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  deleteActionText: { fontWeight: '600', fontSize: 15 },
});
