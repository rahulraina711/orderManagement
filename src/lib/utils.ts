import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function getStatusColor(status: string) {
  const statusColors = {
    PENDING_QUOTE: 'bg-yellow-100 text-yellow-800',
    PENDING_APPROVAL: 'bg-blue-100 text-blue-800',
    IN_DESIGN: 'bg-purple-100 text-purple-800',
    IN_MANUFACTURING: 'bg-orange-100 text-orange-800',
    IN_TESTING: 'bg-indigo-100 text-indigo-800',
    IN_PAINTING: 'bg-pink-100 text-pink-800',
    COMPLETED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
  }
  return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
}

export function getStatusLabel(status: string) {
  const statusLabels = {
    PENDING_QUOTE: 'Pending Quote',
    PENDING_APPROVAL: 'Pending Approval',
    IN_DESIGN: 'In Design',
    IN_MANUFACTURING: 'In Manufacturing',
    IN_TESTING: 'In Testing',
    IN_PAINTING: 'In Painting',
    COMPLETED: 'Completed',
    REJECTED: 'Rejected',
  }
  return statusLabels[status as keyof typeof statusLabels] || status
}
