import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function SignInScreen() {
    const router = useRouter();
    const { signIn } = useAuth();
    const { resolvedTheme } = useTheme();
    const colors = Colors[resolvedTheme];
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleSignIn = async () => {
        if (!email.trim() || !password.trim()) {
            setError('Please enter both email and password');
            return;
        }

        setLoading(true);
        setError(null);

        const { error: signInError } = await signIn(email.trim(), password);

        setLoading(false);

        if (signInError) {
            setError(signInError.message);
        } else {
            router.replace('/');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.select({ ios: 'padding', android: 'height' })}
            style={styles.container}
        >
            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <MaterialIcons name="track-changes" size={48} color={colors.accent} />
                    </View>
                    <Text style={styles.title}>OnTrack</Text>
                    <Text style={styles.subtitle}>Sign in to continue</Text>
                </View>

                <View style={styles.form}>
                    {error && (
                        <View style={styles.errorContainer}>
                            <MaterialIcons name="error-outline" size={16} color={colors.danger} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    <View style={styles.inputContainer}>
                        <MaterialIcons name="email" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor={colors.textSecondary}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            autoComplete="email"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <MaterialIcons name="lock" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor={colors.textSecondary}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            autoComplete="password"
                        />
                        <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                            <MaterialIcons
                                name={showPassword ? 'visibility' : 'visibility-off'}
                                size={20}
                                color={colors.textSecondary}
                            />
                        </Pressable>
                    </View>

                    <Pressable
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleSignIn}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={colors.buttonText} />
                        ) : (
                            <Text style={styles.buttonText}>Sign In</Text>
                        )}
                    </Pressable>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>{"Don't have an account? "}</Text>
                    <Link href="/(auth)/sign-up" asChild>
                        <Pressable>
                            <Text style={styles.footerLink}>Sign Up</Text>
                        </Pressable>
                    </Link>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const createStyles = (colors: (typeof Colors)[keyof typeof Colors]) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        content: {
            flex: 1,
            justifyContent: 'center',
            paddingHorizontal: 24,
            paddingBottom: 40,
        },
        header: {
            alignItems: 'center',
            marginBottom: 48,
        },
        logoContainer: {
            width: 80,
            height: 80,
            borderRadius: 24,
            backgroundColor: colors.card,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.navBorder,
        },
        title: {
            fontSize: 32,
            fontWeight: '800',
            color: colors.text,
            letterSpacing: -0.5,
        },
        subtitle: {
            fontSize: 16,
            color: colors.textSecondary,
            marginTop: 8,
        },
        form: {
            gap: 16,
        },
        errorContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: colors.accentMuted,
            padding: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.navBorder,
        },
        errorText: {
            color: colors.danger,
            fontSize: 14,
            flex: 1,
        },
        inputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.inputBackground,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.navBorder,
            paddingHorizontal: 16,
        },
        inputIcon: {
            marginRight: 12,
        },
        input: {
            flex: 1,
            height: 56,
            fontSize: 16,
            color: colors.inputText,
        },
        eyeIcon: {
            padding: 8,
        },
        button: {
            height: 56,
            backgroundColor: colors.foodLogBtnBg,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 8,
        },
        buttonDisabled: {
            opacity: 0.7,
        },
        buttonText: {
            fontSize: 16,
            fontWeight: '700',
            color: colors.foodLogBtnText,
        },
        footer: {
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: 32,
        },
        footerText: {
            fontSize: 14,
            color: colors.textSecondary,
        },
        footerLink: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.accent,
        },
    });
