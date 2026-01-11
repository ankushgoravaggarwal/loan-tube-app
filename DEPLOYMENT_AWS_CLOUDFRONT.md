# AWS CloudFront + S3 Deployment Guide

## Overview
This is a **Vite + React SPA** that can be deployed to AWS CloudFront + S3. Since it uses client-side routing (React Router), we need to configure CloudFront to handle SPA routing properly.

## Prerequisites
- AWS CLI installed and configured
- AWS account with S3 and CloudFront access
- Node.js and npm installed

## Step 1: Build the Application

```bash
npm run build
```

This creates a `dist/` folder with all static files ready for deployment.

## Step 2: Create S3 Bucket

```bash
# Create bucket (replace with your bucket name)
aws s3 mb s3://your-loantube-bucket-name

# Enable static website hosting (optional, but useful for testing)
aws s3 website s3://your-loantube-bucket-name \
  --index-document index.html \
  --error-document index.html
```

## Step 3: Upload Build Files to S3

```bash
# Upload dist folder contents to S3
aws s3 sync dist/ s3://your-loantube-bucket-name \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "*.html" \
  --exclude "service-worker.js"

# Upload HTML files with shorter cache
aws s3 sync dist/ s3://your-loantube-bucket-name \
  --delete \
  --cache-control "public, max-age=0, must-revalidate" \
  --include "*.html"
```

## Step 4: Create CloudFront Distribution

### Option A: Using AWS Console

1. Go to CloudFront Console
2. Create Distribution
3. **Origin Settings:**
   - Origin Domain: Select your S3 bucket
   - Origin Access: Choose "Origin Access Control (OAC)" or "Origin Access Identity (OAI)"
   - Origin Path: (leave empty)

4. **Default Cache Behavior:**
   - Viewer Protocol Policy: Redirect HTTP to HTTPS
   - Allowed HTTP Methods: GET, HEAD, OPTIONS
   - Cache Policy: CachingOptimized
   - Origin Request Policy: None (or CORS-S3Origin if needed)

5. **Error Pages (CRITICAL for SPA routing):**
   - Create Custom Error Response for HTTP 403
     - HTTP Error Code: 403
     - Customize Error Response: Yes
     - Response Page Path: `/index.html`
     - HTTP Response Code: 200
   - Create Custom Error Response for HTTP 404
     - HTTP Error Code: 404
     - Customize Error Response: Yes
     - Response Page Path: `/index.html`
     - HTTP Response Code: 200

6. **Settings:**
   - Default Root Object: `index.html`
   - Price Class: Choose based on your needs
   - Alternate Domain Names (CNAMEs): Add your custom domain if you have one
   - SSL Certificate: Request or import certificate for HTTPS

### Option B: Using CloudFront Functions (Better for SPA)

Instead of error pages, you can use CloudFront Functions:

1. Create a CloudFront Function:
   - Function Name: `spa-routing`
   - Runtime: CloudFront Functions
   - Code:
   ```javascript
   function handler(event) {
       var request = event.request;
       var uri = request.uri;
       
       // Check if the URI is a file (has extension)
       if (uri.includes('.')) {
           return request;
       }
       
       // For all other requests, serve index.html
       request.uri = '/index.html';
       return request;
   }
   ```

2. Associate the function with your distribution:
   - Go to your CloudFront distribution
   - Edit Behaviors
   - Under "CloudFront Functions", select your function for "Viewer Request"

## Step 5: Update S3 Bucket Policy

After creating CloudFront with OAC/OAI, update your S3 bucket policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-loantube-bucket-name/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::YOUR_ACCOUNT_ID:distribution/YOUR_DISTRIBUTION_ID"
        }
      }
    }
  ]
}
```

## Step 6: Environment Variables

Since this is a static site, environment variables need to be set at build time. Update your `.env` file before building:

```bash
# .env.production
VITE_API_BASE_URL=https://your-api-url.com
VITE_LEADS_API_URL=https://your-leads-api.com
# ... other environment variables
```

Then build:
```bash
npm run build
```

## Step 7: Automated Deployment Script

Create a deployment script `deploy.sh`:

```bash
#!/bin/bash

BUCKET_NAME="your-loantube-bucket-name"
DISTRIBUTION_ID="your-cloudfront-distribution-id"

echo "Building application..."
npm run build

echo "Uploading to S3..."
aws s3 sync dist/ s3://$BUCKET_NAME \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "*.html"

aws s3 sync dist/ s3://$BUCKET_NAME \
  --delete \
  --cache-control "public, max-age=0, must-revalidate" \
  --include "*.html"

echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"

echo "Deployment complete!"
```

Make it executable:
```bash
chmod +x deploy.sh
```

## Important Notes

1. **SPA Routing**: The critical part is configuring CloudFront to return `index.html` for all routes. Use either:
   - Custom Error Pages (403/404 → index.html)
   - CloudFront Functions (recommended)

2. **Caching**: 
   - Static assets (JS, CSS, images) should have long cache times
   - HTML files should have short/no cache to ensure updates are picked up

3. **HTTPS**: Always use HTTPS for production

4. **CORS**: If your API is on a different domain, ensure CORS is properly configured

5. **Environment Variables**: All `VITE_*` variables are embedded at build time, so rebuild when changing them

## Cost Considerations

- S3: Very cheap for static hosting (~$0.023 per GB storage)
- CloudFront: Pay per request and data transfer
- Free tier: 1TB data transfer out per month for first 12 months

## Alternative: AWS Amplify

For easier deployment, consider AWS Amplify which handles SPA routing automatically:
- Connect your GitHub repository
- Amplify auto-detects Vite/React
- Automatic deployments on git push
- Built-in CI/CD

