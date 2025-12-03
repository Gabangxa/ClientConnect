import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft,
  Briefcase, 
  DollarSign, 
  FileCheck, 
  MessageSquare, 
  Star, 
  TrendingUp,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface AnalyticsOverview {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalRevenue: number;
  pendingRevenue: number;
  totalDeliverables: number;
  approvedDeliverables: number;
  pendingDeliverables: number;
  totalMessages: number;
  unreadMessages: number;
  averageRating: number;
  totalFeedback: number;
}

interface ProjectStats {
  byStatus: { status: string; count: number }[];
  recentlyCreated: { id: string; name: string; clientName: string; createdAt: string }[];
}

interface RevenueStats {
  totalInvoiced: number;
  totalPaid: number;
  totalPending: number;
  monthlyRevenue: { month: string; paid: number; pending: number }[];
}

interface ActivityStats {
  messagesPerDay: { date: string; count: number }[];
  deliverablesPerMonth: { month: string; count: number }[];
  feedbackPerMonth: { month: string; count: number; averageRating: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const STATUS_COLORS: Record<string, string> = {
  active: '#22c55e',
  completed: '#3b82f6',
  paused: '#f59e0b',
  archived: '#6b7280',
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatMonth(monthStr: string) {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  isLoading,
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string;
  icon: typeof Briefcase; 
  trend?: { value: number; label: string };
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center text-xs">
            <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
            <span className="text-green-500 font-medium">{trend.value}%</span>
            <span className="text-muted-foreground ml-1">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const { data: overview, isLoading: overviewLoading } = useQuery<AnalyticsOverview>({
    queryKey: ["/api/analytics/overview"],
  });

  const { data: projectStats, isLoading: projectsLoading } = useQuery<ProjectStats>({
    queryKey: ["/api/analytics/projects"],
  });

  const { data: revenueStats, isLoading: revenueLoading } = useQuery<RevenueStats>({
    queryKey: ["/api/analytics/revenue"],
  });

  const { data: activityStats, isLoading: activityLoading } = useQuery<ActivityStats>({
    queryKey: ["/api/analytics/activity"],
  });

  const isLoading = overviewLoading || projectsLoading || revenueLoading || activityLoading;

  const pieData = projectStats?.byStatus.map(s => ({
    name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
    value: s.count,
    color: STATUS_COLORS[s.status] || '#8884d8',
  })) || [];

  const revenueChartData = revenueStats?.monthlyRevenue.map(m => ({
    month: formatMonth(m.month),
    paid: m.paid,
    pending: m.pending,
  })) || [];

  const messagesChartData = activityStats?.messagesPerDay.slice(-14).map(m => ({
    date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count: m.count,
  })) || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost" className="p-2" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Analytics Dashboard</h1>
            <p className="text-slate-600">Track your business performance and insights</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        {isLoading && (
          <div className="flex items-center justify-center py-4 mb-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
            <span className="text-muted-foreground">Loading analytics...</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard
            title="Total Projects"
            value={overview?.totalProjects || 0}
            subtitle={`${overview?.activeProjects || 0} active, ${overview?.completedProjects || 0} completed`}
            icon={Briefcase}
            isLoading={overviewLoading}
          />
          <KPICard
            title="Total Revenue"
            value={formatCurrency(overview?.totalRevenue || 0)}
            subtitle={`${formatCurrency(overview?.pendingRevenue || 0)} pending`}
            icon={DollarSign}
            isLoading={overviewLoading}
          />
          <KPICard
            title="Deliverables"
            value={overview?.totalDeliverables || 0}
            subtitle={`${overview?.approvedDeliverables || 0} approved, ${overview?.pendingDeliverables || 0} pending`}
            icon={FileCheck}
            isLoading={overviewLoading}
          />
          <KPICard
            title="Average Rating"
            value={overview?.averageRating || 0}
            subtitle={`From ${overview?.totalFeedback || 0} reviews`}
            icon={Star}
            isLoading={overviewLoading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard
            title="Total Messages"
            value={overview?.totalMessages || 0}
            subtitle={`${overview?.unreadMessages || 0} unread`}
            icon={MessageSquare}
            isLoading={overviewLoading}
          />
          <KPICard
            title="Active Projects"
            value={overview?.activeProjects || 0}
            icon={Clock}
            isLoading={overviewLoading}
          />
          <KPICard
            title="Completed Projects"
            value={overview?.completedProjects || 0}
            icon={CheckCircle2}
            isLoading={overviewLoading}
          />
          <KPICard
            title="Pending Revenue"
            value={formatCurrency(overview?.pendingRevenue || 0)}
            icon={TrendingUp}
            isLoading={overviewLoading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Monthly revenue breakdown (last 6 months)</CardDescription>
            </CardHeader>
            <CardContent>
              {revenueLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : revenueChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis tickFormatter={(value) => `$${value}`} fontSize={12} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelStyle={{ color: '#374151' }}
                    />
                    <Legend />
                    <Bar dataKey="paid" name="Paid" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No revenue data available yet
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Projects by Status</CardTitle>
              <CardDescription>Distribution of your projects</CardDescription>
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No projects yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Message Activity</CardTitle>
              <CardDescription>Messages per day (last 14 days)</CardDescription>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="h-[250px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : messagesChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={messagesChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      name="Messages"
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No message activity yet
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Projects</CardTitle>
              <CardDescription>Your latest projects</CardDescription>
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ))}
                </div>
              ) : projectStats?.recentlyCreated && projectStats.recentlyCreated.length > 0 ? (
                <div className="space-y-3">
                  {projectStats.recentlyCreated.map((project) => (
                    <Link key={project.id} href={`/project/${project.id}`}>
                      <div 
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                        data-testid={`project-row-${project.id}`}
                      >
                        <div>
                          <p className="font-medium text-slate-900">{project.name}</p>
                          <p className="text-sm text-slate-500">{project.clientName}</p>
                        </div>
                        <p className="text-xs text-slate-400">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No projects yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Quick overview of your business metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(revenueStats?.totalPaid || 0)}
                </p>
                <p className="text-sm text-green-700">Total Earned</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(revenueStats?.totalPending || 0)}
                </p>
                <p className="text-sm text-yellow-700">Pending Payment</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {overview?.totalDeliverables || 0}
                </p>
                <p className="text-sm text-blue-700">Deliverables Sent</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {overview?.averageRating ? `${overview.averageRating}/5` : 'N/A'}
                </p>
                <p className="text-sm text-purple-700">Client Satisfaction</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
