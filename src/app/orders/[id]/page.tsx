'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatCurrency, getStatusColor, getStatusLabel } from '@/lib/utils'
import { ArrowLeft, Download, DollarSign, FileText, Calendar, Package, CheckCircle, XCircle } from 'lucide-react'

interface Order {
  id: string
  orderNumber: string
  customerNotes: string
  status: string
  createdAt: Date
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

export default function OrderDetails() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingQuote, setIsUpdatingQuote] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return

    if (!session || session.user.role !== 'CUSTOMER') {
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

  const handleQuotationResponse = async (isAccepted: boolean) => {
    if (!order?.quotation) return

    setIsUpdatingQuote(true)
    setError('')

    try {
      const response = await fetch(`/api/orders/${orderId}/quotation`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAccepted })
      })

      if (response.ok) {
        const data = await response.json()
        setOrder(prev => prev ? {
          ...prev,
          status: isAccepted ? 'IN_DESIGN' : 'REJECTED',
          quotation: prev.quotation ? {
            ...prev.quotation,
            isAccepted
          } : undefined
        } : null)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update quotation response')
      }
    } catch (error) {
      console.error('Error updating quotation:', error)
      setError('Failed to update quotation response')
    } finally {
      setIsUpdatingQuote(false)
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <FileText className="h-4 w-4 text-blue-500" />
    } else if (fileType === 'application/pdf') {
      return <FileText className="h-4 w-4 text-red-500" />
    } else {
      return <FileText className="h-4 w-4 text-gray-500" />
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

  if (!session || session.user.role !== 'CUSTOMER') {
    return null
  }

  if (error && !order) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center py-16">
          <div className="text-red-600 text-lg mb-4">{error}</div>
          <Button onClick={fetchOrder} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!order) {
    return null
  }

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
          <p className="text-gray-600">Order Details</p>
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
                <span className="text-sm font-medium text-gray-500 block mb-2">Order Details</span>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                  {order.customerNotes}
                </p>
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
                        {getFileIcon(file.fileType)}
                        <span className="text-sm text-gray-900 ml-2">{file.fileName}</span>
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

        {/* Quotation Section */}
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
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(order.quotation.amount, order.quotation.currency)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Status</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    order.quotation.isAccepted 
                      ? 'bg-green-100 text-green-800' 
                      : order.status === 'REJECTED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.quotation.isAccepted 
                      ? 'Accepted' 
                      : order.status === 'REJECTED'
                      ? 'Rejected'
                      : 'Pending Your Response'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Quote Date</span>
                  <span className="text-sm text-gray-900">
                    {formatDate(order.quotation.createdAt)}
                  </span>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-500 block mb-2">Quote Details</span>
                  <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md whitespace-pre-line">
                    {order.quotation.details}
                  </div>
                </div>

                {!order.quotation.isAccepted && order.status === 'PENDING_APPROVAL' && (
                  <div className="space-y-3 pt-4 border-t">
                    <p className="text-sm font-medium text-gray-700">
                      Please review the quotation and choose your response:
                    </p>
                    
                    {error && (
                      <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                        {error}
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <Button
                        onClick={() => handleQuotationResponse(true)}
                        disabled={isUpdatingQuote}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {isUpdatingQuote ? 'Processing...' : 'Accept Quote'}
                      </Button>
                      <Button
                        onClick={() => handleQuotationResponse(false)}
                        disabled={isUpdatingQuote}
                        variant="outline"
                        className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        {isUpdatingQuote ? 'Processing...' : 'Reject Quote'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Quotation Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Quotation Pending
                  </h3>
                  <p className="text-gray-600">
                    Our team is reviewing your order and will provide a detailed quotation soon.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Order Progress</CardTitle>
              <CardDescription>
                Track your order through our manufacturing process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { status: 'PENDING_QUOTE', label: 'Quote Requested', completed: true },
                  { status: 'PENDING_APPROVAL', label: 'Awaiting Approval', completed: order.status !== 'PENDING_QUOTE' },
                  { status: 'IN_DESIGN', label: 'Design Phase', completed: ['IN_DESIGN', 'IN_MANUFACTURING', 'IN_TESTING', 'IN_PAINTING', 'COMPLETED'].includes(order.status) },
                  { status: 'IN_MANUFACTURING', label: 'Manufacturing', completed: ['IN_MANUFACTURING', 'IN_TESTING', 'IN_PAINTING', 'COMPLETED'].includes(order.status) },
                  { status: 'IN_TESTING', label: 'Quality Testing', completed: ['IN_TESTING', 'IN_PAINTING', 'COMPLETED'].includes(order.status) },
                  { status: 'IN_PAINTING', label: 'Finishing', completed: ['IN_PAINTING', 'COMPLETED'].includes(order.status) },
                  { status: 'COMPLETED', label: 'Completed', completed: order.status === 'COMPLETED' },
                ].map((step, index) => (
                  <div key={step.status} className="flex items-center">
                    <div className={`w-4 h-4 rounded-full mr-3 ${
                      step.completed 
                        ? 'bg-green-500' 
                        : order.status === step.status
                        ? 'bg-blue-500'
                        : 'bg-gray-300'
                    }`} />
                    <span className={`text-sm ${
                      step.completed 
                        ? 'text-green-700 font-medium' 
                        : order.status === step.status
                        ? 'text-blue-700 font-medium'
                        : 'text-gray-500'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
