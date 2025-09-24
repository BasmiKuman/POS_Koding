const express = require('express');
const XLSX = require('xlsx');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs');

class Routes {
    constructor(database, authService) {
        this.db = database;
        this.auth = authService;
        this.router = express.Router();
        this.setupRoutes();
    }

    setupRoutes() {
        // Auth routes
        this.router.post('/api/auth/login', this.login.bind(this));
        this.router.post('/api/auth/register', this.register.bind(this));
        this.router.get('/api/auth/verify', this.auth.authenticateToken.bind(this.auth), this.verifyToken.bind(this));

        // Protected routes
        const authenticate = this.auth.authenticateToken.bind(this.auth);

        // Dashboard routes
        this.router.get('/api/dashboard/stats', authenticate, this.getDashboardStats.bind(this));

        // Category routes
        this.router.get('/api/categories', authenticate, this.getCategories.bind(this));
        this.router.post('/api/categories', authenticate, this.createCategory.bind(this));
        this.router.put('/api/categories/:id', authenticate, this.updateCategory.bind(this));
        this.router.delete('/api/categories/:id', authenticate, this.deleteCategory.bind(this));

        // Product routes
        this.router.get('/api/products', authenticate, this.getProducts.bind(this));
        this.router.get('/api/products/:id', authenticate, this.getProduct.bind(this));
        this.router.post('/api/products', authenticate, this.createProduct.bind(this));
        this.router.put('/api/products/:id', authenticate, this.updateProduct.bind(this));
        this.router.delete('/api/products/:id', authenticate, this.deleteProduct.bind(this));

        // Sales routes
        this.router.get('/api/sales', authenticate, this.getSales.bind(this));
        this.router.post('/api/sales', authenticate, this.createSale.bind(this));
        this.router.get('/api/sales/:id', authenticate, this.getSale.bind(this));

        // Reports routes
        this.router.get('/api/reports/sales', authenticate, this.getSalesReport.bind(this));
        this.router.get('/api/reports/products', authenticate, this.getProductsReport.bind(this));
        this.router.get('/api/reports/export/csv', authenticate, this.exportCSV.bind(this));
        this.router.get('/api/reports/export/xlsx', authenticate, this.exportXLSX.bind(this));
    }

    // Auth methods
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const result = await this.auth.login(email, password);
            
