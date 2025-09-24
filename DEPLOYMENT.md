# 🚀 POS System Deployment Guide

## 📦 Deployment Options

### Option 1: Manual Upload to GitHub

1. **Download the project files**:
   - Download the `POS_System_Complete.tar.gz` file
   - Extract it to your local machine

2. **Upload to GitHub**:
   ```bash
   # Navigate to extracted folder
   cd pos-system
   
   # Initialize git (if not already done)
   git init
   
   # Add your GitHub repository as remote
   git remote add origin https://github.com/BasmiKuman/POS_Koding.git
   
   # Add all files
   git add .
   
   # Commit changes
   git commit -m "Initial commit: Complete POS System"
   
   # Push to GitHub
   git push -u origin main
   ```

### Option 2: Direct Server Upload

#### Using SCP (Secure Copy)
```bash
# Upload to your server
scp -r pos-system/ user@your-server.com:/path/to/deployment/
```

#### Using FTP/SFTP
1. Use FileZilla or similar FTP client
2. Connect to your server
3. Upload the entire `pos-system` folder

### Option 3: Cloud Deployment

#### Heroku Deployment
```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create new app
heroku create your-pos-system

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-super-secret-key

# Deploy
git push heroku main
```

#### DigitalOcean App Platform
1. Connect your GitHub repository
2. Configure build settings:
   - Build Command: `npm install`
   - Run Command: `npm start`
3. Set environment variables in the dashboard

#### AWS EC2 Deployment
```bash
# Connect to your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone your repository
git clone https://github.com/BasmiKuman/POS_Koding.git
cd POS_Koding

# Install dependencies
npm install

# Install PM2 for process management
sudo npm install -g pm2

# Start the application
pm2 start server.js --name pos-system

# Setup PM2 to start on boot
pm2 startup
pm2 save
```

## 🔧 Server Configuration

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Static files caching
    location /public/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Apache Configuration
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    Redirect permanent / https://your-domain.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName your-domain.com
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /path/to/your/certificate.crt
    SSLCertificateKeyFile /path/to/your/private.key
    
    # Proxy configuration
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    # WebSocket support
    RewriteEngine on
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://localhost:3000/$1" [P,L]
</VirtualHost>
```

## 🐳 Docker Deployment

### Dockerfile
```dockerfile
FROM node:16-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  pos-system:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=your-super-secret-key
      - PORT=3000
    volumes:
      - ./database:/app/database
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - pos-system
    restart: unless-stopped
```

## 🔒 Security Checklist

- [ ] Change all default passwords
- [ ] Set strong JWT secret
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Set up regular database backups
- [ ] Enable access logging
- [ ] Configure rate limiting
- [ ] Update dependencies regularly
- [ ] Set up monitoring and alerts

## 📊 Monitoring & Maintenance

### PM2 Monitoring
```bash
# View application status
pm2 status

# View logs
pm2 logs pos-system

# Restart application
pm2 restart pos-system

# Monitor resources
pm2 monit
```

### Database Backup Script
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/path/to/backups"
DB_PATH="/path/to/pos-system/database/pos.db"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup
cp $DB_PATH $BACKUP_DIR/pos_backup_$DATE.db

# Keep only last 30 backups
find $BACKUP_DIR -name "pos_backup_*.db" -type f -mtime +30 -delete

echo "Backup completed: pos_backup_$DATE.db"
```

### Log Rotation
```bash
# Add to /etc/logrotate.d/pos-system
/path/to/pos-system/server.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 nodejs nodejs
    postrotate
        pm2 reload pos-system
    endscript
}
```

## 🆘 Troubleshooting

### Common Deployment Issues

1. **Port conflicts**: Ensure port 3000 is available
2. **Permission issues**: Check file permissions and ownership
3. **Environment variables**: Verify all required env vars are set
4. **Database access**: Ensure database directory is writable
5. **SSL certificates**: Verify certificate paths and validity

### Performance Optimization

1. **Enable gzip compression**
2. **Set up CDN for static assets**
3. **Configure database connection pooling**
4. **Implement caching strategies**
5. **Monitor and optimize queries**

## 📞 Support

For deployment assistance:
- Check server logs: `tail -f server.log`
- Review PM2 logs: `pm2 logs`
- Monitor system resources: `htop`
- Test API endpoints: `curl http://localhost:3000/api/health`
