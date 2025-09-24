require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const Database = require('./backend/database');
const AuthService = require('./backend/auth');
const Routes = require('./backend/routes');

class POSServer {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        this.db = new Database();
        this.authService = null;
        this.routes = null;
    }

    async initialize() {
        try {
            // Connect to database
            await this.db.connect();
            console.log('Database connected successfully');

            // Initialize services
            this.authService = new AuthService(this.db);
            this.routes = new Routes(this.db, this.authService);

            // Setup middleware
            this.setupMiddleware();

            // Setup routes
            this.setupRoutes();

            // Setup error handling
            this.setupErrorHandling();

            console.log('POS Server initialized successfully');
        } catch (error) {
            console.error('Failed to initialize server:', error);
            process.exit(1);
        }
    }

    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com"],
                },
            },
        }));

        // CORS
        this.app.use(cors({
            origin: process.env.NODE_ENV === 'production' ? false : true,
            credentials: true
        }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
            message: 'Too many requests from this IP, please try again later.'
        });
        this.app.use('/api/', limiter);

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Static files
        this.app.use(express.static(path.join(__dirname, 'public')));
        this.app.use(express.static(path.join(__dirname, 'frontend')));
    }

    setupRoutes() {
        // API routes first
        this.app.use(this.routes.getRouter());

        // Health check
        this.app.get('/api/health', (req, res) => {
            res.json({ 
                status: 'OK', 
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            });
        });

        // Serve frontend pages
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'frontend', 'login.html'));
        });

        this.app.get('/dashboard', (req, res) => {
            res.sendFile(path.join(__dirname, 'frontend', 'dashboard.html'));
        });

        this.app.get('/products', (req, res) => {
            res.sendFile(path.join(__dirname, 'frontend', 'products.html'));
        });

        this.app.get('/transactions', (req, res) => {
            res.sendFile(path.join(__dirname, 'frontend', 'transactions.html'));
        });

        this.app.get('/reports', (req, res) => {
            res.sendFile(path.join(__dirname, 'frontend', 'reports.html'));
        });

        // Handle 404 for API routes
        this.app.use('/api', (req, res) => {
            res.status(404).json({ message: 'API endpoint not found' });
        });

        // Fallback for all other routes - redirect to login
        this.app.use((req, res) => {
            res.redirect('/');
        });
    }

    setupErrorHandling() {
        // Global error handler
        this.app.use((error, req, res, next) => {
            console.error('Global error handler:', error);
            
            if (res.headersSent) {
                return next(error);
            }

            res.status(error.status || 500).json({
                message: process.env.NODE_ENV === 'production' 
                    ? 'Internal server error' 
                    : error.message,
                ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
            });
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('Uncaught Exception:', error);
            process.exit(1);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('SIGTERM received, shutting down gracefully');
            this.shutdown();
        });

        process.on('SIGINT', () => {
            console.log('SIGINT received, shutting down gracefully');
            this.shutdown();
        });
    }

    async start() {
        await this.initialize();
        
        this.server = this.app.listen(this.port, () => {
            console.log(`🚀 POS Server running on port ${this.port}`);
            console.log(`📊 Dashboard: http://localhost:${this.port}/dashboard`);
            console.log(`🔐 Login: http://localhost:${this.port}/`);
            console.log(`📋 Default credentials: admin@pos.com / admin123`);
        });
    }

    shutdown() {
        if (this.server) {
            this.server.close(() => {
                console.log('HTTP server closed');
                if (this.db) {
                    this.db.close();
                    console.log('Database connection closed');
                }
                process.exit(0);
            });
        }
    }
}

// Start server if this file is run directly
if (require.main === module) {
    const server = new POSServer();
    server.start().catch(error => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });
}

module.exports = POSServer;
