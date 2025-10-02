'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatCurrency, getStatusColor, getStatusLabel } from '@/lib/utils'
import { Package, DollarSign, Clock,  Search, Filter, Eye, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react'

interface Order {
  id: string
  orderNumber: string
  customerNotes: string
  status: string
  createdAt: string
  customer: {
    id: string
    name: string
    email: string
  }
  designFiles: any[]
  quotation?: {
    amount: number
    currency: string
    isAccepted: boolean
  }
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState('ALL')
  const [customerFilter, setCustomerFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const statusOptions = [
    'ALL',
    'PENDING_QUOTE',
    'PENDING_APPROVAL',
    'IN_DESIGN',
    'IN_MANUFACTURING',
    'IN_TESTING',
    'IN_PAINTING',
    'COMPLETED',
    'REJECTED'
  ]

  const dateOptions = [
    { value: 'ALL', label: 'All Time' },
    { value: 'TODAY', label: 'Today' },
    { value: 'WEEK', label: 'Last 7 Days' },
    { value: 'MONTH', label: 'Last 30 Days' },
    { value: 'QUARTER', label: 'Last 3 Months' }
  ]

  useEffect(() => {
    if (status === 'loading') return

    if (!session || session.user.role !== 'ADMIN') {
      router.push('/auth/signin')
      return
    }

    fetchOrders()
  }, [session, status, router])

  useEffect(() => {
    applyFilters()
  }, [orders, searchTerm, statusFilter, dateFilter, customerFilter, sortBy, sortOrder])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      } else {
        console.error('Failed to fetch orders')
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...orders]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerNotes.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    // Customer filter
    if (customerFilter) {
      filtered = filtered.filter(order =>
        order.customer.name.toLowerCase().includes(customerFilter.toLowerCase()) ||
        order.customer.email.toLowerCase().includes(customerFilter.toLowerCase())
      )
    }

    // Date filter
    if (dateFilter !== 'ALL') {
      const now = new Date()
      const filterDate = new Date()
      
      switch (dateFilter) {
        case 'TODAY':
          filterDate.setHours(0, 0, 0, 0)
          filtered = filtered.filter(order => new Date(order.createdAt) >= filterDate)
          break
        case 'WEEK':
          filterDate.setDate(now.getDate() - 7)
          filtered = filtered.filter(order => new Date(order.createdAt) >= filterDate)
          break
        case 'MONTH':
          filterDate.setMonth(now.getMonth() - 1)
          filtered = filtered.filter(order => new Date(order.createdAt) >= filterDate)
          break
        case 'QUARTER':
          filterDate.setMonth(now.getMonth() - 3)
          filtered = filtered.filter(order => new Date(order.createdAt) >= filterDate)
          break
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case 'orderNumber':
          aValue = a.orderNumber
          bValue = b.orderNumber
          break
        case 'customer':
          aValue = a.customer.name
          bValue = b.customer.name
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'amount':
          aValue = a.quotation?.amount || 0
          bValue = b.quotation?.amount || 0
          break
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    setFilteredOrders(filtered)
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('ALL')
    setDateFilter('ALL')
    setCustomerFilter('')
    setSortBy('createdAt')
    setSortOrder('desc')
  }

  const handleOrderView = (orderId: string) => {
    router.push(`/admin/orders/${orderId}`)
  }

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown className="h-4 w-4" />
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  const totalOrders = orders.length
  const pendingOrders = orders.filter(order => ['PENDING_QUOTE', 'PENDING_APPROVAL'].includes(order.status)).length
  const activeOrders = orders.filter(order => ['IN_DESIGN', 'IN_MANUFACTURING', 'IN_TESTING', 'IN_PAINTING'].includes(order.status)).length
  const completedOrders = orders.filter(order => order.status === 'COMPLETED').length
  const totalRevenue = orders
    .filter(order => order.status === 'COMPLETED' && order.quotation?.isAccepted)
    .reduce((sum, order) => sum + (order.quotation?.amount || 0), 0)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600">Manage and track all manufacturing orders</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              All orders in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting quotes or approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeOrders}</div>
            <p className="text-xs text-muted-foreground">
              In production
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From {completedOrders} completed orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-5 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search orders, customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>
                  {status === 'ALL' ? 'All Statuses' : getStatusLabel(status)}
                </option>
              ))}
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {dateOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <Input
              placeholder="Filter by customer..."
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
            />

            <Button
              onClick={clearFilters}
              variant="outline"
              className="flex items-center"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>

          <div className="text-sm text-gray-600">
            Showing {filteredOrders.length} of {totalOrders} orders
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>
            Click on any order to view details and manage status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600">
                {orders.length === 0 
                  ? 'No orders have been submitted yet.' 
                  : 'Try adjusting your filters to see more results.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">
                      <button
                        onClick={() => handleSort('orderNumber')}
                        className="flex items-center space-x-1 font-medium text-gray-500 hover:text-gray-700"
                      >
                        <span>Order Number</span>
                        {getSortIcon('orderNumber')}
                      </button>
                    </th>
                    <th className="text-left py-3 px-4">
                      <button
                        onClick={() => handleSort('customer')}
                        className="flex items-center space-x-1 font-medium text-gray-500 hover:text-gray-700"
                      >
                        <span>Customer</span>
                        {getSortIcon('customer')}
                      </button>
                    </th>
                    <th className="text-left py-3 px-4">
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center space-x-1 font-medium text-gray-500 hover:text-gray-700"
                      >
                        <span>Status</span>
                        {getSortIcon('status')}
                      </button>
                    </th>
                    <th className="text-left py-3 px-4">
                      <button
                        onClick={() => handleSort('amount')}
                        className="flex items-center space-x-1 font-medium text-gray-500 hover:text-gray-700"
                      >
                        <span>Amount</span>
                        {getSortIcon('amount')}
                      </button>
                    </th>
                    <th className="text-left py-3 px-4">
                      <button
                        onClick={() => handleSort('createdAt')}
                        className="flex items-center space-x-1 font-medium text-gray-500 hover:text-gray-700"
                      >
                        <span>Created Date</span>
                        {getSortIcon('createdAt')}
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr 
                      key={order.id} 
                      className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleOrderView(order.id)}
                    >
                      <td className="py-3 px-4 font-medium">{order.orderNumber}</td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{order.customer.name}</div>
                          <div className="text-gray-500 text-xs">{order.customer.email}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {order.quotation ? (
                          <span className="font-medium text-green-600">
                            {formatCurrency(order.quotation.amount, order.quotation.currency)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {formatDate(new Date(order.createdAt))}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOrderView(order.id)
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
