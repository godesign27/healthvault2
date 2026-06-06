import { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const QUICK_PROMPTS = [
  'Summarize my latest lab results',
  "What's my next appointment?",
  'Log my blood pressure',
  'Explain my new prescription',
] as const;

type AssistantSheetProps = {
  visible: boolean;
  onClose: () => void;
  context: string;
};

const SHEET_HEIGHT = Math.min(Dimensions.get('window').height * 0.78, 640);

export function AssistantSheet({ visible, onClose, context }: AssistantSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SHEET_HEIGHT);

  useEffect(() => {
    translateY.value = withTiming(visible ? 0 : SHEET_HEIGHT, { duration: 320 });
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 justify-end">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss assistant"
            onPress={onClose}
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}
          />
          <Animated.View
            style={[
              sheetStyle,
              {
                height: SHEET_HEIGHT,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            <View className="flex-1 rounded-t-3xl bg-white px-5 pt-3">
              <View className="mb-4 items-center">
                <View className="mb-6 h-1.5 w-12 rounded-full bg-gray-300" />
              </View>

              <View className="mb-4 flex-row items-start justify-between">
                <View className="flex-1 flex-row items-center gap-3 pr-4">
                  <View className="h-12 w-12 items-center justify-center rounded-full bg-teal-100">
                    <Ionicons name="sparkles" size={22} color="#0d9488" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-900">Vault Assistant</Text>
                    <Text className="text-sm text-gray-500">Context: {context}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Close assistant"
                  onPress={onClose}
                  className="h-10 w-10 items-center justify-center rounded-full border border-gray-300"
                >
                  <Ionicons name="close" size={22} color="#374151" />
                </TouchableOpacity>
              </View>

              <View className="mb-6 items-center px-2">
                <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                  <Ionicons name="medkit-outline" size={36} color="#0d9488" />
                </View>
                <Text className="mb-2 text-center text-xl font-bold text-gray-900">
                  Ask anything about your health
                </Text>
                <Text className="text-center text-sm leading-5 text-gray-600">
                  Get summaries, reminders, and plain-language explanations. Responses are informational only.
                </Text>
              </View>

              <Text className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">
                Suggestions
              </Text>
              <View className="mb-6 gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <TouchableOpacity
                    key={prompt}
                    className="rounded-xl border border-gray-300 bg-white px-4 py-3.5"
                    activeOpacity={0.85}
                  >
                    <Text className="text-sm font-medium text-gray-900">{prompt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View className="mt-auto flex-row items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2">
                <Ionicons name="mic-outline" size={22} color="#374151" />
                <TextInput
                  className="min-h-[40px] flex-1 text-base text-gray-900"
                  placeholder="Message Vault Assistant…"
                  placeholderTextColor="#9ca3af"
                  multiline
                />
                <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-full bg-brand-500">
                  <Ionicons name="send" size={18} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <Text className="mt-3 text-center text-[11px] leading-4 text-gray-500">
                AI may be inaccurate — verify medical decisions with your provider.
              </Text>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
