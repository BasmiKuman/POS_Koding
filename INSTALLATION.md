# POS System Installation Guide

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager
- Git (for version control)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/BasmiKuman/POS_Koding.git
cd POS_Koding
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your configuration
nano .env
```

### 4. Initialize Database
The database will be automatically created when you first run the server.

### 5. Start the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 6. Access the Application
- **Web Interface**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api

## 👥 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@pos.com | admin123 |
| Manager | manager@pos.com | manager123 |
| Cashier | cashier1@pos.com | cashier123 |

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment mode | development |
| `DB_PATH` | Database file path | ./database/pos.db |
| `JWT_SECRET` | JWT signing secret | (required) |
| `JWT_EXPIRES_IN` | JWT expiration time | 24h |

### Database Configuration

The system uses SQLite by default. The database file will be created automatically in the `database/` directory.

## 📱 Mobile PWA Setup

The system includes a Progressive Web App (PWA) that can be installed on mobile devices:

1. Open the web interface on your mobile device
2. Look for the "Install App" prompt
3. Follow the installation instructions
4. The app will be available on your home screen

## 🌐 Deployment

### Production Deployment

1. **Set Environment Variables**:
   ```bash
   export NODE_ENV=production
   export JWT_SECRET=your-production-secret
   export PORT=80
   ```

2. **Install PM2 (Process Manager)**:
   ```bash
   npm install -g pm2
   ```

3. **Start with PM2**:
   ```bash
   pm2 start server.js --name "pos-system"
   pm2 startup
   pm2 save
   ```

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔒 Security Considerations

1. **Change Default Passwords**: Update all default user passwords
2. **JWT Secret**: Use a strong, unique JWT secret in production
3. **HTTPS**: Always use HTTPS in production
4. **Database Backup**: Regularly backup your database
5. **Updates**: Keep dependencies updated

## 🛠️ Development

### Project Structure
```
pos-system/
├── backend/           # Backend API logic
├── frontend/          # Frontend web interface
├── public/           # Static assets
├── database/         # Database files
├── server.js         # Main server file
└── package.json      # Dependencies
```

### Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server
npm test           # Run tests
npm run backup     # Backup database
```

## 📊 Features

- ✅ Multi-user authentication (Admin/Manager/Cashier)
- ✅ Product management with categories
- ✅ Sales transactions and POS interface
- ✅ Comprehensive reporting and analytics
- ✅ User management for administrators
- ✅ Real-time dashboard with statistics
- ✅ Mobile-responsive design
- ✅ Progressive Web App (PWA) support
- ✅ Offline functionality
- ✅ Data export (CSV/Excel)
- ✅ Role-based access control

## 🆘 Troubleshooting

### Common Issues

1. **Port Already in Use**:
   ```bash
   # Find process using port 3000
   lsof -i :3000
   # Kill the process
   kill -9 <PID>
   ```

2. **Database Connection Error**:
   - Check if the database directory exists
   - Verify file permissions
   - Ensure SQLite is properly installed

3. **JWT Token Issues**:
   - Verify JWT_SECRET is set
   - Check token expiration settings
   - Clear browser localStorage

### Getting Help

- Check the [Issues](https://github.com/BasmiKuman/POS_Koding/issues) page
- Review the server logs in `server.log`
- Enable debug mode: `DEBUG=* npm start`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
