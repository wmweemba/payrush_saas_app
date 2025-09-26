/**
 * Application Configuration
 * 
 * Central configuration management for the PayRush server
 */

const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3001'
  },

  // Database configuration
  database: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-jwt-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },

  // CORS configuration
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },

  // Payment configuration
  payments: {
    flutterwave: {
      publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
      secretKey: process.env.FLUTTERWAVE_SECRET_KEY,
      encryptionKey: process.env.FLUTTERWAVE_ENCRYPTION_KEY,
      webhookHash: process.env.FLUTTERWAVE_WEBHOOK_HASH,
      baseUrl: process.env.FLUTTERWAVE_BASE_URL || 'https://api.flutterwave.com/v3'
    }
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later'
  },

  // File upload limits
  upload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
  },

  // Email configuration (for future use)
  email: {
    smtp: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: process.env.ENABLE_CONSOLE_LOGS !== 'false',
    enableFile: process.env.ENABLE_FILE_LOGS === 'true'
  }
};

// Validation function to check required environment variables
const validateConfig = () => {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missing = required.filter(key => {
    const envVar = key;
    return !process.env[envVar];
  });

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Warn about optional but recommended variables
  const recommended = [
    'JWT_SECRET',
    'FLUTTERWAVE_SECRET_KEY'
  ];

  const missingRecommended = recommended.filter(key => !process.env[key]);
  if (missingRecommended.length > 0) {
    console.warn(`⚠️  Missing recommended environment variables: ${missingRecommended.join(', ')}`);
  }
};

// Validate on module load
try {
  validateConfig();
  console.log('✅ Configuration validated successfully');
} catch (error) {
  console.error('❌ Configuration validation failed:', error.message);
  process.exit(1);
}

module.exports = config;