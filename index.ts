import 'react-native-gesture-handler';
// Import order matters: background handlers must be registered before the
// expo-router entry evaluates, or quit-state pushes are dropped.
import './src/notifications/registerBackgroundHandlers';
import 'expo-router/entry';
