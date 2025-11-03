import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function SignInScreen() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);

	async function onSignIn() {
		try {
			setLoading(true);
			await signInWithEmailAndPassword(auth, email.trim(), password);
		} catch (e: any) {
			Alert.alert('Sign in failed', e?.message ?? 'Unknown error');
		} finally {
			setLoading(false);
		}
	}

	return (
		<View className="flex-1 items-center justify-center bg-white px-6 gap-4">
			<Text className="text-2xl font-bold">Sign In</Text>
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
				onPress={onSignIn}
				className="w-full bg-black rounded p-3"
			>
				<Text className="text-white text-center font-semibold">{loading ? 'Signing in…' : 'Sign In'}</Text>
			</TouchableOpacity>
			<Link href="/(auth)/sign-up" className="text-blue-600">Create account</Link>
		</View>
	);
}

