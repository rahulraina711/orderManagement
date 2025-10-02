'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Package, LogOut, User } from 'lucide-react'

export function Navigation() {
  const { data: session } = useSession()

  if (!session) {
    return null
  }

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">ManuOrder</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">{session.user.name}</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {session.user.role}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {session.user.role === 'ADMIN' ? (
                <>
                  <Link href="/admin">
                    <Button variant="ghost" size="sm">
                      Admin Dashboard
                    </Button>
                  </Link>
                  <Link href="/admin/reports">
                    <Button variant="ghost" size="sm">
                      Reports
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm">
                      Dashboard
                    </Button>
                  </Link>
                  <Link href="/orders/new">
                    <Button variant="ghost" size="sm">
                      New Order
                    </Button>
                  </Link>
                </>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="text-red-600 hover:text-red-700"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
