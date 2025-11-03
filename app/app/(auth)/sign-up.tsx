import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function SignUpScreen() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);

	async function onSignUp() {
		try {
			setLoading(true);
			await createUserWithEmailAndPassword(auth, email.trim(), password);
		} catch (e: any) {
			Alert.alert('Sign up failed', e?.message ?? 'Unknown error');
		} finally {
			setLoading(false);
		}
	}

	return (
		<View className="flex-1 items-center justify-center bg-white px-6 gap-4">
			<Text className="text-2xl font-bold">Sign Up</Text>
			<TextInput
				className="w-full border rounded p-3"
				placeholder="Email"
				keyboardType="email-address"
				autoCapitalize="none"
				value={email}
				onChangeText={setEmail}
			/>
			<TextInput
				className="w-full border rounded p-3"
				placeholder="Password"
				secureTextEntry
				value={password}
				onChangeText={setPassword}
			/>
			<TouchableOpacity
				disabled={loading}
				onPress={onSignUp}
				className="w-full bg-black rounded p-3"
			>
				<Text className="text-white text-center font-semibold">{loading ? 'Creating…' : 'Create Account'}</Text>
			</TouchableOpacity>
			<Link href="/(auth)/sign-in" className="text-blue-600">Have an account? Sign in</Link>
		</View>
	);
}

