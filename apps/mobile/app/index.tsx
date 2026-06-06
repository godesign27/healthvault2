import { View, Text, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function StartScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a',
      alignItems: 'center', justifyContent: 'center' }}>
      <StatusBar style="light" />
      <Image
        source={require('../assets/icon.png')}
        style={{ width: 80, height: 80, borderRadius: 20,
          marginBottom: 24 }}
      />
      <Text style={{ color: 'white', fontSize: 28,
        fontWeight: '700', letterSpacing: -0.5 }}>
        Health Vault
      </Text>
      <Text style={{ color: '#94a3b8', fontSize: 16,
        marginTop: 8 }}>
        AI Medical Assistant
      </Text>
    </View>
  );
}
