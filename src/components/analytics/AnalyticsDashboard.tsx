import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from '@/components/ui/simple-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, TrendingUp, TrendingDown, Users, FileText, CheckCircle, Clock } from 'lucide-react';

// Sample data - replace with real API calls
const applicationTrends = [
  { month: 'Jan', aplikasi: 65, disetujui: 58, ditolak: 7 },
  { month: 'Feb', aplikasi: 78, disetujui: 70, ditolak: 8 },
  { month: 'Mar', aplikasi: 90, disetujui: 82, ditolak: 8 },
  { month: 'Apr', aplikasi: 81, disetujui: 75, ditolak: 6 },
  { month: 'May', aplikasi: 95, disetujui: 88, ditolak: 7 },
  { month: 'Jun', aplikasi: 102, disetujui: 94, ditolak: 8 }
];

const certificatesByType = [
  { name: 'Konstruksi', value: 45, color: '#0088FE' },
  { name: 'Manufaktur', value: 30, color: '#00C49F' },
  { name: 'Perdagangan', value: 15, color: '#FFBB28' },
  { name: 'Jasa', value: 10, color: '#FF8042' }
];

const dailyActivities = [
  { time: '00:00', aktivitas: 12 },
  { time: '04:00', aktivitas: 8 },
  { time: '08:00', aktivitas: 45 },
  { time: '12:00', aktivitas: 38 },
  { time: '16:00', aktivitas: 52 },
  { time: '20:00', aktivitas: 28 }
];

export const AnalyticsDashboard: React.FC = () => {
  const { t } = useTranslation();

  const stats = [
    {
      title: t('dashboard.totalApplications'),
      value: '1,234',
      change: '+12.5%',
      trend: 'up' as const,
      icon: FileText
    },
    {
      title: t('dashboard.activeCertificates'),
      value: '987',
      change: '+8.3%',
      trend: 'up' as const,
      icon: CheckCircle
    },
    {
      title: t('dashboard.pendingReviews'),
      value: '45',
      change: '-15.2%',
      trend: 'down' as const,
      icon: Clock
    },
    {
      title: 'Active Users',
      value: '2,456',
      change: '+5.7%',
      trend: 'up' as const,
      icon: Users
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor dan analisis aktivitas portal SBU Kadin Indonesia
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DatePickerWithRange />
          <Select defaultValue="30d">
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Hari</SelectItem>
              <SelectItem value="30d">30 Hari</SelectItem>
              <SelectItem value="90d">90 Hari</SelectItem>
              <SelectItem value="1y">1 Tahun</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {stat.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                )}
                <span className={stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                  {stat.change}
                </span>
                <span className="ml-1">dari bulan lalu</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trend Aplikasi</TabsTrigger>
          <TabsTrigger value="certificates">Distribusi Sertifikat</TabsTrigger>
          <TabsTrigger value="activities">Aktivitas Harian</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trend Permohonan Sertifikat</CardTitle>
              <CardDescription>
                Perbandingan jumlah aplikasi, persetujuan, dan penolakan per bulan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={applicationTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="aplikasi"
                    stackId="1"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="disetujui"
                    stackId="2"
                    stroke="#00C49F"
                    fill="#00C49F"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="ditolak"
                    stackId="3"
                    stroke="#FF8042"
                    fill="#FF8042"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribusi Sertifikat per Kategori</CardTitle>
                <CardDescription>
                  Persentase sertifikat berdasarkan bidang usaha
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={certificatesByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {certificatesByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Categories</CardTitle>
                <CardDescription>
                  Kategori dengan permohonan terbanyak
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={certificatesByType}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aktivitas Pengguna Harian</CardTitle>
              <CardDescription>
                Pola aktivitas pengguna sepanjang hari
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={dailyActivities}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="aktivitas"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};