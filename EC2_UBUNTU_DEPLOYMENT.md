# EC2 Ubuntu Deployment Guide

This guide walks you through deploying the LoanTube B2C application on an AWS EC2 Ubuntu instance.

## Prerequisites

- AWS EC2 Ubuntu instance (Ubuntu 20.04 LTS or 22.04 LTS recommended)
- SSH access to your EC2 instance
- Security group configured to allow:
  - SSH (port 22) from your IP
  - HTTP (port 80) from anywhere (0.0.0.0/0)
  - HTTPS (port 443) from anywhere (0.0.0.0/0)

## Step 1: Connect to Your EC2 Instance

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip-address
```

Replace:
- `your-key.pem` with your EC2 key pair file
- `your-ec2-ip-address` with your EC2 instance's public IP or DNS

## Step 2: Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

## Step 3: Install Node.js and npm

### Option A: Install Node.js 18.x (Recommended)

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### Option B: Install Node.js 20.x

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### Option C: Install via nvm (Node Version Manager)

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell
source ~/.bashrc

# Install Node.js
nvm install 18
nvm use 18
```

## Step 4: Install Git

```bash
sudo apt install -y git
```

## Step 5: Clone or Upload Your Application

### Option A: Clone from GitHub

```bash
cd /var/www
sudo git clone https://github.com/your-username/your-repo.git loantube-app
sudo chown -R ubuntu:ubuntu loantube-app
cd loantube-app
```

### Option B: Upload via SCP

On your local machine:
```bash
# Compress the project (excluding node_modules)
tar -czf loantube-app.tar.gz --exclude='node_modules' --exclude='dist' loantube-white-lable-main/

# Upload to EC2
scp -i your-key.pem loantube-app.tar.gz ubuntu@your-ec2-ip:/home/ubuntu/

# On EC2, extract
ssh -i your-key.pem ubuntu@your-ec2-ip
cd /var/www
sudo mkdir loantube-app
sudo chown ubuntu:ubuntu loantube-app
cd ~
tar -xzf loantube-app.tar.gz -C /var/www/loantube-app --strip-components=1
```

## Step 6: Install Application Dependencies

```bash
cd /var/www/loantube-app
npm install
```

## Step 7: Create Environment Variables File

```bash
cd /var/www/loantube-app
nano .env
```

Add your environment variables:
```bash
VITE_API_BASE_URL=https://your-api-url.com
VITE_API_BACKEND_URL=https://www.loantube.com/validate/recaptcha-backend.php
VITE_RECAPTCHA_V3_SITE_KEY=your-recaptcha-v3-key
VITE_RECAPTCHA_V2_SITE_KEY=your-recaptcha-v2-key
VITE_SUPABASE_URL=https://your-supabase-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_EMAIL_TOKEN_API_URL=https://www.emailvalidation.xyz/token.php
VITE_EMAIL_VALIDATION_API_URL=https://www.emailvalidation.xyz/validate.php
VITE_MASTER_OTP=0000
VITE_LEADS_API_URL=https://sample.loantube.com/api/leads
VITE_BACKEND_BASE_URL=https://sample.loantube.com
```

Save and exit (Ctrl+X, then Y, then Enter)

## Step 8: Build the Application

```bash
cd /var/www/loantube-app
npm run build
```

This creates a `dist/` folder with production-ready files.

## Step 9: Install and Configure Nginx

### Install Nginx

```bash
sudo apt install -y nginx
```

### Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/loantube-app
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # If using IP address only, use:
    # server_name _;

    root /var/www/loantube-app/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # SPA routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Don't cache HTML files
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
    }
}
```

Save and exit.

### Enable the Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/loantube-app /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

## Step 10: Set Proper Permissions

```bash
# Set ownership
sudo chown -R ubuntu:www-data /var/www/loantube-app

# Set directory permissions
sudo chmod -R 755 /var/www/loantube-app

