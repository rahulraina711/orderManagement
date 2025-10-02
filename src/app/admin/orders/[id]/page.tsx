'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatCurrency, getStatusColor, getStatusLabel } from '@/lib/utils'
import { ArrowLeft, Download, DollarSign, FileText, User, Calendar, Package } from 'lucide-react'

interface Order {
  id: string
  orderNumber: string
  customerNotes: string
  status: string
  createdAt: Date
  customer: {
    id: string
    name: string
    email: string
  }
  designFiles: {
    id: string
    fileName: string
    fileUrl: string
    fileType: string
  }[]
  quotation?: {
    id: string
    amount: number
    currency: string
    details: string
    isAccepted: boolean
    createdAt: Date
  }
}

export default function AdminOrderDetails() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingQuote, setIsCreatingQuote] = useState(false)
  const [quoteAmount, setQuoteAmount] = useState('')
  const [quoteDetails, setQuoteDetails] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return

    if (!session || session.user.role !== 'ADMIN') {
      router.push('/auth/signin')
      return
    }

    fetchOrder()
  }, [session, status, router, orderId])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      
      if (response.ok) {
        const data = await response.json()
        setOrder(data.order)
      } else if (response.status === 404) {
        setError('Order not found')
      } else {
        setError('Failed to fetch order details')
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      setError('Failed to fetch order details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingQuote(true)
    setError('')

    if (!quoteAmount || !quoteDetails) {
      setError('Please fill in all fields')
      setIsCreatingQuote(false)
      return
    }

    try {
      const response = await fetch(`/api/orders/${orderId}/quotation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(quoteAmount),
          details: quoteDetails
        })
      })

      if (response.ok) {
        const data = await response.json()
        setOrder(prev => prev ? {
          ...prev,
          status: 'PENDING_APPROVAL',
          quotation: data.quotation
        } : null)
        setQuoteAmount('')
        setQuoteDetails('')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create quotation')
      }
    } catch (error) {
      console.error('Error creating quotation:', error)
      setError('Failed to create quotation')
    } finally {
      setIsCreatingQuote(false)
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return

    try {
      // Update local state immediately for better UX
      setOrder(prev => prev ? { ...prev, status: newStatus } : null)

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        // Revert the optimistic update on error
        fetchOrder()
        console.error('Failed to update order status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      // Revert the optimistic update on error
      fetchOrder()
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN' || !order) {
    return null
  }

  const statusOptions = [
    'PENDING_QUOTE',
    'PENDING_APPROVAL',
    'IN_DESIGN',
    'IN_MANUFACTURING',
    'IN_TESTING',
    'IN_PAINTING',
    'COMPLETED',
    'REJECTED'
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{order.orderNumber}</h1>
          <p className="text-gray-600">Order Details & Management</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Order Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Order Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Status</span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Created</span>
                <div className="flex items-center text-sm text-gray-900">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(order.createdAt)}
                </div>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-500 block mb-2">Customer Notes</span>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                  {order.customerNotes}
                </p>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-500 block mb-2">Update Status</span>
                <select
                  value={order.status}
                  onChange={(e) => handleStatusUpdate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>
                      {getStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Name</span>
                <span className="text-sm text-gray-900">{order.customer.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Email</span>
                <span className="text-sm text-gray-900">{order.customer.email}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Design Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.designFiles.length === 0 ? (
                <p className="text-sm text-gray-500">No design files uploaded</p>
              ) : (
                <div className="space-y-2">
                  {order.designFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                    >
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{file.fileName}</span>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quotation Management */}
        <div className="space-y-6">
          {order.quotation ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Quotation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Amount</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(order.quotation.amount, order.quotation.currency)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Status</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    order.quotation.isAccepted 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.quotation.isAccepted ? 'Accepted' : 'Pending Approval'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Created</span>
                  <span className="text-sm text-gray-900">
                    {formatDate(order.quotation.createdAt)}
                  </span>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-500 block mb-2">Details</span>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                    {order.quotation.details}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Create Quotation
                </CardTitle>
                <CardDescription>
                  Provide a quote for this manufacturing order
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateQuotation} className="space-y-4">
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (USD)
                    </label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={quoteAmount}
                      onChange={(e) => setQuoteAmount(e.target.value)}
                      placeholder="Enter quote amount"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-1">
                      Quote Details
                    </label>
                    <textarea
                      id="details"
                      value={quoteDetails}
                      onChange={(e) => setQuoteDetails(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Provide details about the quote, including materials, labor, timeline, etc."
                      required
                    />
                  </div>

                  {error && (
                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isCreatingQuote}
                  >
                    {isCreatingQuote ? 'Creating Quote...' : 'Create Quotation'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
