# Car Marketplace Philippines - Backend API

A comprehensive car marketplace platform built with Node.js, TypeScript, and Socket.io, featuring subscription-based listings, real-time admin console, and payment processing.

## Features

### Core Features
- **User Authentication & Authorization** - JWT-based auth with role management
- **Car Listings Management** - CRUD operations with image uploads and approval workflow
- **Advanced Search & Filtering** - Location-based search, price ranges, specifications
- **Subscription System** - Tiered plans with Stripe integration
- **Real-time Admin Dashboard** - Socket.io powered admin console
- **Payment Processing** - Stripe integration for subscriptions and transactions
- **Notification System** - Email, SMS, and push notifications
- **Location Services** - Philippines-specific regions, provinces, and cities

### Philippines-Specific Features
- Complete Philippines location database (regions, provinces, cities)
- Philippine Peso (PHP) as primary currency with multi-currency support
- Local phone number validation
- Popular car brands and models in the Philippines
- Timezone and localization support

### Technical Features
- **TypeScript** - Full type safety and modern JavaScript features
- **TypeORM** - Database ORM with migrations and relationships
- **Socket.io** - Real-time communication for admin features
- **File Upload** - Image processing and cloud storage support
- **Rate Limiting** - API protection against abuse
- **Caching** - Redis integration for performance
- **Testing** - Comprehensive unit and integration tests
- **Docker** - Containerization for easy deployment

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MySQL 8.0
- **ORM**: TypeORM
- **Cache**: Redis
- **Real-time**: Socket.io
- **Authentication**: JWT + bcrypt
- **Payments**: Stripe
- **File Upload**: Multer + Cloud Storage
- **Testing**: Jest + Supertest
- **Documentation**: OpenAPI/Swagger

## Installation

### Prerequisites
- Node.js 18 or higher
- MySQL 8.0
- Redis (optional, for caching)
- npm or yarn

### Local Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/your-org/car-marketplace-ph-api.git
cd car-marketplace-ph-api
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Configuration**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Database Setup**
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE car_marketplace_ph;"

# Run migrations
npm run migration:run

# Seed database
npm run seed
```

5. **Start development server**
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### Docker Setup

1. **Using Docker Compose (Recommended)**
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

2. **Production deployment**
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## API Documentation

### Base URL
- Development: `http://localhost:3000/api`
- Production: `https://api.carmarketplace.ph/api`

### Authentication
The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Core Endpoints

#### Authentication
```
POST   /api/auth/register     - User registration
POST   /api/auth/login        - User login
POST   /api/auth/refresh      - Refresh JWT token
GET    /api/auth/profile      - Get user profile
PUT    /api/auth/profile      - Update user profile
```

#### Cars
```
GET    /api/cars              - Search cars (public)
POST   /api/cars              - Create car listing (auth)
GET    /api/cars/:id          - Get car details
PUT    /api/cars/:id          - Update car listing (owner/admin)
DELETE /api/cars/:id          - Delete car listing (owner/admin)
GET    /api/cars/my/listings  - Get user's listings (auth)
```

#### Subscriptions
```
GET    /api/subscriptions/plans        - Get subscription plans
POST   /api/subscriptions              - Subscribe to plan (auth)
GET    /api/subscriptions/current      - Get current subscription (auth)
POST   /api/subscriptions/cancel       - Cancel subscription (auth)
```

#### Admin (Admin/Moderator only)
```
GET    /api/admin/analytics            - Dashboard analytics
GET    /api/admin/cars/pending         - Pending car approvals
POST   /api/admin/cars/:id/approve     - Approve car listing
POST   /api/admin/cars/:id/reject      - Reject car listing
GET    /api/admin/users                - User management
```

### WebSocket Events (Admin)

Connect to `/admin-socket` with JWT token for real-time admin features:

```javascript
const socket = io('/admin-socket', {
  auth: { token: 'your-jwt-token' }
});

// Listen for events
socket.on('new_car_submission', (data) => {
  console.log('New car submitted:', data);
});

socket.on('analytics_update', (data) => {
  console.log('Updated analytics:', data);
});

// Emit events
socket.emit('approve_car', { carId: 123 });
socket.emit('get_analytics');
```

