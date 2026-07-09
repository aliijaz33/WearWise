/**
 * WearWise App Constants
 * Six fixed wardrobe categories, occasions, weather conditions, and style preferences.
 * Per project spec: do NOT change the six wardrobe categories.
 */

export type CategoryId =
  | 'tops'
  | 'bottoms'
  | 'dresses'
  | 'shoes'
  | 'bags'
  | 'accessories';

export interface CategoryDef {
  id: CategoryId;
  label: string;
  /** Icon name from @expo/vector-icons MaterialCommunityIcons */
  icon: string;
  color: string;
  /** Outfit rule placement */
  rule: string;
}

/**
 * Exactly six wardrobe categories (per spec section 5).
 * Order is intentional and matches the spec table.
 */
export const CATEGORIES: CategoryDef[] = [
  {
    id: 'tops',
    label: 'Tops',
    icon: 'tshirt-crew',
    color: '#2D1B69',
    rule: 'Required for a generated outfit unless a Dress is used instead',
  },
  {
    id: 'bottoms',
    label: 'Bottoms',
    icon: 'human-male',
    color: '#007AFF',
    rule: 'Required for a generated outfit unless a Dress is used instead',
  },
  {
    id: 'dresses',
    label: 'Dresses',
    icon: 'hanger',
    color: '#FF6B8A',
    rule: 'May substitute for a Top plus Bottoms combination',
  },
  {
    id: 'shoes',
    label: 'Shoes',
    icon: 'shoe-sneaker',
    color: '#FF9500',
    rule: 'Required for every generated outfit',
  },
  {
    id: 'bags',
    label: 'Bags',
    icon: 'bag-personal',
    color: '#34C759',
    rule: 'Included as an accessory when a compatible tagged item exists',
  },
  {
    id: 'accessories',
    label: 'Accessories',
    icon: 'necklace',
    color: '#6B4C9A',
    rule: 'At least one accessory included when a compatible tagged item exists',
  },
];

export const CATEGORY_MAP: Record<CategoryId, CategoryDef> = CATEGORIES.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<CategoryId, CategoryDef>,
);

export function getCategory(id: string): CategoryDef | undefined {
  return CATEGORY_MAP[id as CategoryId];
}

/** Occasions used for item tagging and outfit generation. */
export const OCCASIONS: string[] = [
  'Party',
  'Casual',
  'Work',
  'Date Night',
  'Wedding',
  'College',
  'Festival',
  'Vacation',
  'Interview',
  'Workout',
  'Brunch',
  'Travel',
  'Formal',
  'Night Out',
  'Others',
];

/** Optional weather conditions for the Outfit Creator. */
export const WEATHER_CONDITIONS: string[] = [
  'Sunny',
  'Cloudy',
  'Rainy',
  'Cold',
  'Hot',
  'Windy',
];

/** Optional style preferences for the Outfit Creator. */
export const STYLE_PREFERENCES: string[] = [
  'Minimalist',
  'Bold',
  'Classic',
  'Trendy',
  'Cozy',
  'Sporty',
  'Elegant',
  'Bohemian',
];

/** Common clothing colors for tagging. */
export const COLOR_OPTIONS: { label: string; hex: string }[] = [
  { label: 'Black', hex: '#1A1A1A' },
  { label: 'White', hex: '#FFFFFF' },
  { label: 'Grey', hex: '#9E9E9E' },
  { label: 'Navy', hex: '#1B2A4A' },
  { label: 'Blue', hex: '#4A90E2' },
  { label: 'Red', hex: '#E5484D' },
  { label: 'Pink', hex: '#E85A9B' },
  { label: 'Purple', hex: '#7C5CE0' },
  { label: 'Green', hex: '#3CC68A' },
  { label: 'Yellow', hex: '#F5C518' },
  { label: 'Orange', hex: '#F5A623' },
  { label: 'Brown', hex: '#8B5E3C' },
  { label: 'Beige', hex: '#D8C4A0' },
  { label: 'Multi', hex: 'linear-gradient' },
];

/** Suggested item types per category (free-text allowed but these are presets). */
export const ITEM_TYPES: Record<CategoryId, string[]> = {
  tops: ['T-Shirt', 'Shirt', 'Blouse', 'Sweater', 'Hoodie', 'Tank Top', 'Polo'],
  bottoms: ['Jeans', 'Trousers', 'Shorts', 'Skirt', 'Leggings', 'Joggers'],
  dresses: [
    'Casual Dress',
    'Maxi Dress',
    'Midi Dress',
    'Cocktail Dress',
    'Gown',
  ],
  shoes: ['Sneakers', 'Boots', 'Heels', 'Flats', 'Sandals', 'Loafers'],
  bags: ['Handbag', 'Backpack', 'Tote', 'Clutch', 'Crossbody', 'Shoulder Bag'],
  accessories: [
    'Watch',
    'Necklace',
    'Earrings',
    'Bracelet',
    'Ring',
    'Sunglasses',
    'Hat',
    'Scarf',
    'Belt',
  ],
};

/** Storage bucket name for wardrobe item photos. */
export const STORAGE_BUCKET = 'item-photos';
