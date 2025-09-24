const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

class Database {
    constructor() {
        this.db = null;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            const dbPath = path.join(__dirname, '../database/pos.db');
            this.db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database');
                    this.initializeTables().then(resolve).catch(reject);
                }
            });
        });
    }

    async initializeTables() {
        const tables = [
            // Users table
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                name TEXT NOT NULL,
                role TEXT DEFAULT 'admin',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Categories table
            `CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Products table
            `CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                stock INTEGER NOT NULL DEFAULT 0,
                category_id INTEGER,
                sku TEXT UNIQUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories (id)
            )`,
            
            // Sales table
            `CREATE TABLE IF NOT EXISTS sales (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                total_amount DECIMAL(10,2) NOT NULL,
                payment_method TEXT DEFAULT 'cash',
                user_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`,
            
            // Sale items table
            `CREATE TABLE IF NOT EXISTS sale_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sale_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                unit_price DECIMAL(10,2) NOT NULL,
                total_price DECIMAL(10,2) NOT NULL,
                FOREIGN KEY (sale_id) REFERENCES sales (id),
                FOREIGN KEY (product_id) REFERENCES products (id)
            )`
        ];

        for (const table of tables) {
            await this.run(table);
        }

        // Insert default admin user and seed data
        await this.seedData();
    }

    async seedData() {
        // Check if admin user exists
        const adminExists = await this.get('SELECT id FROM users WHERE email = ?', ['admin@pos.com']);
        
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await this.run(
                'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
                ['admin@pos.com', hashedPassword, 'Administrator', 'admin']
            );
        }

        // Seed categories
        const categoriesExist = await this.get('SELECT id FROM categories LIMIT 1');
        if (!categoriesExist) {
            const categories = [
                ['Electronics', 'Electronic devices and accessories'],
                ['Clothing', 'Apparel and fashion items'],
                ['Food & Beverages', 'Food items and drinks'],
                ['Books', 'Books and educational materials'],
                ['Home & Garden', 'Home improvement and garden supplies']
            ];

            for (const [name, description] of categories) {
                await this.run('INSERT INTO categories (name, description) VALUES (?, ?)', [name, description]);
            }
        }

        // Seed products
        const productsExist = await this.get('SELECT id FROM products LIMIT 1');
        if (!productsExist) {
            const products = [
                ['Smartphone', 'Latest Android smartphone', 299.99, 50, 1, 'PHONE001'],
                ['Laptop', 'High-performance laptop', 899.99, 25, 1, 'LAPTOP001'],
                ['T-Shirt', 'Cotton t-shirt', 19.99, 100, 2, 'SHIRT001'],
                ['Jeans', 'Denim jeans', 49.99, 75, 2, 'JEANS001'],
                ['Coffee', 'Premium coffee beans', 12.99, 200, 3, 'COFFEE001'],
                ['Energy Drink', 'Energy boost drink', 2.99, 150, 3, 'ENERGY001'],
                ['Programming Book', 'Learn JavaScript', 39.99, 30, 4, 'BOOK001'],
                ['Garden Tools', 'Basic garden tool set', 79.99, 20, 5, 'TOOLS001']
            ];

            for (const [name, description, price, stock, category_id, sku] of products) {
                await this.run(
                    'INSERT INTO products (name, description, price, stock, category_id, sku) VALUES (?, ?, ?, ?, ?, ?)',
                    [name, description, price, stock, category_id, sku]
                );
            }
        }

        // Seed some sample sales
        const salesExist = await this.get('SELECT id FROM sales LIMIT 1');
        if (!salesExist) {
            // Create sample sales for the last 30 days
            const userId = 1; // Admin user
            const sampleSales = [
                { total: 319.98, items: [{product_id: 1, quantity: 1, price: 299.99}, {product_id: 5, quantity: 1, price: 12.99}] },
                { total: 69.98, items: [{product_id: 3, quantity: 2, price: 19.99}, {product_id: 4, quantity: 1, price: 49.99}] },
                { total: 899.99, items: [{product_id: 2, quantity: 1, price: 899.99}] },
                { total: 42.98, items: [{product_id: 7, quantity: 1, price: 39.99}, {product_id: 6, quantity: 1, price: 2.99}] }
            ];

            for (const sale of sampleSales) {
                const saleId = await this.run(
                    'INSERT INTO sales (total_amount, payment_method, user_id) VALUES (?, ?, ?)',
                    [sale.total, 'cash', userId]
                );

                for (const item of sale.items) {
                    await this.run(
                        'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
                        [saleId.lastID, item.product_id, item.quantity, item.price, item.quantity * item.price]
                    );
                    
                    // Update stock
                    await this.run(
                        'UPDATE products SET stock = stock - ? WHERE id = ?',
                        [item.quantity, item.product_id]
                    );
                }
            }
        }
    }

    async run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ lastID: this.lastID, changes: this.changes });
                }
            });
        });
    }

    async get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    close() {
        if (this.db) {
            this.db.close();
        }
    }
}

module.exports = Database;
