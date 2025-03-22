import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronLeft,
  Eye,
  Users,
  Heart,
  MessageCircle,
  TrendingUp,
  Calendar,
  MapPin,
  Clock,
  Filter,
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import {
  VictoryChart,
  VictoryArea,
  VictoryAxis,
  VictoryTooltip,
  VictoryBar,
  VictoryPie,
  VictoryLine,
} from 'victory-native';

interface AnalyticsData {
  views: {
    total: number;
    vibes: number;
    bangers: number;
    trend: { date: string; count: number }[];
  };
  network: {
    total: number;
    newLast7Days: number;
    newLast30Days: number;
    acceptanceRate: number;
    active: number;
    inactive: number;
  };
  engagement: {
    profileVisits: number;
    interactionRate: number;
    comments: number;
    likes: number;
    shares: number;
  };
  reach: {
    direct: number;
    extended: number;
    locations: { location: string; count: number }[];
    peakTimes: { hour: number; count: number }[];
  };
  content: {
    topPosts: {
      id: string;
      type: string;
      views: number;
      likes: number;
      comments: number;
      created_at: string;
    }[];
    engagementByType: {
      type: string;
      rate: number;
    }[];
    bestDays: { day: string; engagement: number }[];
    retention: { duration: string; rate: number }[];
  };
}