            if (result.success) {
                res.json(result);
            } else {
                res.status(401).json(result);
            }
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    }

    async register(req, res) {
        try {
            const { email, password, name, role } = req.body;
            const result = await this.auth.register(email, password, name, role);
            
            if (result.success) {
                res.status(201).json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    }

    async verifyToken(req, res) {
        res.json({ valid: true, user: req.user });
    }

    // Dashboard methods
    async getDashboardStats(req, res) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            // Total sales today
            const todaySales = await this.db.get(
                'SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE DATE(created_at) = ?',
                [today]
            );

            // Total sales this month
            const monthlySales = await this.db.get(
                'SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE DATE(created_at) >= ?',
                [thirtyDaysAgo]
            );

            // Total products
            const totalProducts = await this.db.get('SELECT COUNT(*) as count FROM products');

            // Low stock products (stock < 10)
            const lowStockProducts = await this.db.all(
                'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.stock < 10 ORDER BY p.stock ASC'
            );

            // Best selling products (last 30 days)
            const bestSelling = await this.db.all(`
                SELECT p.name, p.price, SUM(si.quantity) as total_sold, SUM(si.total_price) as revenue
                FROM sale_items si
                JOIN products p ON si.product_id = p.id
                JOIN sales s ON si.sale_id = s.id
                WHERE DATE(s.created_at) >= ?
                GROUP BY p.id, p.name, p.price
                ORDER BY total_sold DESC
                LIMIT 5
            `, [thirtyDaysAgo]);

            // Recent sales
            const recentSales = await this.db.all(`
                SELECT s.*, u.name as user_name
                FROM sales s
                LEFT JOIN users u ON s.user_id = u.id
                ORDER BY s.created_at DESC
                LIMIT 10
            `);

            res.json({
                todaySales: todaySales.total,
                monthlySales: monthlySales.total,
                totalProducts: totalProducts.count,
                lowStockProducts,
                bestSelling,
                recentSales
            });
        } catch (error) {
            console.error('Dashboard stats error:', error);
            res.status(500).json({ message: 'Failed to fetch dashboard stats' });
        }
    }

    // Category methods
    async getCategories(req, res) {
        try {
            const categories = await this.db.all('SELECT * FROM categories ORDER BY name');
            res.json(categories);
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch categories' });
        }
    }

    async createCategory(req, res) {
        try {
            const { name, description } = req.body;
            const result = await this.db.run(
                'INSERT INTO categories (name, description) VALUES (?, ?)',
                [name, description]
            );
            res.status(201).json({ id: result.lastID, name, description });
        } catch (error) {
            res.status(500).json({ message: 'Failed to create category' });
        }
    }

    async updateCategory(req, res) {
        try {
            const { id } = req.params;
            const { name, description } = req.body;
            await this.db.run(
                'UPDATE categories SET name = ?, description = ? WHERE id = ?',
                [name, description, id]
            );
            res.json({ id, name, description });
        } catch (error) {
            res.status(500).json({ message: 'Failed to update category' });
        }
    }

    async deleteCategory(req, res) {
        try {
            const { id } = req.params;
            await this.db.run('DELETE FROM categories WHERE id = ?', [id]);
            res.json({ message: 'Category deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Failed to delete category' });
        }
    }

    // Product methods
    async getProducts(req, res) {
        try {
            const products = await this.db.all(`
                SELECT p.*, c.name as category_name 
                FROM products p 
                LEFT JOIN categories c ON p.category_id = c.id 
                ORDER BY p.name
            `);
            res.json(products);
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch products' });
        }
    }

    async getProduct(req, res) {
        try {
            const { id } = req.params;
            const product = await this.db.get(`
                SELECT p.*, c.name as category_name 
                FROM products p 
                LEFT JOIN categories c ON p.category_id = c.id 
                WHERE p.id = ?
            `, [id]);
            
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }
            
            res.json(product);
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch product' });
        }
    }

    async createProduct(req, res) {
        try {
            const { name, description, price, stock, category_id, sku } = req.body;
            const result = await this.db.run(
                'INSERT INTO products (name, description, price, stock, category_id, sku) VALUES (?, ?, ?, ?, ?, ?)',
                [name, description, price, stock, category_id, sku]
            );
            res.status(201).json({ id: result.lastID, ...req.body });
        } catch (error) {
            res.status(500).json({ message: 'Failed to create product' });
        }
    }

    async updateProduct(req, res) {
        try {
            const { id } = req.params;
            const { name, description, price, stock, category_id, sku } = req.body;
            await this.db.run(
                'UPDATE products SET name = ?, description = ?, price = ?, stock = ?, category_id = ?, sku = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [name, description, price, stock, category_id, sku, id]
            );
            res.json({ id, ...req.body });
        } catch (error) {
            res.status(500).json({ message: 'Failed to update product' });
        }
    }

    async deleteProduct(req, res) {
        try {
            const { id } = req.params;
            await this.db.run('DELETE FROM products WHERE id = ?', [id]);
            res.json({ message: 'Product deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Failed to delete product' });
        }
    }

    // Sales methods
    async getSales(req, res) {
        try {
            const sales = await this.db.all(`
                SELECT s.*, u.name as user_name
                FROM sales s
                LEFT JOIN users u ON s.user_id = u.id
                ORDER BY s.created_at DESC
            `);
            res.json(sales);
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch sales' });
        }
    }

    async createSale(req, res) {
        try {
            const { items, payment_method = 'cash' } = req.body;
            const user_id = req.user.id;

            // Calculate total
            let total_amount = 0;
            const saleItems = [];

            for (const item of items) {
                const product = await this.db.get('SELECT * FROM products WHERE id = ?', [item.product_id]);
                
                if (!product) {
                    return res.status(400).json({ message: `Product with ID ${item.product_id} not found` });
                }

                if (product.stock < item.quantity) {
                    return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
                }

                const itemTotal = product.price * item.quantity;
                total_amount += itemTotal;
                
                saleItems.push({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: product.price,
                    total_price: itemTotal
                });
            }

            // Create sale
            const saleResult = await this.db.run(
                'INSERT INTO sales (total_amount, payment_method, user_id) VALUES (?, ?, ?)',
                [total_amount, payment_method, user_id]
            );

            const sale_id = saleResult.lastID;

            // Create sale items and update stock
            for (const item of saleItems) {
                await this.db.run(
                    'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
                    [sale_id, item.product_id, item.quantity, item.unit_price, item.total_price]
                );

                // Update product stock
                await this.db.run(
                    'UPDATE products SET stock = stock - ? WHERE id = ?',
                    [item.quantity, item.product_id]
                );
            }

            res.status(201).json({
                id: sale_id,
                total_amount,
                payment_method,
                items: saleItems
            });
        } catch (error) {
            console.error('Create sale error:', error);
            res.status(500).json({ message: 'Failed to create sale' });
        }
    }

    async getSale(req, res) {
        try {
            const { id } = req.params;
            
            const sale = await this.db.get(`
                SELECT s.*, u.name as user_name
                FROM sales s
                LEFT JOIN users u ON s.user_id = u.id
                WHERE s.id = ?
            `, [id]);

            if (!sale) {
                return res.status(404).json({ message: 'Sale not found' });
            }

            const items = await this.db.all(`
                SELECT si.*, p.name as product_name
                FROM sale_items si
                JOIN products p ON si.product_id = p.id
                WHERE si.sale_id = ?
            `, [id]);

            res.json({ ...sale, items });
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch sale' });
        }
    }

    // Reports methods
    async getSalesReport(req, res) {
        try {
            const { start_date, end_date } = req.query;
            
            let dateFilter = '';
            let params = [];
            
            if (start_date && end_date) {
                dateFilter = 'WHERE DATE(s.created_at) BETWEEN ? AND ?';
                params = [start_date, end_date];
            }

            const salesData = await this.db.all(`
                SELECT 
                    DATE(s.created_at) as date,
                    COUNT(s.id) as total_transactions,
                    SUM(s.total_amount) as total_revenue
                FROM sales s
                ${dateFilter}
                GROUP BY DATE(s.created_at)
                ORDER BY date DESC
            `, params);

            res.json(salesData);
        } catch (error) {
            res.status(500).json({ message: 'Failed to generate sales report' });
        }
    }

    async getProductsReport(req, res) {
        try {
            const productsReport = await this.db.all(`
                SELECT 
                    p.id,
                    p.name,
                    p.price,
                    p.stock,
                    c.name as category_name,
                    COALESCE(SUM(si.quantity), 0) as total_sold,
                    COALESCE(SUM(si.total_price), 0) as total_revenue
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                LEFT JOIN sale_items si ON p.id = si.product_id
                GROUP BY p.id, p.name, p.price, p.stock, c.name
                ORDER BY total_sold DESC
            `);

            res.json(productsReport);
        } catch (error) {
            res.status(500).json({ message: 'Failed to generate products report' });
        }
    }

    async exportCSV(req, res) {
        try {
            const { type = 'sales' } = req.query;
            
            let data, filename, headers;
            
            if (type === 'sales') {
                data = await this.db.all(`
                    SELECT 
                        s.id,
                        s.total_amount,
                        s.payment_method,
                        s.created_at,
                        u.name as user_name
                    FROM sales s
                    LEFT JOIN users u ON s.user_id = u.id
                    ORDER BY s.created_at DESC
                `);
                filename = 'sales_report.csv';
                headers = [
                    { id: 'id', title: 'Sale ID' },
                    { id: 'total_amount', title: 'Total Amount' },
                    { id: 'payment_method', title: 'Payment Method' },
                    { id: 'created_at', title: 'Date' },
                    { id: 'user_name', title: 'User' }
                ];
            } else {
                data = await this.db.all(`
                    SELECT 
                        p.id,
                        p.name,
                        p.price,
                        p.stock,
                        c.name as category_name,
                        COALESCE(SUM(si.quantity), 0) as total_sold
                    FROM products p
                    LEFT JOIN categories c ON p.category_id = c.id
                    LEFT JOIN sale_items si ON p.id = si.product_id
                    GROUP BY p.id
                    ORDER BY p.name
                `);
                filename = 'products_report.csv';
                headers = [
                    { id: 'id', title: 'Product ID' },
                    { id: 'name', title: 'Name' },
                    { id: 'price', title: 'Price' },
                    { id: 'stock', title: 'Stock' },
                    { id: 'category_name', title: 'Category' },
                    { id: 'total_sold', title: 'Total Sold' }
                ];
            }

            const csvWriter = createCsvWriter({
                path: path.join(__dirname, '../public', filename),
                header: headers
            });

            await csvWriter.writeRecords(data);
            
            res.download(path.join(__dirname, '../public', filename));
        } catch (error) {
            res.status(500).json({ message: 'Failed to export CSV' });
        }
    }

    async exportXLSX(req, res) {
        try {
            const { type = 'sales' } = req.query;
            
            let data, filename;
            
            if (type === 'sales') {
                data = await this.db.all(`
                    SELECT 
                        s.id as 'Sale ID',
                        s.total_amount as 'Total Amount',
                        s.payment_method as 'Payment Method',
                        s.created_at as 'Date',
                        u.name as 'User'
                    FROM sales s
                    LEFT JOIN users u ON s.user_id = u.id
                    ORDER BY s.created_at DESC
                `);
                filename = 'sales_report.xlsx';
            } else {
                data = await this.db.all(`
                    SELECT 
                        p.id as 'Product ID',
                        p.name as 'Name',
                        p.price as 'Price',
                        p.stock as 'Stock',
                        c.name as 'Category',
                        COALESCE(SUM(si.quantity), 0) as 'Total Sold'
                    FROM products p
                    LEFT JOIN categories c ON p.category_id = c.id
                    LEFT JOIN sale_items si ON p.id = si.product_id
                    GROUP BY p.id
                    ORDER BY p.name
                `);
                filename = 'products_report.xlsx';
            }

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
            
            const filepath = path.join(__dirname, '../public', filename);
            XLSX.writeFile(workbook, filepath);
            
            res.download(filepath);
        } catch (error) {
            res.status(500).json({ message: 'Failed to export XLSX' });
        }
    }

    getRouter() {
        return this.router;
    }
}

module.exports = Routes;
