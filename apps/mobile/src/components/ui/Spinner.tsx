import { ActivityIndicator, View } from 'react-native';

type SpinnerProps = {
  size?: 'small' | 'large';
};

export function Spinner({ size = 'large' }: SpinnerProps) {
  return (
    <View className="items-center justify-center p-4">
      <ActivityIndicator size={size} />
    </View>
  );
}
