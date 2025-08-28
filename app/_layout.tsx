import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from './constants/Colors';
import { ThemeProvider, useTheme } from './context/ThemeContext';

function RootLayoutContent() {
  const { theme, isDark } = useTheme();
  const colors = Colors[theme];

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.headerBackground,
          },
          headerTintColor: colors.headerText,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerShadowVisible: false,
          animation: 'slide_from_right',
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}>
        <Stack.Screen
          name='index'
          options={{
            title: 'Accueil',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name='sessions'
          options={{
            title: 'Sessions d&apos;entraînement',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name='athletes'
          options={{
            title: 'Mes athlètes',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name='statistics'
          options={{
            title: 'Statistiques',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name='settings'
          options={{
            title: 'Paramètres',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name='profile'
          options={{
            title: 'Profil',
            headerShown: true,
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}