export default function Analytics() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const endDate = endOfDay(new Date());
      const startDate = startOfDay(
        subDays(endDate, dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90)
      );

      const [
        { data: viewsData },
        { data: networkData },
        { data: engagementData },
        { data: reachData },
        { data: contentData },
      ] = await Promise.all([
        supabase.rpc('get_views_analytics', {
          user_id: user.id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        }),
        supabase.rpc('get_network_analytics', {
          user_id: user.id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        }),
        supabase.rpc('get_engagement_analytics', {
          user_id: user.id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        }),
        supabase.rpc('get_reach_analytics', {
          user_id: user.id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        }),
        supabase.rpc('get_content_analytics', {
          user_id: user.id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        }),
      ]);

      setData({
        views: viewsData,
        network: networkData,
        engagement: engagementData,
        reach: reachData,
        content: contentData,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#06B6D4" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!data) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header & Date Range */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Analytics</Text>
          <Text style={styles.headerSubtitle}>Track your social engagement</Text>
        </View>
        <View style={styles.dateRangeContainer}>
          {(['7d', '30d', '90d'] as const).map((range) => (
            <TouchableOpacity
              key={range}
              onPress={() => setDateRange(range)}
              style={[
                styles.dateRangeButton,
                dateRange === range ? styles.dateRangeActive : styles.dateRangeInactive,
              ]}
            >
              <Text style={styles.dateRangeText}>{range.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Views Overview Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Views Overview</Text>
        <View style={styles.cardsRow}>
          <View style={styles.card}>
            <Text style={styles.cardValue}>{data.views.total.toLocaleString()}</Text>
            <Text style={styles.cardLabel}>Total Views</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardValue}>{data.views.vibes.toLocaleString()}</Text>
            <Text style={styles.cardLabel}>Vibe Views</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardValue}>{data.views.bangers.toLocaleString()}</Text>
            <Text style={styles.cardLabel}>Banger Views</Text>
          </View>
        </View>
        <View style={styles.chartContainer}>
          <VictoryChart height={300}>
            <VictoryAxis
              dependentAxis
              style={{
                axis: { stroke: '#9CA3AF' },
                tickLabels: { fill: '#9CA3AF', fontSize: 10 },
              }}
            />
            <VictoryAxis
              style={{
                axis: { stroke: '#9CA3AF' },
                tickLabels: { fill: '#9CA3AF', fontSize: 10 },
              }}
              tickFormat={(date: string) => format(new Date(date), 'MMM d')}
            />
            <VictoryArea
              data={data.views.trend}
              x="date"
              y="count"
              style={{
                data: { fill: "#00E5FF", stroke: "#00E5FF", fillOpacity: 0.3 },
              }}
              labels={({ datum }: { datum: { count: number } }) => datum.count.toString()}
              labelComponent={<VictoryTooltip />}
            />
          </VictoryChart>
        </View>
      </View>

      {/* Network Growth Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Network Growth</Text>
        <View style={styles.cardsRow}>
          <View style={styles.card}>
            <Text style={styles.cardValue}>{data.network.total.toLocaleString()}</Text>
            <Text style={styles.cardLabel}>Total Connections</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardValue}>+{data.network.newLast30Days.toLocaleString()}</Text>
            <Text style={styles.cardLabel}>New (30 Days)</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardValue}>
              {(data.network.acceptanceRate * 100).toFixed(1)}%
            </Text>
            <Text style={styles.cardLabel}>Acceptance Rate</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardValue}>{data.network.active.toLocaleString()}</Text>
            <Text style={styles.cardLabel}>Active Connections</Text>
          </View>
        </View>
        <View style={styles.chartContainer}>
          <VictoryPie
            data={[
              { x: 'Active', y: data.network.active },
              { x: 'Inactive', y: data.network.inactive },
            ]}
            innerRadius={60}
            labels={({ datum }: { datum: { x: string; y: number } }) =>
              `${datum.x}: ${datum.y}`
            }
            style={{
              labels: { fill: '#FFFFFF', fontSize: 12 },
            }}
            colorScale={['#9333EA', '#9CA3AF']}
          />
        </View>
      </View>

      {/* Engagement Metrics Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Engagement Metrics</Text>
        <View style={styles.cardsRow}>
          <View style={styles.card}>
            <Text style={styles.cardValue}>{data.engagement.profileVisits.toLocaleString()}</Text>
            <Text style={styles.cardLabel}>Profile Visits</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardValue}>
              {(data.engagement.interactionRate * 100).toFixed(1)}%
            </Text>
            <Text style={styles.cardLabel}>Interaction Rate</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardValue}>{data.engagement.comments.toLocaleString()}</Text>
            <Text style={styles.cardLabel}>Comments</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardValue}>{data.engagement.likes.toLocaleString()}</Text>
            <Text style={styles.cardLabel}>Likes</Text>
          </View>
        </View>
        <View style={styles.chartContainer}>
          <VictoryChart height={300}>
            <VictoryAxis
              style={{
                axis: { stroke: '#9CA3AF' },
                tickLabels: { fill: '#9CA3AF', fontSize: 10 },
              }}
            />
            <VictoryAxis
              dependentAxis
              style={{
                axis: { stroke: '#9CA3AF' },
                tickLabels: { fill: '#9CA3AF', fontSize: 10 },
              }}
            />
            <VictoryBar
              data={data.content.engagementByType}
              x="type"
              y="rate"
              style={{
                data: { fill: "#EC4899" },
              }}
              labels={({ datum }: { datum: { rate: number } }) =>
                `${(datum.rate * 100).toFixed(1)}%`
              }
              labelComponent={<VictoryTooltip />}
            />
          </VictoryChart>
        </View>
      </View>

      {/* Reach Analysis Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reach Analysis</Text>
        <View style={styles.cardsRow}>
          <View style={styles.card}>
            <Text style={styles.cardValue}>{data.reach.direct.toLocaleString()}</Text>
            <Text style={styles.cardLabel}>Direct Reach</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardValue}>{data.reach.extended.toLocaleString()}</Text>
            <Text style={styles.cardLabel}>Extended Reach</Text>
          </View>
        </View>
        <View style={styles.chartContainer}>
          <VictoryChart height={300}>
            <VictoryAxis
              style={{
                axis: { stroke: '#9CA3AF' },
                tickLabels: { fill: '#9CA3AF', fontSize: 10 },
              }}
              tickFormat={(hour: number) => `${hour}:00`}
            />
            <VictoryAxis
              dependentAxis
              style={{
                axis: { stroke: '#9CA3AF' },
                tickLabels: { fill: '#9CA3AF', fontSize: 10 },
              }}
            />
            <VictoryLine
              data={data.reach.peakTimes}
              x="hour"
              y="count"
              style={{
                data: { stroke: "#10B981", strokeWidth: 2 },
              }}
              labels={({ datum }: { datum: { count: number } }) => datum.count.toString()}
              labelComponent={<VictoryTooltip />}
            />
          </VictoryChart>
        </View>
      </View>

      {/* Content Performance Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Content Performance</Text>
        <View style={styles.topPostsContainer}>
          {data.content.topPosts.map((post) => (
            <View key={post.id} style={styles.topPostRow}>
              <View>
                <Text style={styles.topPostType}>{post.type}</Text>
                <Text style={styles.topPostDate}>
                  {format(new Date(post.created_at), 'MMM d, yyyy')}
                </Text>
              </View>
              <View style={styles.topPostStats}>
                <Text style={styles.topPostStat}>
                  {post.views.toLocaleString()} Views
                </Text>
                <Text style={styles.topPostStat}>
                  {post.likes.toLocaleString()} Likes
                </Text>
                <Text style={styles.topPostStat}>
                  {post.comments.toLocaleString()} Comments
                </Text>
              </View>
            </View>
          ))}
        </View>
        <View style={styles.dualChartRow}>
          <View style={styles.chartWrapper}>
            <Text style={styles.chartTitle}>Best Performing Days</Text>
            <View style={styles.smallChartContainer}>
              <VictoryChart height={200}>
                <VictoryAxis
                  style={{
                    axis: { stroke: '#9CA3AF' },
                    tickLabels: { fill: '#9CA3AF', fontSize: 10 },
                  }}
                />
                <VictoryAxis
                  dependentAxis
                  style={{
                    axis: { stroke: '#9CA3AF' },
                    tickLabels: { fill: '#9CA3AF', fontSize: 10 },
                  }}
                />
                <VictoryBar
                  data={data.content.bestDays}
                  x="day"
                  y="engagement"
                  style={{
                    data: { fill: "#FBBF24" },
                  }}
                  labels={({ datum }: { datum: { engagement: number } }) =>
                    datum.engagement.toString()
                  }
                  labelComponent={<VictoryTooltip />}
                />
              </VictoryChart>
            </View>
          </View>
          <View style={styles.chartWrapper}>
            <Text style={styles.chartTitle}>Audience Retention</Text>
            <View style={styles.smallChartContainer}>
              <VictoryChart height={200}>
                <VictoryAxis
                  style={{
                    axis: { stroke: '#9CA3AF' },
                    tickLabels: { fill: '#9CA3AF', fontSize: 10 },
                  }}
                  tickFormat={(d: string) => d}
                />
                <VictoryAxis
                  dependentAxis
                  style={{
                    axis: { stroke: '#9CA3AF' },
                    tickLabels: { fill: '#9CA3AF', fontSize: 10 },
                  }}
                />
                <VictoryLine
                  data={data.content.retention}
                  x="duration"
                  y="rate"
                  style={{
                    data: { stroke: "#FBBF24", strokeWidth: 2 },
                  }}
                  labels={({ datum }: { datum: { rate: number } }) =>
                    `${(datum.rate * 100).toFixed(1)}%`
                  }
                  labelComponent={<VictoryTooltip />}
                />
              </VictoryChart>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
    paddingTop: 16,
    backgroundColor: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  dateRangeContainer: {
    flexDirection: 'row',
  },
  dateRangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 4,
  },
  dateRangeActive: {
    backgroundColor: '#06B6D4',
  },
  dateRangeInactive: {
    backgroundColor: '#1F2937',
  },
  dateRangeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#1F2937',
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00E5FF',
  },
  cardLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  chartContainer: {
    height: 300,
  },
  section: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeFilter: {
    backgroundColor: '#06B6D4',
  },
  inactiveFilter: {
    backgroundColor: '#1F2937',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#1F2937',
    marginHorizontal: 16,
    borderRadius: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  contentList: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  contentCard: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  cardInfo: {
    marginLeft: 12,
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  cardRight: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(16,185,129,0.1)',
  },
  statusActive: {
    backgroundColor: 'rgba(16,185,129,0.1)',
  },
  statusCompleted: {
    backgroundColor: 'rgba(156,163,175,0.1)',
  },
  statusCancelled: {
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  statusOther: {
    backgroundColor: 'rgba(234,179,8,0.1)',
  },
  statusBadgeText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  previewContainer: {
    marginTop: 4,
  },
  videoPlaceholder: {
    height: 250,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  videoPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  contentImage: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    resizeMode: 'contain',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#D1D5DB',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  actionButtonRed: {
    backgroundColor: '#EF4444',
  },
  actionButtonGreen: {
    backgroundColor: '#10B981',
  },
  topPostsContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  topPostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  topPostType: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  topPostDate: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  topPostStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topPostStat: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  dualChartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartWrapper: {
    flex: 1,
    marginHorizontal: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  smallChartContainer: {
    height: 200,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#1F2937',
    width: '100%',
    maxWidth: 480,
    borderRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#374151',
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
    marginLeft: 8,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalMessage: {
    padding: 16,
    fontSize: 16,
    color: '#D1D5DB',
  },
  modalPreview: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  modalPreviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalPreviewCompany: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#374151',
  },
  modalActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#1F2937',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  modalActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

