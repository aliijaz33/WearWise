/**
 * AddItemScreen - modal for adding (or editing) a wardrobe item.
 * Photo upload via expo-image-picker, then tag category, type, color,
 * occasions, season, and notes.
 */

import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen, Header, Button, Input, Loading } from '@components/ui';
import { CategoryIcon } from '@components/ui';
import { useAuth } from '@context/AuthContext';
import { useWardrobe } from '@context/WardrobeContext';
import { useToast } from '@components/ui';
import { wardrobeService } from '@services/wardrobeService';
import {
  CATEGORIES,
  OCCASIONS,
  COLOR_OPTIONS,
  ITEM_TYPES,
  type CategoryId,
} from '@constants/index';
import { theme } from '@theme/theme';
import type { RootStackParamList } from '@navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddItem'>;

const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter', 'All Seasons'];

export function AddItemScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const { addItem, updateItem, getById } = useWardrobe();
  const { show: showToast } = useToast();

  const editingId = route.params?.itemId;
  const existing = editingId ? getById(editingId) : undefined;
  const isEditing = !!existing;

  const [imageUri, setImageUri] = useState<string | null>(
    existing?.image_url ?? null,
  );
  const [imageChanged, setImageChanged] = useState(false);
  const [category, setCategory] = useState<CategoryId | null>(
    existing?.category ?? null,
  );
  const [type, setType] = useState(existing?.type ?? '');
  const [color, setColor] = useState(existing?.color ?? '');
  const [colorHex, setColorHex] = useState<string | null>(
    existing?.color_hex ?? null,
  );
  const [occasions, setOccasions] = useState<string[]>(
    existing?.occasions ?? [],
  );
  const [season, setSeason] = useState<string | null>(existing?.season ?? null);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [saving, setSaving] = useState(false);
  // Shows a tick in the save button after a successful add. Cleared when
  // the user picks a new image (so the button resets for the next item).
  const [savedTick, setSavedTick] = useState(false);
  // Hides the tick again after a short delay so the button returns to its
  // normal "Add to Wardrobe" label.
  const tickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear the tick timer on unmount.
  useEffect(() => {
    return () => {
      if (tickTimer.current) clearTimeout(tickTimer.current);
    };
  }, []);

  const suggestedTypes = useMemo(() => {
    if (!category) return [];
    return ITEM_TYPES[category] ?? [];
  }, [category]);

  const pickImage = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast('Photo access is required to add items', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageChanged(true);
      // Selecting a new image resets the success tick.
      setSavedTick(false);
      if (tickTimer.current) {
        clearTimeout(tickTimer.current);
        tickTimer.current = null;
      }
    }
  }, [showToast]);

  const takePhoto = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showToast('Camera access is required to take photos', 'error');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageChanged(true);
      // Selecting a new image resets the success tick.
      setSavedTick(false);
      if (tickTimer.current) {
        clearTimeout(tickTimer.current);
        tickTimer.current = null;
      }
    }
  }, [showToast]);

  const toggleOccasion = useCallback((occ: string) => {
    setOccasions((prev) =>
      prev.includes(occ) ? prev.filter((o) => o !== occ) : [...prev, occ],
    );
  }, []);

  const selectColor = useCallback((label: string, hex: string) => {
    setColor(label);
    setColorHex(hex === 'linear-gradient' ? null : hex);
  }, []);

  const validate = useCallback((): string | null => {
    if (!imageUri) return 'Please add a photo';
    if (!category) return 'Please select a category';
    if (!type.trim()) return 'Please enter the item type';
    if (!color.trim()) return 'Please select a color';
    if (occasions.length === 0) return 'Please tag at least one occasion';
    return null;
  }, [imageUri, category, type, color, occasions]);

  const handleSave = useCallback(async () => {
    const error = validate();
    if (error) {
      showToast(error, 'error');
      return;
    }
    if (!user) return;

    setSaving(true);

    try {
      let imageUrl = existing?.image_url ?? '';

      // Upload photo if new/changed.
      if (imageUri && (imageChanged || !imageUrl)) {
        const { url, error: uploadError } = await wardrobeService.uploadPhoto(
          user.id,
          imageUri,
          'image/jpeg',
        );
        if (uploadError || !url) {
          showToast('Failed to upload photo. Please try again.', 'error');
          setSaving(false);
          return;
        }
        imageUrl = url;
      }

      const input = {
        image_url: imageUrl,
        category: category!,
        type: type.trim(),
        color: color.trim(),
        color_hex: colorHex,
        occasions,
        season,
        notes: notes.trim() || null,
      };

      if (isEditing && editingId) {
        const ok = await updateItem(editingId, input);
        if (ok) {
          showToast('Item updated successfully', 'success');
          navigation.goBack();
        } else {
          // Keep the entered data so the user can retry without retyping.
          showToast('Failed to update item', 'error');
        }
      } else {
        const created = await addItem(input);
        if (created) {
          // Success: show a tick in the button, then clear all fields and
          // the selected image so the user can add the next item. The tick
          // is automatically removed after a short delay, and is also
          // removed as soon as the user picks a new image.
          setSavedTick(true);
          showToast('Item added to your wardrobe', 'success');
          if (tickTimer.current) clearTimeout(tickTimer.current);
          tickTimer.current = setTimeout(() => {
            setSavedTick(false);
            tickTimer.current = null;
          }, 2500);

          // Reset the form for the next item.
          setImageUri(null);
          setImageChanged(false);
          setCategory(null);
          setType('');
          setColor('');
          setColorHex(null);
          setOccasions([]);
          setSeason(null);
          setNotes('');
        } else {
          // Failure: keep all entered data so the user can retry.
          showToast('Failed to add item', 'error');
        }
      }
    } catch (e) {
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  }, [
    validate,
    user,
    imageUri,
    imageChanged,
    existing,
    category,
    type,
    color,
    colorHex,
    occasions,
    season,
    notes,
    isEditing,
    editingId,
    addItem,
    updateItem,
    navigation,
    showToast,
  ]);

  if (saving) {
    return (
      <Screen scroll={false}>
        <Header
          title={isEditing ? 'Edit Item' : 'Add Item'}
          onBack={() => navigation.goBack()}
        />
        <Loading
          label={isEditing ? 'Updating item…' : 'Saving item…'}
          fullscreen
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <Header
        title={isEditing ? 'Edit Item' : 'Add Item'}
        onBack={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps='handled'
        >
          {/* Photo picker */}
          <Text style={styles.label}>Photo</Text>
          {imageUri ? (
            <View style={styles.photoWrap}>
              <Image source={{ uri: imageUri }} style={styles.photo} />
              <TouchableOpacity
                style={styles.photoChangeBtn}
                onPress={pickImage}
              >
                <Ionicons
                  name='swap-horizontal'
                  size={18}
                  color={theme.colors.textInverse}
                />
                <Text style={styles.photoChangeText}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoPickerRow}>
              <TouchableOpacity
                style={styles.photoPickerBtn}
                onPress={pickImage}
                activeOpacity={0.7}
              >
                <Ionicons
                  name='images-outline'
                  size={28}
                  color={theme.colors.primary}
                />
                <Text style={styles.photoPickerText}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.photoPickerBtn}
                onPress={takePhoto}
                activeOpacity={0.7}
              >
                <Ionicons
                  name='camera-outline'
                  size={28}
                  color={theme.colors.primary}
                />
                <Text style={styles.photoPickerText}>Camera</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Category */}
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => {
              const selected = category === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setCategory(cat.id)}
                  activeOpacity={0.7}
                  style={[
                    styles.categoryBtn,
                    selected && {
                      backgroundColor: cat.color + '22',
                      borderColor: cat.color,
                    },
                  ]}
                >
                  <CategoryIcon category={cat.id} size={20} filled={selected} />
                  <Text
                    style={[
                      styles.categoryBtnText,
                      selected && {
                        color: cat.color,
                        fontWeight: theme.typography.weights.semibold,
                      },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Type */}
          <Text style={styles.label}>Item Type</Text>
          <Input
            value={type}
            onChangeText={setType}
            placeholder='e.g. T-Shirt, Jeans, Sneakers'
          />
          {suggestedTypes.length > 0 ? (
            <View style={styles.suggestionsRow}>
              {suggestedTypes.map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setType(t)}
                  style={[
                    styles.suggestionChip,
                    type === t && {
                      backgroundColor: theme.colors.primarySoft,
                      borderColor: theme.colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.suggestionText,
                      type === t && { color: theme.colors.primaryDark },
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {/* Color */}
          <Text style={styles.label}>Color</Text>
          <View style={styles.colorRow}>
            {COLOR_OPTIONS.map((c) => {
              const selected = color === c.label;
              return (
                <TouchableOpacity
                  key={c.label}
                  onPress={() => selectColor(c.label, c.hex)}
                  style={[
                    styles.colorDot,
                    {
                      backgroundColor:
                        c.hex === 'linear-gradient'
                          ? theme.colors.accent
                          : c.hex,
                      borderColor:
                        c.hex.toLowerCase() === '#ffffff'
                          ? theme.colors.border
                          : 'transparent',
                    },
                    selected && styles.colorDotSelected,
                  ]}
                >
                  {selected ? (
                    <Ionicons
                      name='checkmark'
                      size={16}
                      color={
                        c.hex.toLowerCase() === '#ffffff'
                          ? theme.colors.text
                          : theme.colors.textInverse
                      }
                    />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
          {color ? <Text style={styles.colorLabel}>{color}</Text> : null}

          {/* Occasions */}
          <Text style={styles.label}>
            Occasions <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.chipsRow}>
            {OCCASIONS.map((occ) => (
              <TouchableOpacity
                key={occ}
                onPress={() => toggleOccasion(occ)}
                activeOpacity={0.7}
                style={[
                  styles.chip,
                  occasions.includes(occ) && {
                    backgroundColor: theme.colors.primary,
                    borderColor: theme.colors.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    occasions.includes(occ) && {
                      color: theme.colors.textInverse,
                    },
                  ]}
                >
                  {occ}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Season */}
          <Text style={styles.label}>Season (optional)</Text>
          <View style={styles.chipsRow}>
            {SEASONS.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setSeason(season === s ? null : s)}
                activeOpacity={0.7}
                style={[
                  styles.chip,
                  season === s && {
                    backgroundColor: theme.colors.primarySoft,
                    borderColor: theme.colors.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    season === s && { color: theme.colors.primaryDark },
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Notes */}
          <Text style={styles.label}>Notes (optional)</Text>
          <Input
            value={notes}
            onChangeText={setNotes}
            placeholder='Any details about this item…'
            multiline
            numberOfLines={3}
            style={styles.notesInput}
          />

          <View style={{ height: theme.spacing.lg }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Button
          title={
            savedTick && !isEditing
              ? 'Added!'
              : isEditing
                ? 'Update Item'
                : 'Add to Wardrobe'
          }
          onPress={handleSave}
          fullWidth
          loading={saving}
          icon={
            <Ionicons
              name={savedTick && !isEditing ? 'checkmark-circle' : 'add-circle'}
              size={20}
              color={theme.colors.textInverse}
              style={{ marginRight: 8 }}
            />
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  label: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  required: {
    color: theme.colors.error,
  },
  photoWrap: {
    position: 'relative',
    width: '100%',
    height: 240,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceAlt,
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoChangeBtn: {
    position: 'absolute',
    bottom: theme.spacing.md,
    right: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(94, 63, 184, 0.85)',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
  },
  photoChangeText: {
    color: theme.colors.textInverse,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    marginLeft: 4,
  },
  photoPickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  photoPickerBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    borderRadius: theme.radius.lg,
    marginHorizontal: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
  },
  photoPickerText: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.medium,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  categoryBtnText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.sm,
  },
  suggestionChip: {
    paddingVertical: theme.spacing.xs + 1,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
  },
  suggestionText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: theme.colors.primary,
    transform: [{ scale: 1.1 }],
  },
  colorLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  chipText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
});