## Database Schema

### Key Tables
- `users` - User accounts and profiles
- `cars` - Car listings with specifications
- `brands` - Car manufacturers
- `models` - Car models by brand
- `subscription_plans` - Available subscription tiers
- `user_subscriptions` - Active user subscriptions
- `inquiries` - User inquiries about cars
- `notifications` - System notifications
- `ph_regions`, `ph_provinces`, `ph_cities` - Philippines locations

### Relationships
- Users can have multiple car listings
- Cars belong to brands and models
- Users can have active subscriptions
- Inquiries connect buyers and sellers
- Rich location hierarchy for Philippines

## Environment Variables

### Required Variables
```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=car_marketplace_ph

# JWT Secrets
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Stripe
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

### Optional Variables
```bash
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# File Storage
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=your_bucket

# Email
SENDGRID_API_KEY=your_sendgrid_key

# SMS
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

## Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
npm run migration:generate  # Generate migration
npm run migration:run      # Run migrations
npm run seed         # Seed database
```

### Code Structure
```
src/
├── config/          # Database and app configuration
├── controllers/     # Request handlers
├── entities/        # TypeORM entities
├── middleware/      # Express middleware
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Utility functions
├── websocket/       # Socket.io handlers
└── app.ts          # Main application
```

### Testing
```bash
# Run all tests
npm test

# Run specific test file
npm test -- auth.test.ts

# Run tests with coverage
npm run test:coverage

# Run integration tests only
npm test -- --testPathPattern=integration
```

## Deployment

### Production Checklist
- [ ] Set strong JWT secrets
- [ ] Configure production database
- [ ] Set up SSL certificates
- [ ] Configure file storage (S3/Cloudinary)
- [ ] Set up monitoring (Sentry, DataDog)
- [ ] Configure email service
- [ ] Set up backup strategy
- [ ] Configure CDN for static files

### Docker Production
```bash
# Build production image
docker build -t car-marketplace-api .

# Run with production compose
docker-compose -f docker-compose.prod.yml up -d
```

### Environment-specific Deployment
```bash
# Staging
npm run deploy:staging

# Production
npm run deploy:production
```

## Monitoring & Logging

### Health Checks
- `GET /health` - Basic health check
- Database connectivity check
- Redis connectivity check
- External service checks

### Metrics
- API response times
- Database query performance
- Memory and CPU usage
- Error rates and types

### Logging
- Structured JSON logging
- Request/response logging
- Error tracking with stack traces
- Performance monitoring

## Security

### Implemented Security Measures
- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting on sensitive endpoints
- Input validation and sanitization
- SQL injection prevention via TypeORM
- CORS configuration
- Helmet.js security headers
- File upload validation
- Environment-based configuration

### Security Best Practices
- Regular dependency updates
- Secret rotation
- Database backups
- Access logging
- Error handling without info leakage

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes
4. Add tests for new functionality
5. Run tests: `npm test`
6. Commit changes: `git commit -am 'Add new feature'`
7. Push to branch: `git push origin feature/new-feature`
8. Submit a pull request

### Code Standards
- Use TypeScript for all new code
- Follow existing code formatting
- Add JSDoc comments for public methods
- Write tests for new features
- Update documentation as needed

## Support

### Documentation
- API Documentation: `/docs` (development)
- Database Schema: See `src/entities/`
- WebSocket Events: See `src/websocket/`

### Getting Help
- Check existing GitHub issues
- Create a new issue with detailed description
- Include relevant logs and error messages
- Specify environment details

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

### v1.0.0 (Current)
- Initial release
- Core car marketplace functionality
- Subscription system with Stripe
- Real-time admin dashboard
- Philippines location database
- Comprehensive test suite

### Planned Features
- Mobile app API endpoints
- Advanced search with Elasticsearch
- Machine learning recommendations
- Multi-language support
- Advanced analytics dashboard
- Integration with external car data APIs

---

**Car Marketplace Philippines** - Connecting car buyers and sellers across the Philippines with a modern, secure, and feature-rich platform.