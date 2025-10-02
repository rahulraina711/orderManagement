import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function POST(
  request: NextRequest,
  { params }: { params: any }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { amount, currency, details } = await request.json()

    if (!amount || !details) {
      return NextResponse.json(
        { error: 'Amount and details are required' },
        { status: 400 }
      )
    }

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: params.id }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Create quotation and update order status
    const quotation = await prisma.quotation.create({
      data: {
        amount: parseFloat(amount),
        currency: currency || 'USD',
        details,
        orderId: params.id
      }
    })

    // Update order status to PENDING_APPROVAL
    await prisma.order.update({
      where: { id: params.id },
      data: { status: 'PENDING_APPROVAL' }
    })

    return NextResponse.json({ quotation }, { status: 201 })
  } catch (error) {
    console.error('Error creating quotation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: any }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { isAccepted } = await request.json()

    if (typeof isAccepted !== 'boolean') {
      return NextResponse.json(
        { error: 'isAccepted must be a boolean' },
        { status: 400 }
      )
    }

    // Check if order exists and user has access
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { quotation: true }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    if (session.user.role === 'CUSTOMER' && order.customerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    if (!order.quotation) {
      return NextResponse.json(
        { error: 'No quotation found for this order' },
        { status: 404 }
      )
    }

    // Update quotation
    const quotation = await prisma.quotation.update({
      where: { orderId: params.id },
      data: { isAccepted }
    })

    // Update order status based on acceptance
    const newStatus = isAccepted ? 'IN_DESIGN' : 'REJECTED'
    await prisma.order.update({
      where: { id: params.id },
      data: { status: newStatus }
    })

    return NextResponse.json({ quotation })
  } catch (error) {
    console.error('Error updating quotation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
