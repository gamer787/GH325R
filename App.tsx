import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, SafeAreaView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { supabase } from './src/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { Auth } from './src/components/auth';
import { Navbar } from './src/components/Navbar';
import { TopNav } from './src/components/TopNav';
import HubProfile from './src/pages/HubProfile';
import CreatorFund from './src/pages/CreatorFund';
import UserApplications from './src/pages/jobs/UserApplications';
import CreateSponsored from './src/pages/sponsored/Create';
import ViewSponsored from './src/pages/sponsored/View';
import SponsoredDetails from './src/pages/sponsored/Details';
import Applications from './src/pages/sponsored/Applications';
import Home from './src/pages/Home';
import FindUsers from './src/pages/FindUsers';
import Upload from './src/pages/Upload';
import Notifications from './src/pages/Notifications';
import BadgeSelection from './src/pages/BadgeSelection';
import BadgeInfo from './src/pages/BadgeInfo';
import CreateJob from './src/pages/jobs/CreateJob';
import JobInfo from './src/pages/jobs/JobInfo';
import ViewJobs from './src/pages/jobs/ViewJobs';
import JobDetails from './src/pages/jobs/JobDetails';
import JobApplications from './src/pages/jobs/JobApplications';
import Ads from './src/pages/Ads';
import Analytics from './src/pages/Analytics';
import Profile from './src/pages/Profile';
import Hub from './src/pages/Hub';
import Settings from './src/pages/Settings';

// Define a nested stack for your main screens
const MainStack = createStackNavigator();

function MainStackScreen() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="Home" component={Home} />
      <MainStack.Screen name="FindUsers" component={FindUsers} />
      <MainStack.Screen name="Upload" component={Upload} />
      <MainStack.Screen name="Notifications" component={Notifications} />
      <MainStack.Screen name="BadgeSelection" component={BadgeSelection} />
      <MainStack.Screen name="BadgeInfo" component={BadgeInfo} />
      <MainStack.Screen name="CreateJob" component={CreateJob} />
      <MainStack.Screen name="HubProfile" component={HubProfile} />
      <MainStack.Screen name="CreatorFund" component={CreatorFund} />
      <MainStack.Screen name="ViewJobs" component={ViewJobs} />
      <MainStack.Screen name="JobApplications" component={JobApplications} />
      <MainStack.Screen name="JobDetails" component={JobDetails} />
      <MainStack.Screen name="CreateSponsored" component={CreateSponsored} />
      <MainStack.Screen name="ViewSponsored" component={ViewSponsored} />
      <MainStack.Screen name="SponsoredDetails" component={SponsoredDetails} />
      <MainStack.Screen name="Applications" component={Applications} />
      <MainStack.Screen name="Ads" component={Ads} />
      <MainStack.Screen name="Analytics" component={Analytics} />
      <MainStack.Screen name="Profile" component={Profile} />
      <MainStack.Screen name="Hub" component={Hub} />
      <MainStack.Screen name="Settings" component={Settings} />
    </MainStack.Navigator>
  );
}

// Create a layout component that renders the TopNav, MainStack, and Navbar
function MainLayout() {
  return (
    <SafeAreaView style={styles.container}>
      <TopNav />
      <View style={styles.mainContent}>
        <MainStackScreen />
      </View>
      <Navbar />
    </SafeAreaView>
  );
}

// Create a RootStack so that MainLayout is rendered as a single screen with full navigation context
const RootStack = createStackNavigator();

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }: { data: { session: Session | null } }) => {
        setSession(session);
        setLoading(false);
      })
      .catch((err: any) => {
        console.error('Error getting session:', err);
        setSession(null);
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: string, session: Session | null) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#06B6D4" />
      </View>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="MainLayout" component={MainLayout} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  mainContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App;
