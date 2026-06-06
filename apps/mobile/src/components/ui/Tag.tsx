import { Text } from 'react-native';

type TagProps = {
  label: string;
};

export function Tag({ label }: TagProps) {
  return (
    <Text className="self-start rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-gray-700">
      {label}
    </Text>
  );
}
