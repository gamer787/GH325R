import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { supabase } from './src/lib/supabase';
import type { Session } from '@supabase/supabase-js'; // Import the Session type
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

const Stack = createStackNavigator();

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
        setLoading(false);
        setSession(null);
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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <NavigationContainer>
      <TopNav />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="FindUsers" component={FindUsers} />
        <Stack.Screen name="Upload" component={Upload} />
        <Stack.Screen name="Notifications" component={Notifications} />
        <Stack.Screen name="BadgeSelection" component={BadgeSelection} />
        <Stack.Screen name="BadgeInfo" component={BadgeInfo} />
        <Stack.Screen name="CreateJob" component={CreateJob} />
        <Stack.Screen name="HubProfile" component={HubProfile} />
        <Stack.Screen name="CreatorFund" component={CreatorFund} />
        <Stack.Screen name="ViewJobs" component={ViewJobs} />
        <Stack.Screen name="JobApplications" component={JobApplications} />
        <Stack.Screen name="JobDetails" component={JobDetails} />
        <Stack.Screen name="CreateSponsored" component={CreateSponsored} />
        <Stack.Screen name="ViewSponsored" component={ViewSponsored} />
        <Stack.Screen name="SponsoredDetails" component={SponsoredDetails} />
        <Stack.Screen name="Applications" component={Applications} />
        <Stack.Screen name="Ads" component={Ads} />
        <Stack.Screen name="Analytics" component={Analytics} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="Hub" component={Hub} />
        <Stack.Screen name="Settings" component={Settings} />
      </Stack.Navigator>
      <Navbar />
    </NavigationContainer>
  );
}

export default App;
