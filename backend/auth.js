const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

class AuthService {
    constructor(database) {
        this.db = database;
    }

    // Generate JWT token
    generateToken(user) {
        return jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                name: user.name,
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );
    }

    // Verify JWT token
    verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return null;
        }
    }

    // Login user
    async login(email, password) {
        try {
            const user = await this.db.get('SELECT * FROM users WHERE email = ?', [email]);
            
            if (!user) {
                return { success: false, message: 'Invalid credentials' };
            }

            const isValidPassword = await bcrypt.compare(password, user.password);
            
            if (!isValidPassword) {
                return { success: false, message: 'Invalid credentials' };
            }

            const token = this.generateToken(user);
            
            return {
                success: true,
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                }
            };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Login failed' };
        }
    }

    // Register new user
    async register(email, password, name, role = 'admin') {
        try {
            // Check if user already exists
            const existingUser = await this.db.get('SELECT id FROM users WHERE email = ?', [email]);
            
            if (existingUser) {
                return { success: false, message: 'User already exists' };
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user
            const result = await this.db.run(
                'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
                [email, hashedPassword, name, role]
            );

            const user = {
                id: result.lastID,
                email,
                name,
                role
            };

            const token = this.generateToken(user);

            return {
                success: true,
                token,
                user
            };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: 'Registration failed' };
        }
    }

    // Middleware to authenticate requests
    authenticateToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ message: 'Access token required' });
        }

        const decoded = this.verifyToken(token);
        
        if (!decoded) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }

        req.user = decoded;
        next();
    }
}

module.exports = AuthService;