# Set file permissions for dist folder
sudo chmod -R 644 /var/www/loantube-app/dist/*
sudo find /var/www/loantube-app/dist -type d -exec chmod 755 {} \;
```

## Step 11: Configure Firewall (UFW)

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Step 12: Set Up SSL/HTTPS with Let's Encrypt (Optional but Recommended)

### Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Obtain SSL Certificate

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Follow the prompts. Certbot will automatically configure Nginx for HTTPS.

### Auto-renewal (Already configured by Certbot)

Certbot sets up automatic renewal. Test it:
```bash
sudo certbot renew --dry-run
```

## Step 13: Test Your Application

1. **If using domain name:**
   - Visit: `http://your-domain.com` or `https://your-domain.com`

2. **If using IP address:**
   - Visit: `http://your-ec2-ip-address`

3. **Check Nginx logs if issues:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   sudo tail -f /var/log/nginx/access.log
   ```

## Step 14: Set Up Auto-Deployment (Optional)

### Create Deployment Script

```bash
cd /var/www/loantube-app
nano deploy.sh
```

Add:
```bash
#!/bin/bash
set -e

cd /var/www/loantube-app

echo "Pulling latest changes..."
git pull origin main

echo "Installing dependencies..."
npm install

echo "Building application..."
npm run build

echo "Restarting Nginx..."
sudo systemctl restart nginx

echo "Deployment complete!"
```

Make it executable:
```bash
chmod +x deploy.sh
```

## Step 15: Set Up Process Manager (PM2) - Optional

If you need to run any Node.js processes (like a backend API):

```bash
# Install PM2
sudo npm install -g pm2

# Start your app (if you have a Node.js server)
pm2 start your-server.js --name loantube-api

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
# Follow the instructions it provides
```

## Troubleshooting

### Application not loading

1. **Check Nginx status:**
   ```bash
   sudo systemctl status nginx
   ```

2. **Check Nginx error logs:**
   ```bash
   sudo tail -50 /var/log/nginx/error.log
   ```

3. **Verify dist folder exists:**
   ```bash
   ls -la /var/www/loantube-app/dist/
   ```

4. **Check file permissions:**
   ```bash
   ls -la /var/www/loantube-app/dist/index.html
   ```

### 404 errors on routes

Ensure your Nginx config has:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Permission denied errors

```bash
sudo chown -R ubuntu:www-data /var/www/loantube-app
sudo chmod -R 755 /var/www/loantube-app
```

### Port 80 already in use

```bash
# Check what's using port 80
sudo lsof -i :80

# Stop Apache if it's running
sudo systemctl stop apache2
sudo systemctl disable apache2
```

## Updating the Application

### Manual Update

```bash
cd /var/www/loantube-app

# Pull latest code (if using Git)
git pull origin main

# Or upload new files via SCP

# Install dependencies (if package.json changed)
npm install

# Rebuild
npm run build

# Restart Nginx
sudo systemctl restart nginx
```

### Using Deployment Script

```bash
cd /var/www/loantube-app
./deploy.sh
```

## Security Best Practices

1. **Keep system updated:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Configure fail2ban (optional):**
   ```bash
   sudo apt install -y fail2ban
   sudo systemctl enable fail2ban
   ```

3. **Set up automatic security updates:**
   ```bash
   sudo apt install -y unattended-upgrades
   sudo dpkg-reconfigure -plow unattended-upgrades
   ```

4. **Use SSH keys only (disable password auth):**
   Edit `/etc/ssh/sshd_config`:
   ```
   PasswordAuthentication no
   ```
   Then restart: `sudo systemctl restart sshd`

5. **Regular backups:**
   - Backup `/var/www/loantube-app` folder
   - Backup Nginx configuration: `/etc/nginx/sites-available/loantube-app`

## Monitoring

### Check Nginx status
```bash
sudo systemctl status nginx
```

### Check disk space
```bash
df -h
```

### Check memory usage
```bash
free -h
```

### Monitor application logs
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Cost Optimization

- Use EC2 t3.micro or t3.small for small applications (eligible for free tier)
- Set up CloudWatch alarms for monitoring
- Use Elastic IP if you need a static IP
- Consider using AWS Application Load Balancer for high availability

## Next Steps

1. Set up a custom domain name
2. Configure CloudWatch for monitoring
3. Set up automated backups
4. Configure CDN (CloudFront) for better performance
5. Set up CI/CD pipeline for automatic deployments

