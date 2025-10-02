'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { BarChart3, DollarSign, TrendingUp, Calendar, Download } from 'lucide-react'

interface RevenueData {
  totalRevenue: number
  orderCount: number
  monthlyRevenue: Record<string, number>
  orders: {
    id: string
    orderNumber: string
    customerName: string
    amount: number
    currency: string
    completedAt: Date
  }[]
}

export default function AdminReports() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session || session.user.role !== 'ADMIN') {
      router.push('/auth/signin')
      return
    }

    fetchRevenueData()
  }, [session, status, router, selectedPeriod])

  const fetchRevenueData = async () => {
    try {
      const response = await fetch(`/api/reports/revenue?period=${selectedPeriod}`)
      
      if (response.ok) {
        const data = await response.json()
        setRevenueData(data)
      } else {
        console.error('Failed to fetch revenue data')
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period)
    setIsLoading(true)
    
    // The useEffect will trigger fetchRevenueData when selectedPeriod changes
  }

  const exportReport = () => {
    // In a real app, this would generate and download a report
    console.log('Exporting report for period:', selectedPeriod)
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN' || !revenueData) {
    return null
  }

  const averageOrderValue = revenueData.orderCount > 0 
    ? revenueData.totalRevenue / revenueData.orderCount 
    : 0

  const monthlyData = Object.entries(revenueData.monthlyRevenue).map(([month, revenue]) => ({
    month,
    revenue,
    formattedMonth: new Date(month + '-01').toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    })
  }))

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Revenue Reports</h1>
          <p className="text-gray-600">Track revenue and performance metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Time</option>
            <option value="year">This Year</option>
            <option value="last6months">Last 6 Months</option>
            <option value="quarter">This Quarter</option>
            <option value="month">This Month</option>
          </select>
          <Button onClick={exportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(revenueData.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {revenueData.orderCount} completed orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(averageOrderValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per completed order
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revenueData.orderCount}</div>
            <p className="text-xs text-muted-foreground">
              Successfully delivered
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Monthly Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Monthly Revenue Trend
            </CardTitle>
            <CardDescription>
              Revenue breakdown by month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyData.map((data) => (
                <div key={data.month} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium">{data.formattedMonth}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(data.revenue / Math.max(...monthlyData.map(d => d.revenue))) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold text-green-600 min-w-20 text-right">
                      {formatCurrency(data.revenue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Completed Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Completed Orders</CardTitle>
            <CardDescription>
              Latest orders contributing to revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenueData.orders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.customerName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Completed {formatDate(order.completedAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">
                      {formatCurrency(order.amount, order.currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Revenue Table */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Revenue Details</CardTitle>
          <CardDescription>
            Complete breakdown of all completed orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Order Number</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Completed Date</th>
                </tr>
              </thead>
              <tbody>
                {revenueData.orders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{order.orderNumber}</td>
                    <td className="py-3 px-4">{order.customerName}</td>
                    <td className="py-3 px-4 font-bold text-green-600">
                      {formatCurrency(order.amount, order.currency)}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {formatDate(order.completedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
