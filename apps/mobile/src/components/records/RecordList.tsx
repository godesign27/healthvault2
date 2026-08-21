import { View, Text, ScrollView } from 'react-native';
import { RecordCard } from '@/components/records/RecordCard';
import { Spinner } from '@/components/ui/Spinner';
import type { HealthRecord } from '@health-vault/types';

type RecordListProps = {
  records: HealthRecord[];
  loading: boolean;
  error: string | null;
};

export function RecordList({ records, loading, error }: RecordListProps) {
  if (loading) {
    return <Spinner />;
  }
  if (error) {
    return (
      <View className="rounded-2xl border border-red-200 bg-red-50 p-4">
        <Text className="text-sm text-red-800">{error}</Text>
      </View>
    );
  }
  if (records.length === 0) {
    return (
      <View className="rounded-2xl border border-dashed border-gray-300 bg-white p-6">
        <Text className="text-center text-sm text-gray-600">No health records yet.</Text>
      </View>
    );
  }
  return (
    <ScrollView className="max-h-[480px]" showsVerticalScrollIndicator={false}>
      {records.map((r) => (
        <RecordCard key={r.id} record={r} />
      ))}
    </ScrollView>
  );
}
