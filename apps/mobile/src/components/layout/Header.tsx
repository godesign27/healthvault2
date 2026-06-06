import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type HeaderProps = {
  title?: string;
  initials?: string;
};

export function Header({ title = 'Health Vault', initials = 'HV' }: HeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const canGoBack = router.canGoBack();

  return (
    <View
      className="border-b border-gray-200 bg-white px-4 pb-3"
      style={{ paddingTop: insets.top + 8 }}
    >
      <View className="flex-row items-center justify-between">
        <View className="w-10 items-start">
          {canGoBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={8}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={24} color="#111827" />
            </Pressable>
          ) : null}
        </View>

        <View className="flex-1 flex-row items-center justify-center gap-2">
          <Ionicons name="locate" size={18} color="#0d9488" />
          <Text className="text-base font-semibold text-gray-900">{title}</Text>
        </View>

        <View className="w-24 flex-row items-center justify-end gap-2">
          <Ionicons name="card-outline" size={22} color="#374151" />
          <View className="h-9 w-9 items-center justify-center rounded-full bg-red-900">
            <Text className="text-xs font-bold text-white">{initials}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
