/**
 * ProfileScreen - "My Profile" with avatar upload, stats, and settings menu.
 *
 * Layout (per client spec):
 *  - Root: SafeAreaView + ScrollView on a soft off-white (#F8F9FA) wash
 *  - Header: centered "My Profile" (deep navy bold) + outlined settings cog (top-right)
 *  - Profile card: white rounded card (16px) with soft shadow; horizontal row
 *    with large circular avatar + vertical stack (name, email, purple Edit button)
 *  - "My Stats": 4 uniform tall rectangular cards (white, thin border, 12px
 *    radius) with colored icon + bold number + grey label, vertically centered
 *  - Settings menu: single white rounded container with 5 rows (Measurements,
 *    Preferences, Reminders, Help, Logout) — [icon][label][chevron] layout
 *    with thin grey dividers; Logout follows the same row pattern
 *
 * Avatar uploads use expo-image-picker + base64→ArrayBuffer→Storage pattern,
 * stored under an `avatars/` prefix in the item-photos bucket.
 */

import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button, Input, Loading, useToast } from '@components/ui';
import { useAuth } from '@context/AuthContext';
import { useWardrobe } from '@context/WardrobeContext';
import { useSavedOutfits } from '@context/SavedOutfitsContext';
import { supabase } from '@services/supabase';
import { STORAGE_BUCKET } from '@constants/index';
import { theme } from '@theme/theme';
import type { RootStackParamList } from '@navigation/types';

type Props = NativeStackScreenProps<RootStackParamList>;

type McIconName = keyof typeof MaterialCommunityIcons.glyphMap;
type IonIconName = keyof typeof Ionicons.glyphMap;

interface StatCard {
  key: string;
  label: string;
  value: number;
  icon: McIconName;
  iconColor: string;
  valueColor: string;
  gradient: readonly [string, string];
}

interface MenuRow {
  key: string;
  title: string;
  icon: IonIconName;
  iconColor: string;
  iconBg: string;
  onPress: () => void;
}

const SCREEN_BG = '#F8F9FA';

