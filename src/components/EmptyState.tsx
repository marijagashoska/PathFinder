import { StyleSheet, Text, View } from 'react-native';

type Props = {
  title: string;
  message: string;
};

export default function EmptyState({ title, message }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    color: '#cbd5e1',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});