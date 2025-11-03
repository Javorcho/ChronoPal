import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function DayScreen() {
	const { date } = useLocalSearchParams<{ date: string }>();
	return (
		<View className="flex-1 items-center justify-center bg-white">
			<Text className="text-xl font-bold">Day {String(date)}</Text>
		</View>
	);
}

