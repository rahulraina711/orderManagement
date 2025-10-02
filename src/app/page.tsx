import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Users, FileText, BarChart3 } from 'lucide-react'

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session) {
    // Redirect authenticated users to their respective dashboards
    if (session.user.role === 'ADMIN') {
      redirect('/admin')
    } else {
      redirect('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center items-center mb-6">
            <Package className="h-16 w-16 text-blue-600 mr-4" />
            <h1 className="text-5xl font-bold text-gray-900">ManuOrder</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A bespoke order management system designed specifically for manufacturing plants. 
            Streamline your custom order process from submission to completion.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Custom Orders</CardTitle>
              <CardDescription>
                Submit detailed custom manufacturing requests with design files and specifications
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Order Management</CardTitle>
              <CardDescription>
                Track orders through every stage of the manufacturing pipeline with real-time updates
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Analytics & Reports</CardTitle>
              <CardDescription>
                Comprehensive reporting and analytics to track revenue and operational efficiency
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center">
          <div className="space-x-4">
            <Link href="/auth/signin">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="lg" variant="outline">
                Create Account
              </Button>
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            New to ManuOrder? Create an account to get started with your custom manufacturing orders.
          </p>
        </div>
      </div>
    </div>
  )
}
