# POS System - Point of Sale Application

A comprehensive Point of Sale (POS) system built with Node.js, Express, SQLite, and vanilla JavaScript. This system provides complete functionality for managing products, processing sales transactions, and generating detailed reports.

## 🚀 Features

### Core Functionality
- **Product Management**: Full CRUD operations for products and categories
- **Sales Transactions**: Interactive POS interface with cart management
- **User Authentication**: Secure login/logout with JWT tokens
- **Dashboard**: Real-time sales overview and analytics
- **Reports & Analytics**: Comprehensive reporting with export capabilities

### Key Capabilities
- ✅ Product inventory management with stock tracking
- ✅ Category-based product organization
- ✅ Real-time sales processing with automatic stock reduction
- ✅ Receipt generation and printing
- ✅ Sales history and transaction tracking
- ✅ Low stock alerts and inventory monitoring
- ✅ Data export to CSV and Excel formats
- ✅ Responsive design for desktop and mobile
- ✅ Secure authentication system

## 🛠️ Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: SQLite (lightweight, file-based)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Styling**: Custom CSS with Inter font
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, Rate limiting
- **Export**: CSV and XLSX file generation

## 📋 Prerequisites

- Node.js (version 14.0.0 or higher)
- npm (Node Package Manager)

## 🚀 Quick Start

### 1. Installation

```bash
# Clone or download the project
cd pos-system

# Install dependencies
npm install
```

### 2. Configuration

The system comes with default configuration in `.env` file:

```env
PORT=3000
NODE_ENV=development
DB_PATH=./database/pos.db
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
ADMIN_EMAIL=admin@pos.com
ADMIN_PASSWORD=admin123
```

**Important**: Change the `JWT_SECRET` in production!

### 3. Start the Application

```bash
# Start the server
npm start
```

The application will be available at:
- **Main Application**: http://localhost:3000
- **Login Page**: http://localhost:3000/ (redirects here if not authenticated)
- **Dashboard**: http://localhost:3000/dashboard

### 4. Default Login Credentials

```
Email: admin@pos.com
Password: admin123
```

## 📁 Project Structure

```
pos-system/
├── backend/
│   ├── database.js      # Database connection and schema
│   ├── auth.js          # Authentication service
│   └── routes.js        # API routes and controllers
├── frontend/
│   ├── login.html       # Login page
│   ├── dashboard.html   # Main dashboard
│   ├── products.html    # Product management
│   ├── transactions.html # POS interface
│   └── reports.html     # Reports and analytics
├── public/
│   ├── css/
│   │   └── styles.css   # Main stylesheet
│   └── js/
│       ├── auth.js      # Authentication client
│       └── api.js       # API client and utilities
├── database/
│   └── pos.db          # SQLite database (auto-created)
├── server.js           # Main server file
├── package.json        # Dependencies and scripts
├── .env               # Environment configuration
└── README.md          # This file
```

## 🎯 Usage Guide

### Dashboard
- View today's and monthly sales
- Monitor low stock alerts
- See best-selling products
- Track recent transactions

### Product Management
- Add, edit, and delete products
- Organize products by categories
- Manage inventory levels
- Set pricing and SKU codes
- Filter and search products

### Point of Sale (Transactions)
- Add products to cart
- Adjust quantities
- Calculate totals with tax
- Process payments (Cash, Card, Digital)
- Generate receipts
- View sales history

### Reports & Analytics
- Sales performance over time
- Product performance ranking
- Inventory status monitoring
- Export data to CSV/Excel
- Filter reports by date range

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify` - Token verification

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Sales
- `GET /api/sales` - Get all sales
- `GET /api/sales/:id` - Get single sale
- `POST /api/sales` - Create new sale

### Reports
- `GET /api/reports/sales` - Sales report
- `GET /api/reports/products` - Products report
- `GET /api/reports/export/csv` - Export CSV
- `GET /api/reports/export/xlsx` - Export Excel

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS protection
- Helmet security headers
- Input validation and sanitization

## 📊 Database Schema

The system uses SQLite with the following main tables:

- **users**: User accounts and authentication
- **categories**: Product categories
- **products**: Product inventory
- **sales**: Sales transactions
- **sale_items**: Individual items in each sale

## 🎨 UI/UX Features

- Clean, modern interface inspired by Apple/Linear design
- Responsive design for all screen sizes
- Inter font for optimal readability
- Consistent color scheme and spacing
- Intuitive navigation and workflows
- Real-time updates and feedback

## 🚀 Production Deployment

For production deployment:

1. **Environment Variables**:
   ```bash
   NODE_ENV=production
   JWT_SECRET=your-secure-random-secret-key
   PORT=3000
   ```

2. **Database**: The SQLite database will be created automatically

3. **Process Management**: Consider using PM2 or similar:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "pos-system"
   ```

4. **Reverse Proxy**: Use Nginx or Apache for production serving

## 🔧 Customization

### Adding New Features
- Extend the API routes in `backend/routes.js`
- Add new frontend pages in the `frontend/` directory
- Update the database schema in `backend/database.js`

### Styling Changes
- Modify `public/css/styles.css` for visual updates
- Update CSS variables for color scheme changes
- Add new components following the existing design system

### Database Changes
- Update the schema in `backend/database.js`
- Add migration logic for existing data
- Test thoroughly before deploying changes

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support or questions:
- Check the documentation above
- Review the code comments
- Test with the provided sample data

## 🎉 Acknowledgments

- Built with modern web technologies
- Inspired by clean, minimal design principles
- Focused on usability and performance
