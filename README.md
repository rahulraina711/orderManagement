# ManuOrder - Manufacturing Order Management System

A bespoke order management system designed specifically for manufacturing plants. Built with Next.js, TypeScript, Prisma, and MongoDB.

## Features

### Customer Features
- **User Authentication**: Secure sign-up and sign-in with NextAuth.js
- **Order Submission**: Submit custom manufacturing requests with detailed specifications
- **File Upload**: Upload design files, CAD drawings, and technical specifications
- **Order Tracking**: Real-time tracking of orders through the manufacturing pipeline
- **Quotation Management**: Review and respond to quotations from manufacturers
- **Dashboard**: Overview of all orders with status tracking

### Admin Features
- **Order Management**: Kanban board for managing orders through different stages
- **Quotation Creation**: Create and send quotations to customers
- **File Management**: Access and download customer-uploaded design files
- **Status Updates**: Update order status through drag-and-drop interface
- **Revenue Reports**: Comprehensive reporting and analytics
- **Customer Management**: View customer information and order history

## Tech Stack

- **Frontend**: Next.js 14+ with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **File Storage**: AWS S3 (with local fallback)
- **UI Components**: Custom components with Radix UI primitives
- **Drag & Drop**: @dnd-kit for Kanban board functionality

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB database
- AWS S3 bucket (optional, for file storage)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd manuorder
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
DATABASE_URL="mongodb://localhost:27017/manuorder"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# File Upload (AWS S3 - optional)
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### User Model
- Authentication and role management (CUSTOMER/ADMIN)
- NextAuth.js integration with accounts and sessions

### Order Model
- Order tracking with unique order numbers
- Status management through manufacturing pipeline
- Customer notes and specifications

### DesignFile Model
- File metadata and storage references
- Support for various file types (PDF, CAD, images)

### Quotation Model
- Pricing and details for orders
- Acceptance/rejection tracking

## API Routes

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth.js handlers

### Orders
- `GET /api/orders` - Fetch orders (filtered by user role)
- `POST /api/orders` - Create new order
- `GET /api/orders/[id]` - Get order details
- `PUT /api/orders/[id]` - Update order status

### Quotations
- `POST /api/orders/[id]/quotation` - Create quotation
- `PUT /api/orders/[id]/quotation` - Accept/reject quotation

### File Management
- `POST /api/upload` - Upload files to S3/local storage
- `GET /api/files/[key]` - Serve files with signed URLs

### Reports
- `GET /api/reports/revenue` - Revenue analytics

## Deployment

### Environment Setup
1. Set up MongoDB database (MongoDB Atlas recommended)
2. Configure AWS S3 bucket for file storage
3. Set production environment variables
4. Deploy to Vercel, Netlify, or your preferred platform

### Production Considerations
- Use strong NEXTAUTH_SECRET in production
- Configure proper CORS settings
- Set up proper file upload limits
- Implement rate limiting for API routes
- Configure proper error monitoring

## File Storage

The system supports both AWS S3 and local file storage:

- **AWS S3**: Recommended for production with signed URLs for security
- **Local Storage**: Fallback option for development/testing

Files are validated for type and size before upload.

## Security Features

- JWT-based authentication with NextAuth.js
- Role-based access control (Customer/Admin)
- File upload validation and sanitization
- Signed URLs for secure file access
- CSRF protection through NextAuth.js

## Order Status Flow

1. **PENDING_QUOTE** - Initial order submission
2. **PENDING_APPROVAL** - Quotation sent, awaiting customer response
3. **IN_DESIGN** - Order approved, design phase
4. **IN_MANUFACTURING** - Manufacturing in progress
5. **IN_TESTING** - Quality testing phase
6. **IN_PAINTING** - Finishing/painting phase
7. **COMPLETED** - Order completed and delivered
8. **REJECTED** - Order rejected by customer or admin

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
