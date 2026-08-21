import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

function tabMeta(routeName: string): { label: string; icon: keyof typeof Ionicons.glyphMap; iconOutline: keyof typeof Ionicons.glyphMap } {
  switch (routeName) {
    case 'index':
      return { label: 'Dashboard', icon: 'home', iconOutline: 'home-outline' };
    case 'care':
      return { label: 'Care', icon: 'heart', iconOutline: 'heart-outline' };
    case 'network':
      return { label: 'Network', icon: 'people', iconOutline: 'people-outline' };
    case 'records':
      return { label: 'Records', icon: 'document-text', iconOutline: 'document-text-outline' };
    case 'medical':
      return { label: 'Medical', icon: 'clipboard', iconOutline: 'clipboard-outline' };
    default:
      return { label: routeName, icon: 'ellipse', iconOutline: 'ellipse-outline' };
  }
}

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = insets.bottom > 0 ? insets.bottom : 12;

  return (
    <View
      className="border-t border-gray-200 bg-white"
      style={{ paddingBottom: bottomPad, minHeight: 49 + bottomPad }}
    >
      <View className="h-[49px] flex-row items-stretch justify-around px-1">
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const meta = tabMeta(route.name);
          const iconName = focused ? meta.icon : meta.iconOutline;
          const color = focused ? '#111827' : '#6b7280';

          const { options } = descriptors[route.key];
          const rawTitle = options.title;
          const titleText = typeof rawTitle === 'string' ? rawTitle : meta.label;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={titleText}
              onPress={onPress}
              className="min-w-[56px] flex-1 items-center justify-center py-1"
            >
              <View
                className={`mb-1 items-center justify-center rounded-full px-3 py-1.5 ${
                  focused ? 'bg-gray-900' : 'bg-transparent'
                }`}
              >
                <Ionicons name={iconName} size={22} color={focused ? '#ffffff' : color} />
              </View>
              <Text
                className={`text-[11px] ${focused ? 'font-bold text-gray-900' : 'font-medium text-gray-500'}`}
              >
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
