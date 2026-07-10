/**
 * HelpSupportScreen - contact form + FAQ accordion.
 *
 * The contact form is a local-only mock (no backend endpoint yet). The FAQ is
 * a static list with expandable rows.
 *
 * Structural notes:
 *  - Root uses SafeAreaView (react-native-safe-area-context) with edges={['top']}
 *    so the status-bar inset is handled natively and content never clips behind
 *    a fixed header (the bug that the old Screen+Header combo caused).
 *  - The FAQ accordion uses conditional rendering (mount/unmount) of the answer
 *    block with overflow: 'visible' and no transform/scale animations, so an
 *    expanded answer naturally pushes subsequent rows downward.
 *  - The chevron icon simply swaps between 'chevron-down' and 'chevron-up' — no
 *    rotation transform is applied to any text or View container.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Input, Button } from '@components/ui';
import { useToast } from '@components/ui';
import { useAuth } from '@context/AuthContext';
import { adminService } from '@services/adminService';
import { theme } from '@theme/theme';
import type { RootStackParamList } from '@navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'HelpSupport'>;

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: 'How do I add a new wardrobe item?',
    a: 'Tap the + button on the Wardrobe screen, choose a photo, pick a category, tag the occasion and color, then save. Your item will appear in the wardrobe grid.',
  },
  {
    q: 'How does the Outfit Creator work?',
    a: 'Open the Outfits tab, pick an occasion, and tap Generate. WearWise matches items tagged for that occasion and builds a complete look (top, bottom, shoes, accessories).',
  },
  {
    q: 'Can I edit or delete a saved outfit?',
    a: 'Yes. Go to the Outfits tab, tap the trash icon on a saved outfit to delete it. To view it again, just tap the card.',
  },
  {
    q: 'How do I change my profile photo?',
    a: 'On the Profile screen, tap your avatar and choose "Change Photo" to upload a new picture from your library or camera.',
  },
  {
    q: 'Is my data secure?',
    a: 'Your account is protected by Supabase Auth and row-level security. Only you can read or modify your own wardrobe and profile data.',
  },
];

export function HelpSupportScreen({ navigation }: Props) {
  const { show: showToast } = useToast();
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(0);

  const toggleFaq = useCallback((idx: number) => {
    setExpanded((prev) => (prev === idx ? null : idx));
  }, []);

  const handleSend = useCallback(async () => {
    if (!subject.trim() || !message.trim()) {
      showToast('Please fill in the subject and message', 'error');
      return;
    }
    setSending(true);
    // Persist the message + subject to the admin table so support staff can
    // review it from the database.
    const ok = await adminService.create(
      user?.id ?? null,
      user?.email ?? null,
      { subject: subject.trim(), message: message.trim() },
    );
    setSending(false);
    if (ok) {
      setSubject('');
      setMessage('');
      showToast(
        'Your message has been sent. We\u2019ll reply by email.',
        'info',
      );
    } else {
      showToast('Could not send your message. Please try again.', 'error');
    }
  }, [subject, message, showToast, user?.id, user?.email]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ---- Inline header (back button + centered title) ---- */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name='chevron-back' size={26} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps='handled'
        >
          {/* Contact form */}
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Text style={styles.sectionDesc}>
            Have a question or feedback? Send us a message and we{'\u2019'}ll
            get back to you.
          </Text>
          <Input
            label='Subject'
            placeholder='What do you need help with?'
            value={subject}
            onChangeText={setSubject}
          />
          <Input
            label='Message'
            placeholder='Describe your issue…'
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            style={styles.messageInput}
          />
          <Button
            title='Send Message'
            onPress={handleSend}
            loading={sending}
            fullWidth
            icon={
              !sending ? (
                <Ionicons
                  name='send'
                  size={18}
                  color={theme.colors.textInverse}
                  style={styles.btnIcon}
                />
              ) : undefined
            }
          />

          {/* FAQ */}
          <Text
            style={[styles.sectionTitle, { marginTop: theme.spacing.xxxl }]}
          >
            Frequently Asked Questions
          </Text>
          {FAQS.map((faq, idx) => {
            const isOpen = expanded === idx;
            return (
              <View key={idx} style={styles.faqItem}>
                <TouchableOpacity
                  style={styles.faqHeader}
                  onPress={() => toggleFaq(idx)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.faqQuestion}>{faq.q}</Text>
                  {/* Chevron icon only — no transform on the container */}
                  <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
                {isOpen ? (
                  <View style={styles.faqAnswerWrap}>
                    <Text style={styles.faqAnswer}>{faq.a}</Text>
                  </View>
                ) : null}
                {idx < FAQS.length - 1 ? (
                  <View style={styles.faqDivider} />
                ) : null}
              </View>
            );
          })}

          <View style={styles.contactCard}>
            <View style={styles.contactRow}>
              <Ionicons
                name='mail-outline'
                size={18}
                color={theme.colors.primary}
              />
              <Text style={styles.contactText}>support@wearwise.app</Text>
            </View>
            <View style={styles.contactRow}>
              <Ionicons
                name='globe-outline'
                size={18}
                color={theme.colors.primary}
              />
              <Text style={styles.contactText}>www.wearwise.app</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  // ---- Inline header ----
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  content: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxxl + 40,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  sectionDesc: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.lineHeights.relaxed(theme.typography.sizes.sm),
    marginBottom: theme.spacing.md,
  },
  messageInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  btnIcon: { marginRight: theme.spacing.sm },
  faqItem: {
    paddingVertical: theme.spacing.md,
    overflow: 'visible',
  },
  faqAnswerWrap: {
    overflow: 'visible',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    flex: 1,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
    marginRight: theme.spacing.md,
  },
  faqAnswer: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.lineHeights.relaxed(theme.typography.sizes.sm),
    marginTop: theme.spacing.sm,
  },
  faqDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.divider,
    marginTop: theme.spacing.md,
  },
  contactCard: {
    marginTop: theme.spacing.xxxl,
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  contactText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
    fontWeight: theme.typography.weights.medium,
  },
});
