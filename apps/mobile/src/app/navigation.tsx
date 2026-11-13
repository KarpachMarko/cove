import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { PropsWithChildren } from 'react';
import {
  NavigationContainer,
  DefaultTheme,
  useNavigation,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  BottomTabBar,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { Library, Search } from 'lucide-react-native';
import type { RootStackParams, TabParams } from './navigation-types';
import { LibraryScreen } from '../features/library/library-screen';
import { CollectionScreen } from '../features/library/collection-screen';
import { AlbumScreen } from '../features/library/album-screen';
import { ArtistScreen } from '../features/library/artist-screen';
import { PlaylistScreen } from '../features/playlists/playlist-screen';
import { SearchScreen } from '../features/search/search-screen';
import { SettingsScreen } from '../features/connection/settings-screen';
import { PlayerScreen } from '../features/playback/player-screen';
import { QueueScreen } from '../features/playback/queue-screen';
import { MiniPlayer } from '../features/playback/mini-player';
import { colors } from '../theme/tokens';
const Stack = createNativeStackNavigator<RootStackParams>();
const Tabs = createBottomTabNavigator<TabParams>();
function Footer({ children }: PropsWithChildren) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParams>>();
  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-background">
      {children}
      <MiniPlayer onOpen={() => navigation.navigate('Player')} />
    </SafeAreaView>
  );
}
function HomeTabs() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParams>>();
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.line,
        },
        sceneStyle: { backgroundColor: colors.background },
      }}
      tabBar={(props) => (
        <View className="bg-background">
          <MiniPlayer onOpen={() => navigation.navigate('Player')} />
          <BottomTabBar {...props} />
        </View>
      )}
    >
      <Tabs.Screen
        name="Library"
        component={LibraryScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Library color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
        }}
      />
    </Tabs.Navigator>
  );
}
export function Navigation() {
  return (
    <NavigationContainer
      theme={{
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: colors.primary,
          background: colors.background,
          card: colors.background,
          text: colors.foreground,
          border: colors.line,
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShadowVisible: false,
          headerTintColor: colors.primary,
          contentStyle: { backgroundColor: colors.background },
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Collection"
          options={({ route }) => ({ title: route.params.title })}
        >
          {({ route }) => (
            <Footer>
              <CollectionScreen {...route.params} />
            </Footer>
          )}
        </Stack.Screen>
        <Stack.Screen name="Album" options={{ title: 'Album' }}>
          {({ route }) => (
            <Footer>
              <AlbumScreen id={route.params.id} />
            </Footer>
          )}
        </Stack.Screen>
        <Stack.Screen name="Artist" options={{ title: 'Artist' }}>
          {({ route }) => (
            <Footer>
              <ArtistScreen id={route.params.id} />
            </Footer>
          )}
        </Stack.Screen>
        <Stack.Screen name="Playlist" options={{ title: 'Playlist' }}>
          {({ route }) => (
            <Footer>
              <PlaylistScreen id={route.params.id} />
            </Footer>
          )}
        </Stack.Screen>
        <Stack.Screen name="Connections" options={{ title: 'Connections' }}>
          {() => (
            <Footer>
              <SettingsScreen />
            </Footer>
          )}
        </Stack.Screen>
        <Stack.Screen
          name="Player"
          options={{ title: 'Now playing', presentation: 'modal' }}
        >
          {({ navigation }) => (
            <PlayerScreen onQueue={() => navigation.navigate('Queue')} />
          )}
        </Stack.Screen>
        <Stack.Screen
          name="Queue"
          component={QueueScreen}
          options={{ title: 'Queue' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
