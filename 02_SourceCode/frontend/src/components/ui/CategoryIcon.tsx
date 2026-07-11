// CategoryIcon - renders a wardrobe category icon in its brand color.

import React from 'react';
import { View, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@theme/theme';
import { getCategory, type CategoryId } from '@constants/index';

interface CategoryIconProps {
  category: CategoryId | string;
  size?: number;
  style?: ViewStyle;
  filled?: boolean;
}

export function CategoryIcon({
  category,
  size = 24,
  style,
  filled = false,
}: CategoryIconProps) {
  const def = getCategory(category);
  const color = def?.color ?? theme.colors.primary;
  const icon = (def?.icon ??
    'hanger') as keyof typeof MaterialCommunityIcons.glyphMap;

  return (
    <View
      style={[
        {
          width: size + 16,
          height: size + 16,
          borderRadius: (size + 16) / 2,
          backgroundColor: filled ? color : color + '22',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={size}
        color={filled ? theme.colors.textInverse : color}
      />
    </View>
  );
}
