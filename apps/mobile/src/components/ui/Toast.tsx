import { Text, View } from 'react-native';

type ToastProps = {
  message: string;
  variant?: 'info' | 'error';
};

export function Toast({ message, variant = 'info' }: ToastProps) {
  const bg = variant === 'error' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200';
  const text = variant === 'error' ? 'text-red-800' : 'text-blue-900';
  return (
    <View className={`rounded-xl border px-4 py-3 ${bg}`}>
      <Text className={`text-sm ${text}`}>{message}</Text>
    </View>
  );
}
