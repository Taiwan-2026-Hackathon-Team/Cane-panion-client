import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { toErrorMessage } from '@/src/api/fetch';
import { useLoginMutation } from '@/src/auth/authMutations';

export default function LoginScreen() {
  const loginMutation = useLoginMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const error = loginMutation.isError
    ? toErrorMessage(loginMutation.error, 'Login failed. Please try again.')
    : null;

  function onSubmit() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      return;
    }
    loginMutation.mutate({ email: trimmedEmail, password });
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-1 justify-center gap-6 px-6">
        <View className="gap-2">
          <Text variant="h3" className="text-left">
            Canepanion
          </Text>
          <Text variant="muted">Sign in to view fall alerts and live map.</Text>
        </View>

        <View className="gap-4">
          <View className="gap-2">
            <Label nativeID="email">Email</Label>
            <Input
              aria-labelledby="email"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              editable={!loginMutation.isPending}
            />
          </View>

          <View className="gap-2">
            <Label nativeID="password">Password</Label>
            <Input
              aria-labelledby="password"
              autoCapitalize="none"
              autoComplete="password"
              secureTextEntry
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              editable={!loginMutation.isPending}
              onSubmitEditing={onSubmit}
            />
          </View>

          {error ? (
            <Text className="text-destructive text-sm">{error}</Text>
          ) : null}

          <Button
            disabled={loginMutation.isPending || !email.trim() || !password}
            onPress={onSubmit}
          >
            <Text>{loginMutation.isPending ? 'Signing in…' : 'Sign in'}</Text>
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
