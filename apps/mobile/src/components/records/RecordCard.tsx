import type { HealthRecord } from '@health-vault/types';
import { View, Text } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';

type RecordCardProps = {
  record: HealthRecord;
};

export function RecordCard({ record }: RecordCardProps) {
  return (
    <Card>
      <Text className="mb-1 text-base font-semibold text-gray-900">{record.title}</Text>
      <View className="mb-2 flex-row flex-wrap gap-2">
        <Tag label={record.kind.replace(/_/g, ' ')} />
        <Tag label={record.source} />
      </View>
      {record.providerName ? (
        <Text className="text-sm text-gray-600">{record.providerName}</Text>
      ) : null}
    </Card>
  );
}
