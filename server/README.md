# PayRush Server

Express.js backend server for the PayRush SaaS invoice management application.

## 🏗️ Architecture

This server follows a modular architecture with clear separation of concerns:

```
server/
├── index.js              # Main server entry point
├── config/               # Configuration files
│   ├── index.js          # Main config
│   └── database.js       # Database config
├── routes/               # API route handlers
│   ├── auth.js           # Authentication routes
│   ├── clients.js        # Client management routes
│   ├── payments.js       # Payment processing routes
│   └── webhooks.js       # Webhook handlers
├── middleware/           # Express middleware
│   ├── auth.js           # Authentication middleware
│   ├── errorHandler.js   # Global error handling
│   └── logger.js         # Request logging
├── services/             # Business logic services
├── utils/                # Utility functions
└── .env.example          # Environment template
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- Supabase project with service role key

### Installation

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Setup environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Start development server:**
   ```bash
   pnpm dev
   ```

4. **Start production server:**
   ```bash
   pnpm start
   ```

## 📡 API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Clients (Protected)
- `GET /api/clients` - List user's clients
- `POST /api/clients` - Create new client
- `GET /api/clients/:id` - Get specific client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Payments (Protected)
- `POST /api/payments/verify` - Verify payment
- `POST /api/payments/initiate` - Initiate payment

### Webhooks
- `POST /api/webhooks/flutterwave` - Flutterwave webhook

## 🔐 Authentication

The server uses Supabase JWT tokens for authentication. Include the token in requests:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:5000/api/clients
```

## 🌍 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | No |
| `PORT` | Server port | No (default: 5000) |
| `CLIENT_URL` | Frontend URL for CORS | No |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `JWT_SECRET` | JWT signing secret | Recommended |
| `FLUTTERWAVE_SECRET_KEY` | Flutterwave secret key | For payments |

## 🔧 Development

### Running Tests
```bash
pnpm test
```

### Linting
```bash
pnpm lint
pnpm lint:fix
```

### Debugging
Set `NODE_ENV=development` for detailed logging and error traces.

## 🚀 Deployment

1. **Set production environment:**
   ```bash
   export NODE_ENV=production
   ```

2. **Install production dependencies:**
   ```bash
   pnpm install --prod
   ```

3. **Start server:**
   ```bash
   pnpm start
   ```

## 🔒 Security Features

- CORS protection
- Request rate limiting
- Input sanitization
- JWT token validation
- Error message sanitization in production
- Helmet security headers
- Request logging and monitoring

## 📊 Monitoring

- Health check endpoint at `/health`
- Request/response logging
- Error tracking and reporting
- Performance metrics

## 🤝 Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Update documentation
4. Run linting before commits

## 📝 License

ISC License - See LICENSE file for details