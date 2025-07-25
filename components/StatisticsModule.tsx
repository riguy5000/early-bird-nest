import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { apiCall } from '../utils/supabase/simple-client';
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
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Users, 
  Calendar,
  Target,
  Award,
  Zap
} from 'lucide-react';

interface Store {
  id: string;
  name: string;
}

interface StatisticsData {
  overview: {
    totalRevenue: number;
    totalItems: number;
    totalCustomers: number;
    avgTransactionValue: number;
    revenueChange: number;
    itemsChange: number;
    customersChange: number;
    avgValueChange: number;
  };
  categoryBreakdown: Array<{
    category: string;
    count: number;
    value: number;
    percentage: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    items: number;
    customers: number;
  }>;
  metalBreakdown: Array<{
    metal: string;
    weight: number;
    value: number;
    color: string;
  }>;
  topCustomers: Array<{
    name: string;
    transactions: number;
    totalValue: number;
  }>;
}

interface StatisticsModuleProps {
  currentStore: Store | null;
}

export function StatisticsModule({ currentStore }: StatisticsModuleProps) {
  const [data, setData] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    if (currentStore) {
      loadStatistics();
    }
  }, [currentStore, timeRange]);

  const loadStatistics = async () => {
    if (!currentStore) return;
    
    setLoading(true);
    try {
      // Mock data - in real app would come from API
      const mockData: StatisticsData = {
        overview: {
          totalRevenue: 45678.90,
          totalItems: 234,
          totalCustomers: 89,
          avgTransactionValue: 512.45,
          revenueChange: 12.3,
          itemsChange: 8.7,
          customersChange: 15.2,
          avgValueChange: -2.1,
        },
        categoryBreakdown: [
          { category: 'Rings', count: 78, value: 18500, percentage: 35 },
          { category: 'Necklaces', count: 45, value: 12300, percentage: 25 },
          { category: 'Watches', count: 23, value: 9800, percentage: 20 },
          { category: 'Bracelets', count: 34, value: 6700, percentage: 12 },
          { category: 'Earrings', count: 54, value: 4200, percentage: 8 },
        ],
        monthlyTrends: [
          { month: 'Jan', revenue: 15000, items: 45, customers: 23 },
          { month: 'Feb', revenue: 18000, items: 52, customers: 28 },
          { month: 'Mar', revenue: 22000, items: 67, customers: 34 },
          { month: 'Apr', revenue: 19000, items: 58, customers: 31 },
          { month: 'May', revenue: 25000, items: 73, customers: 41 },
          { month: 'Jun', revenue: 28000, items: 82, customers: 47 },
        ],
        metalBreakdown: [
          { metal: '24k Gold', weight: 1250, value: 35000, color: '#FFD700' },
          { metal: '18k Gold', weight: 890, value: 22000, color: '#FFA500' },
          { metal: '14k Gold', weight: 650, value: 12000, color: '#DAA520' },
          { metal: 'Silver', weight: 2100, value: 8500, color: '#C0C0C0' },
          { metal: 'Platinum', weight: 320, value: 15000, color: '#E5E4E2' },
        ],
        topCustomers: [
          { name: 'John Smith', transactions: 8, totalValue: 3450 },
          { name: 'Mary Johnson', transactions: 6, totalValue: 2890 },
          { name: 'Robert Brown', transactions: 5, totalValue: 2340 },
          { name: 'Lisa Davis', transactions: 7, totalValue: 2100 },
          { name: 'Michael Wilson', transactions: 4, totalValue: 1950 },
        ],
      };
      
      setData(mockData);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatChange = (change: number) => {
    const isPositive = change >= 0;
    return (
      <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
        <span className="text-sm">
          {isPositive ? '+' : ''}{change.toFixed(1)}%
        </span>
      </div>
    );
  };

  if (!currentStore) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistics & Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please select a store to view analytics.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Statistics & Analytics</h2>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Statistics & Analytics</h2>
          <p className="text-muted-foreground">{currentStore.name}</p>
        </div>
        
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 Days</SelectItem>
            <SelectItem value="30d">30 Days</SelectItem>
            <SelectItem value="90d">90 Days</SelectItem>
            <SelectItem value="1y">1 Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {data && (
        <>
          {/* Overview KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{formatCurrency(data.overview.totalRevenue)}</span>
                  {formatChange(data.overview.revenueChange)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Package className="w-4 h-4 mr-2 text-blue-600" />
                  Total Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{data.overview.totalItems}</span>
                  {formatChange(data.overview.itemsChange)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Users className="w-4 h-4 mr-2 text-purple-600" />
                  Total Customers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{data.overview.totalCustomers}</span>
                  {formatChange(data.overview.customersChange)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Target className="w-4 h-4 mr-2 text-orange-600" />
                  Avg Transaction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{formatCurrency(data.overview.avgTransactionValue)}</span>
                  {formatChange(data.overview.avgValueChange)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 60%)`} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Metal Weight Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.metalBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metal" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value}g`} />
                    <Bar dataKey="weight" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="items" fill="#82ca9d" name="Items" />
                    <Bar dataKey="customers" fill="#ffc658" name="Customers" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="w-4 h-4 mr-2" />
                  Top Customers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topCustomers.map((customer, index) => (
                    <div key={customer.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-medium">#{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {customer.transactions} transactions
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(customer.totalValue)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 text-green-600 mr-2" />
                      <span className="font-medium text-green-800">Revenue Growing</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Revenue is up 12.3% compared to last period
                    </p>
                  </div>
                  
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center">
                      <Target className="w-4 h-4 text-blue-600 mr-2" />
                      <span className="font-medium text-blue-800">High-Value Items</span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      Rings generate 35% of total revenue
                    </p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 text-purple-600 mr-2" />
                      <span className="font-medium text-purple-800">Customer Growth</span>
                    </div>
                    <p className="text-sm text-purple-700 mt-1">
                      15.2% increase in new customers this period
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}