#!/bin/bash

# AWS CloudFront + S3 Deployment Script
# Usage: ./deploy.sh <bucket-name> <distribution-id>

set -e

BUCKET_NAME=${1:-"your-loantube-bucket-name"}
DISTRIBUTION_ID=${2:-"your-cloudfront-distribution-id"}

if [ "$BUCKET_NAME" == "your-loantube-bucket-name" ] || [ "$DISTRIBUTION_ID" == "your-cloudfront-distribution-id" ]; then
  echo "❌ Error: Please provide bucket name and distribution ID"
  echo "Usage: ./deploy.sh <bucket-name> <distribution-id>"
  exit 1
fi

echo "🚀 Starting deployment..."
echo "📦 Bucket: $BUCKET_NAME"
echo "🌐 Distribution: $DISTRIBUTION_ID"
echo ""

# Build the application
echo "📝 Building application..."
npm run build

if [ ! -d "dist" ]; then
  echo "❌ Error: dist folder not found. Build failed."
  exit 1
fi

echo "✅ Build complete"
echo ""

# Upload static assets with long cache
echo "📤 Uploading static assets to S3..."
aws s3 sync dist/ s3://$BUCKET_NAME \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "*.html" \
  --exclude "service-worker.js" \
  --exclude "*.map"

# Upload HTML files with no cache
echo "📤 Uploading HTML files to S3..."
aws s3 sync dist/ s3://$BUCKET_NAME \
  --delete \
  --cache-control "public, max-age=0, must-revalidate" \
  --include "*.html"

echo "✅ Upload complete"
echo ""

# Invalidate CloudFront cache
echo "🔄 Invalidating CloudFront cache..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text)

echo "✅ Cache invalidation created: $INVALIDATION_ID"
echo "⏳ This may take a few minutes to complete..."
echo ""

echo "🎉 Deployment complete!"
echo "📊 Monitor invalidation status:"
echo "   aws cloudfront get-invalidation --distribution-id $DISTRIBUTION_ID --id $INVALIDATION_ID"

