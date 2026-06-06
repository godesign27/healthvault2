import { Pressable, Text } from 'react-native';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'solid' | 'outline';
  disabled?: boolean;
  loading?: boolean;
};

export function Button({
  label,
  onPress,
  variant = 'solid',
  disabled = false,
  loading = false,
}: ButtonProps) {
  const base =
    'items-center justify-center rounded-xl px-4 py-3.5';
  const solid = 'bg-vault-navy';
  const outline = 'border border-gray-300 bg-transparent';
  const textSolid = 'text-base font-semibold text-white';
  const textOutline = 'text-base font-semibold text-gray-900';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      className={`${base} ${variant === 'solid' ? solid : outline} ${disabled ? 'opacity-50' : ''}`}
    >
      <Text className={variant === 'solid' ? textSolid : textOutline}>{loading ? 'Please wait…' : label}</Text>
    </Pressable>
  );
}