export function ProfileScreen({ navigation }: Props) {
  const { profile, user, signOut, updateProfile } = useAuth();
  const { items } = useWardrobe();
  const { outfits } = useSavedOutfits();
  const { show: showToast } = useToast();

  const [uploading, setUploading] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState(profile?.full_name ?? '');
  const [savingName, setSavingName] = useState(false);

  const initials = useMemo(() => {
    const name = profile?.full_name?.trim();
    if (!name) return 'U';
    return name
      .split(' ')
      .map((p) => p.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }, [profile?.full_name]);

  const avatarUrl = profile?.profile_picture_url ?? profile?.avatar_url ?? null;
  const displayName = profile?.full_name?.trim() || 'WearWise User';
  const email = user?.email ?? 'No email on file';

  // Distinct occasions tagged across all wardrobe items (for the Occasions stat).
  // Counts the total unique occasions for which the user has saved
  // tops/bottoms/accessories/bags/shoes etc.
  const distinctOccasions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      item.occasions?.forEach((occ) => set.add(occ));
    });
    return set.size;
  }, [items]);

  const stats: StatCard[] = useMemo(
    () => [
      {
        key: 'items',
        label: 'Items',
        value: items.length,
        icon: 'tshirt-crew',
        iconColor: '#5D38F5',
        valueColor: '#5D38F5',
        gradient: ['#FFFFFF', '#F7F5FF'] as const,
      },
      {
        key: 'outfits',
        label: 'Outfits',
        value: outfits.length,
        icon: 'hanger',
        iconColor: '#FF6B6B',
        valueColor: '#FF6B6B',
        gradient: ['#FFFFFF', '#FFF0F0'] as const,
      },
      {
        key: 'favorites',
        label: 'Favorites',
        value: outfits.filter((o) => o.is_favorite).length,
        icon: 'heart-outline',
        iconColor: '#FF6B8A',
        valueColor: '#FF6B8A',
        gradient: ['#FFFFFF', '#FFE8EE'] as const,
      },
      {
        key: 'occasions',
        label: 'Occasions',
        value: distinctOccasions,
        icon: 'calendar-month',
        iconColor: '#007AFF',
        valueColor: '#007AFF',
        gradient: ['#FFFFFF', '#E8F2FF'] as const,
      },
    ],
    [items.length, outfits, distinctOccasions],
  );

  // ---- Avatar upload -------------------------------------------------------

  const uploadAvatar = useCallback(
    async (uri: string): Promise<string | null> => {
      if (!user) return null;
      try {
        const ext = (uri.split('.').pop() || 'jpg').toLowerCase();
        const fileName = `avatars/${user.id}-${Date.now()}.${ext}`;
        const contentType = 'image/jpeg';

        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const arrayBuffer = decode(base64);

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(fileName, arrayBuffer, {
            contentType,
            upsert: true,
            cacheControl: '3600',
          });

        if (uploadError) {
          // eslint-disable-next-line no-console
          console.warn('[WearWise] Avatar upload failed:', uploadError.message);
          return null;
        }

        const { data } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(fileName);
        return data.publicUrl;
      } catch (e: any) {
        // eslint-disable-next-line no-console
        console.warn('[WearWise] Avatar upload exception:', e?.message ?? e);
        return null;
      }
    },
    [user],
  );

  const pickFromLibrary = useCallback(async () => {
    setSheetVisible(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast('Photo access is required to change your avatar', 'error');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      const url = await uploadAvatar(result.assets[0].uri);
      setUploading(false);
      if (url) {
        const ok = await updateProfile({ profile_picture_url: url });
        showToast(
          ok ? 'Profile photo updated' : 'Could not save photo',
          ok ? 'info' : 'error',
        );
      } else {
        showToast('Photo upload failed. Please try again.', 'error');
      }
    }
  }, [uploadAvatar, updateProfile, showToast]);

  const takePhoto = useCallback(async () => {
    setSheetVisible(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showToast('Camera access is required to take a photo', 'error');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      const url = await uploadAvatar(result.assets[0].uri);
      setUploading(false);
      if (url) {
        const ok = await updateProfile({ profile_picture_url: url });
        showToast(
          ok ? 'Profile photo updated' : 'Could not save photo',
          ok ? 'info' : 'error',
        );
      } else {
        showToast('Photo upload failed. Please try again.', 'error');
      }
    }
  }, [uploadAvatar, updateProfile, showToast]);

  const deletePhoto = useCallback(async () => {
    setSheetVisible(false);
    const ok = await updateProfile({
      profile_picture_url: null,
      avatar_url: null,
    });
    showToast(
      ok ? 'Profile photo removed' : 'Could not remove photo',
      ok ? 'info' : 'error',
    );
  }, [updateProfile, showToast]);

  // ---- Edit profile (display name) ----------------------------------------

  const openEdit = useCallback(() => {
    setEditName(profile?.full_name ?? '');
    setEditVisible(true);
  }, [profile?.full_name]);

  const saveName = useCallback(async () => {
    setSavingName(true);
    const ok = await updateProfile({ full_name: editName.trim() || null });
    setSavingName(false);
    if (ok) {
      setEditVisible(false);
      showToast('Profile updated', 'info');
    } else {
      showToast('Could not update profile', 'error');
    }
  }, [editName, updateProfile, showToast]);

  // ---- Settings menu -------------------------------------------------------

  const goSub = useCallback(
    (
      screen:
        | 'MyMeasurements'
        | 'MyPreferences'
        | 'ReminderSettings'
        | 'HelpSupport',
    ) => {
      navigation.getParent()?.navigate(screen);
    },
    [navigation],
  );

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  }, [signOut]);

  const menuRows: MenuRow[] = useMemo(
    () => [
      {
        key: 'measurements',
        title: 'My Measurements',
        icon: 'body-outline',
        iconColor: '#5D38F5',
        iconBg: '#F7F5FF',
        onPress: () => goSub('MyMeasurements'),
      },
      {
        key: 'preferences',
        title: 'My Preferences',
        icon: 'color-palette-outline',
        iconColor: '#5D38F5',
        iconBg: '#F7F5FF',
        onPress: () => goSub('MyPreferences'),
      },
      {
        key: 'reminders',
        title: 'Reminder Settings',
        icon: 'notifications-outline',
        iconColor: '#5D38F5',
        iconBg: '#F7F5FF',
        onPress: () => goSub('ReminderSettings'),
      },
      {
        key: 'help',
        title: 'Help & Support',
        icon: 'help-circle-outline',
        iconColor: '#5D38F5',
        iconBg: '#F7F5FF',
        onPress: () => goSub('HelpSupport'),
      },
      {
        key: 'logout',
        title: 'Logout',
        icon: 'log-out-outline',
        iconColor: '#5D38F5',
        iconBg: '#F7F5FF',
        onPress: handleSignOut,
      },
    ],
    [goSub, handleSignOut],
  );

  // ---- Render --------------------------------------------------------------

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- Header ---- */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity
            style={styles.cogBtn}
            onPress={() => goSub('MyPreferences')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons
              name='settings-outline'
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Uploading indicator sits just below the header while a photo upload is in flight. */}
        {uploading && <Loading label='Uploading…' />}

        {/* ---- Profile card ---- */}
        <LinearGradient
          colors={['#f1eff8', '#f0edf9']}
          style={styles.profileCard}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setSheetVisible(true)}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Ionicons name='camera' size={14} color='#FFFFFF' />
            </View>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.profileEmail} numberOfLines={1}>
              {email}
            </Text>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={openEdit}
              activeOpacity={0.85}
            >
              <Ionicons
                name='create-outline'
                size={16}
                color='#FFFFFF'
                style={styles.editBtnIcon}
              />
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* ---- My Stats ---- */}
        <Text style={styles.sectionTitle}>My Stats</Text>
        <View style={styles.statsRow}>
          {stats.map((s) => (
            <LinearGradient
              key={s.key}
              colors={s.gradient}
              style={styles.statCard}
            >
              <MaterialCommunityIcons
                name={s.icon}
                size={26}
                color={s.iconColor}
              />
              <Text style={[styles.statValue, { color: s.valueColor }]}>
                {s.value}
              </Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </LinearGradient>
          ))}
        </View>

        {/* ---- Settings menu ---- */}
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.menuCard}>
          {menuRows.map((row, idx) => (
            <React.Fragment key={row.key}>
              <TouchableOpacity
                style={styles.menuRow}
                onPress={row.onPress}
                activeOpacity={0.6}
              >
                <View style={styles.menuLeft}>
                  <View
                    style={[styles.menuIcon, { backgroundColor: row.iconBg }]}
                  >
                    <Ionicons name={row.icon} size={20} color={row.iconColor} />
                  </View>
                  <Text style={styles.menuLabel}>{row.title}</Text>
                </View>
                <Ionicons
                  name='chevron-forward'
                  size={20}
                  color={theme.colors.textMuted}
                />
              </TouchableOpacity>
              {idx < menuRows.length - 1 ? (
                <View style={styles.menuDivider} />
              ) : null}
            </React.Fragment>
          ))}
        </View>

        <Text style={styles.versionText}>WearWise v1.0.0</Text>
      </ScrollView>

      {/* ---- Avatar ActionSheet ---- */}
      <Modal visible={sheetVisible} transparent animationType='slide'>
        <Pressable
          style={styles.sheetOverlay}
          onPress={() => setSheetVisible(false)}
        >
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Profile Photo</Text>
            <TouchableOpacity style={styles.sheetItem} onPress={takePhoto}>
              <Ionicons
                name='camera-outline'
                size={22}
                color={theme.colors.primary}
              />
              <Text style={styles.sheetItemText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sheetItem}
              onPress={pickFromLibrary}
            >
              <Ionicons
                name='images-outline'
                size={22}
                color={theme.colors.primary}
              />
              <Text style={styles.sheetItemText}>Choose from Library</Text>
            </TouchableOpacity>
            {avatarUrl ? (
              <TouchableOpacity
                style={[styles.sheetItem, styles.sheetItemDanger]}
                onPress={deletePhoto}
              >
                <Ionicons
                  name='trash-outline'
                  size={22}
                  color={theme.colors.error}
                />
                <Text
                  style={[styles.sheetItemText, { color: theme.colors.error }]}
                >
                  Remove Photo
                </Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.sheetCancel}
              onPress={() => setSheetVisible(false)}
            >
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ---- Edit Profile modal ---- */}
      <Modal visible={editVisible} transparent animationType='fade'>
        <Pressable
          style={styles.editOverlay}
          onPress={() => setEditVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%' }}
          >
            <Pressable
              style={styles.editCard}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={styles.editTitle}>Edit Profile</Text>
              <Input
                label='Display Name'
                placeholder='Enter your name'
                value={editName}
                onChangeText={setEditName}
                returnKeyType='done'
              />
              <View style={styles.editActions}>
                <Button
                  title='Cancel'
                  variant='ghost'
                  onPress={() => setEditVisible(false)}
                  style={styles.editActionBtn}
                  textStyle={styles.editActionTextGhost}
                />
                <Button
                  title='Save Changes'
                  onPress={saveName}
                  loading={savingName}
                  style={styles.editActionBtn}
                  textStyle={styles.editActionTextPrimary}
                />
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xxxl + 80,
  },

  // ---- Header ----
  header: {
    position: 'relative',
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  cogBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },

  // ---- Profile card ----
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    ...theme.shadows.md,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginLeft: theme.spacing.md,
  },
  avatarFallback: {
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: theme.typography.sizes.xxxl,
    fontWeight: theme.typography.weights.bold,
    color: '#FFFFFF',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
    marginLeft: '15%',
  },
  profileName: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  profileEmail: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
    marginBottom: theme.spacing.md,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#5D38F5',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.button,
    ...theme.shadows.button,
  },
  editBtnIcon: {
    marginRight: theme.spacing.xs,
  },
  editBtnText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: '#FFFFFF',
  },

  // ---- My Stats ----
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E5F5',
    paddingVertical: theme.spacing.lg,
    marginHorizontal: theme.spacing.xs / 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
  },
  statValue: {
    fontSize: theme.typography.sizes.xxxl,
    fontWeight: theme.typography.weights.bold,
    marginTop: theme.spacing.sm,
  },
  statLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text,
    fontWeight: theme.typography.weights.semibold,
    marginTop: 2,
  },

  // ---- Settings menu ----
  menuCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    paddingHorizontal: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  menuLabel: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E8E5F5',
  },
  versionText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: theme.spacing.xxl,
  },

  // ---- ActionSheet ----
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xxxl,
    borderTopRightRadius: theme.radius.xxxl,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
    paddingTop: theme.spacing.sm,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.divider,
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
  },
  sheetTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  sheetItemText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
  },
  sheetItemDanger: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.divider,
  },
  sheetCancel: {
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.divider,
  },
  sheetCancelText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: theme.spacing.md,
  },

  // ---- Edit modal ----
  editOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: theme.spacing.xl,
  },
  editCard: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xxl,
    padding: theme.spacing.xl,
  },
  editTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  editActionBtn: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    minHeight: 48,
  },
  editActionTextPrimary: {
    color: '#FFFFFF',
    fontWeight: theme.typography.weights.bold,
    fontSize: theme.typography.sizes.md,
  },
  editActionTextGhost: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
    fontSize: theme.typography.sizes.md,
  },
});
