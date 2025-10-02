/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all'

    let dateFilter: any = {}
    const now = new Date()

    switch (period) {
      case 'month':
        dateFilter = {
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1)
          }
        }
        break
      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
        dateFilter = {
          createdAt: {
            gte: quarterStart
          }
        }
        break
      case 'year':
        dateFilter = {
          createdAt: {
            gte: new Date(now.getFullYear(), 0, 1)
          }
        }
        break
      case 'last6months':
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
        dateFilter = {
          createdAt: {
            gte: sixMonthsAgo
          }
        }
        break
    }

    // Get completed orders with accepted quotations
    const completedOrders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        quotation: {
          isAccepted: true
        },
        ...dateFilter
      },
      include: {
        quotation: true,
        customer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    const totalRevenue = completedOrders.reduce((sum, order) => {
      return sum + (order.quotation?.amount || 0)
    }, 0)

    const orderCount = completedOrders.length

    // Group by month for chart data
    const monthlyRevenue = completedOrders.reduce((acc, order) => {
      const month = order.createdAt.toISOString().slice(0, 7) // YYYY-MM format
      acc[month] = (acc[month] || 0) + (order.quotation?.amount || 0)
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      totalRevenue,
      orderCount,
      monthlyRevenue,
      orders: completedOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customer.name,
        amount: order.quotation?.amount,
        currency: order.quotation?.currency,
        completedAt: order.updatedAt
      }))
    })
  } catch (error) {
    console.error('Error fetching revenue report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
