# Manual S3 Upload Guide - AWS Console

This guide walks you through manually uploading your built application to AWS S3 using the AWS Console web interface.

## Prerequisites
- AWS account with S3 access
- Built application in the `dist/` folder (already done ✅)

## Step 1: Create S3 Bucket

1. **Go to AWS Console**
   - Navigate to https://console.aws.amazon.com/
   - Sign in to your AWS account

2. **Open S3 Service**
   - Search for "S3" in the services search bar
   - Click on "S3" service

3. **Create New Bucket**
   - Click the **"Create bucket"** button
   - **Bucket name**: Enter a unique name (e.g., `loantube-b2c-app`)
     - Must be globally unique across all AWS accounts
     - Use lowercase letters, numbers, and hyphens only
   - **AWS Region**: Choose your preferred region (e.g., `us-east-1`, `eu-west-2`)
   - **Object Ownership**: Keep default (ACLs disabled)
   - **Block Public Access settings**: 
     - **✅ KEEP ALL CHECKED** (Block all public access) - **IMPORTANT!**
     - We'll use CloudFront with Origin Access Control, so the bucket should NOT be public
     - This is more secure - only CloudFront can access the bucket
   - **Bucket Versioning**: Disable (optional, for simplicity)
   - **Default encryption**: Enable (recommended)
   - Click **"Create bucket"**

## Step 2: Upload Files (Skip Static Website Hosting if Using CloudFront)

> **Note**: If you're using CloudFront (recommended), you can skip static website hosting. CloudFront will access the bucket directly via Origin Access Control.

1. **Select Your Bucket**
   - Click on the bucket name you just created

2. **Upload Files**
   - Click **"Upload"** button
   - Upload `index.html` and all files from `dist/assets/` folder
   - (See Step 3 below for detailed upload instructions)

### Alternative: If NOT Using CloudFront (Direct S3 Website)

If you want to use S3 static website hosting directly (without CloudFront):

1. **Enable Static Website Hosting**
   - Go to **"Properties"** tab
   - Scroll to **"Static website hosting"**
   - Click **"Edit"**
   - Select **"Enable"**
   - **Index document**: Enter `index.html`
   - **Error document**: Enter `index.html`
   - Click **"Save changes"**

2. **Unblock Public Access** (Only if NOT using CloudFront)
   - Go to **"Permissions"** tab
   - Click **"Edit"** on "Block public access"
   - **Uncheck** all boxes
   - Acknowledge the warning

3. **Set Bucket Policy** (Only if NOT using CloudFront)
   - Go to **"Permissions"** tab → **"Bucket policy"** → **"Edit"**
   - Paste this policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
       }
     ]
   }
   ```
   - Click **"Save changes"**

> **⚠️ Security Note**: Making S3 bucket public is less secure. Using CloudFront with Origin Access Control is the recommended approach.

## Step 3: Upload Files from dist/ Folder

### Option A: Upload via AWS Console (Web Interface)

1. **Navigate to Your Bucket**
   - Click on your bucket name
   - You should see an empty bucket

2. **Upload All Files Maintaining Root Directory Structure**
   
   > **IMPORTANT**: Upload files to maintain the exact same structure as in your `dist/` folder. The root of `dist/` becomes the root of your S3 bucket.
   
   **Option A: Upload Everything at Once (Recommended)**
   - Click **"Upload"** button
   - Click **"Add files"** or drag and drop
   - Navigate to your project's `dist/` folder
   - **Select ALL files and folders**:
     - Select `index.html` (at the root of `dist/`)
     - Select the entire `assets/` folder (maintain folder structure)
   - Click **"Upload"**
   - ✅ This will create the same structure in S3:
     ```
     S3 Bucket Root:
     ├── index.html
     └── assets/
         ├── (all your JS, CSS, and other files)
     ```
   
   **Option B: Upload Separately (If Option A doesn't work)**
   
   a. **Upload index.html to Root:**
      - Click **"Upload"** button
      - Click **"Add files"**
      - Navigate to your project's `dist/` folder
      - Select `index.html`
      - **Make sure it uploads to the root** (not in a subfolder)
      - Click **"Upload"**
   
   b. **Upload assets/ Folder to Root:**
      - Click **"Upload"** again
      - Click **"Add files"**
      - Navigate to `dist/assets/` folder
      - **Select ALL files** in the assets folder (Ctrl+A / Cmd+A)
      - **IMPORTANT**: When uploading, ensure the files go into an `assets/` folder at the root
      - In the upload dialog, you can see the destination path
      - If needed, manually create the `assets/` folder structure in S3 first
      - Click **"Upload"**
   
   c. **Verify Structure:**
      - After uploading, your S3 bucket should look like this:
      ```
      S3 Bucket (Root Level):
      ├── index.html          ← At root
      └── assets/             ← Folder at root
          ├── file1.js
          ├── file2.css
          └── (all other files)
      ```
      - **NOT like this** (wrong):
      ```
      S3 Bucket:
      ├── dist/
      │   ├── index.html      ← WRONG! Should be at root
      │   └── assets/         ← WRONG! Should be at root
      ```

3. **Upload public/ Folder Contents (if any)**
   - If you have files in `public/` folder (like images, fonts, etc.)
   - Upload them maintaining the same folder structure at the root
   - For example, if you have `public/assets/lenders/logo.png`, upload it to `assets/lenders/logo.png` at the root of S3
   - The `public/` folder contents should be merged into the root structure

### Option B: Upload via AWS CLI (Faster for Large Files)

If you have AWS CLI installed:

```bash
# Upload all files from dist/ to S3
aws s3 sync dist/ s3://YOUR-BUCKET-NAME --delete

# Set proper cache headers
aws s3 sync dist/ s3://YOUR-BUCKET-NAME \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "*.html"

aws s3 sync dist/ s3://YOUR-BUCKET-NAME \
  --delete \
  --cache-control "public, max-age=0, must-revalidate" \
  --include "*.html"
```

## Step 4: Verify Upload

1. **Check Files in Bucket**
   - In your S3 bucket, you should see:
     - `index.html` at the root
     - `assets/` folder with all your JS, CSS, and other files

2. **Test Website** (After CloudFront Setup)
   - If using CloudFront: Use the CloudFront URL (see Step 5)
   - If using S3 directly: Go to Properties → Static website hosting → Click website endpoint URL

## Step 5: Set Up CloudFront Distribution (Recommended for Production)

### Why CloudFront?
- ✅ HTTPS/SSL support (secure connections)
- ✅ Better performance (global CDN)
- ✅ Custom domain support
- ✅ Better caching (faster load times)
- ✅ DDoS protection
- ✅ Keeps S3 bucket private (more secure)

---

### Detailed Step-by-Step CloudFront Setup:

#### 5.1: Navigate to CloudFront

1. **Go to AWS Console**
   - Navigate to https://console.aws.amazon.com/
   - Make sure you're in the same region where you created your S3 bucket

2. **Open CloudFront Service**
   - In the top search bar, type **"CloudFront"**
   - Click on **"CloudFront"** service
   - You'll see the CloudFront dashboard

#### 5.2: Create Distribution

1. **Start Creating Distribution**
   - Click the orange **"Create distribution"** button at the top right

2. **Origin Settings Section** (First Section)
   
   **a. Origin Domain:**
   - Click the dropdown under **"Origin domain"**
   - **IMPORTANT**: Select your S3 bucket from the list
     - It will show as: `YOUR-BUCKET-NAME.s3.REGION.amazonaws.com`
     - Do NOT select the website endpoint (the one with `s3-website`)
   - Example: `sample-offers.s3.us-east-1.amazonaws.com`
   
   **b. Origin Path:**
   - **Leave this EMPTY** ✅
   - **Do NOT enter `index.html` here** ❌
   - This field is only for subfolders (e.g., if files were in `dist/` folder, you'd enter `/dist`)
   - Since we uploaded files to the root of S3 bucket, leave it blank
   
   **c. Name:**
   - This will auto-fill based on your bucket name
   - You can leave it as is or customize it
   
   **d. Origin Access (CRITICAL):**
   - **IMPORTANT**: Select **"Origin Access Control settings (recommended)"**
   - **Do NOT select "Public"** (this would require making your bucket public, which is less secure)
   - Click **"Create control setting"** button (opens a modal)
   
   **e. Create Origin Access Control (OAC):**
   - **Name**: Enter `loantube-oac` (or any name you prefer)
   - **Description**: Optional (e.g., "OAC for LoanTube S3 bucket")
   - **Signing behavior**: Select **"Sign requests (recommended)"**
   - **Origin type**: Should show "S3"
   - Click **"Create"** button
   - You'll be taken back to the distribution form
   - **Origin access control**: Select the OAC you just created from the dropdown
   
   **f. Origin Shield:**
   - Leave **disabled** (optional, for advanced use)

#### 5.3: Default Cache Behavior Settings

Scroll down to **"Default cache behavior"** section:

1. **Viewer Protocol Policy:**
   - Select **"Redirect HTTP to HTTPS"**
   - This ensures all traffic uses secure HTTPS

2. **Allowed HTTP Methods:**
   - Select **"GET, HEAD, OPTIONS"**
   - This is sufficient for a static website

3. **Cache Policy:**
   - Select **"CachingOptimized"** from the dropdown
   - This provides good caching for static content

4. **Origin Request Policy:**
   - Select **"None"** (or "CORS-S3Origin" if you need CORS)

5. **Response Headers Policy:**
   - Leave as **"None"** (or add if you need custom headers)

6. **Compress Objects Automatically:**
   - ✅ **Enable** this (reduces file sizes, faster loading)

#### 5.4: Custom Error Responses (CRITICAL for SPA!)

This is essential for React Router to work properly:

1. **First Error Response (403):**
   - Scroll to **"Custom error responses"** section
   - Click **"Create custom error response"** button
   - **HTTP error code**: Select `403: Forbidden`
   - **Customize error response**: Toggle to **"Yes"**
   - **Response page path**: Enter `/index.html`
   - **HTTP response code**: Select `200: OK`
   - **Error caching minimum TTL**: Leave default (300)
   - Click **"Create custom error response"**

2. **Second Error Response (404):**
   - Click **"Create custom error response"** again
   - **HTTP error code**: Select `404: Not Found`
   - **Customize error response**: Toggle to **"Yes"**
   - **Response page path**: Enter `/index.html`
   - **HTTP response code**: Select `200: OK`
   - **Error caching minimum TTL**: Leave default (300)
   - Click **"Create custom error response"**

> **Why this is important**: When users navigate to routes like `/offerpage` or refresh the page, CloudFront will return `index.html` instead of a 404 error, allowing React Router to handle the routing.

#### 5.5: Distribution Settings

Scroll to **"Distribution settings"** section:

1. **Price Class:**
   - Select based on your needs:
     - **Use all edge locations (best performance)**: Most expensive
     - **Use only North America and Europe**: Middle option
     - **Use only North America**: Cheapest (if your users are only in NA)

2. **Alternate Domain Names (CNAMEs):**
   - Leave empty for now (you can add your custom domain later)
   - Example: If you want `app.yourdomain.com`, add it here

3. **SSL Certificate:**
   - **Default CloudFront certificate**: Select this (free, works with `*.cloudfront.net`)
   - **Custom SSL certificate**: Only if you're using a custom domain

4. **Default Root Object (IMPORTANT!):**
   - Enter `index.html` ✅ (without the leading slash `/`)
   - **Do NOT enter `/index.html`** ❌ (no leading slash needed)
   - **This is where you specify `index.html`** - NOT in the Origin path!
   - This tells CloudFront to serve `index.html` when someone visits the root URL (`/`)
   - Example: When user visits `https://d31r2j5y872jl3.cloudfront.net/`, CloudFront will serve `index.html`
   - **Correct format**: `index.html`
   - **Wrong format**: `/index.html` (don't use leading slash)

5. **Logging:**
   - Leave **disabled** (optional, for debugging)

6. **Comment:**
   - Optional: Add a description like "LoanTube B2C Application"

7. **Web Application Firewall (WAF):**
   - Leave **disabled** (optional, for advanced security)

#### 5.6: Create the Distribution

1. **Review Settings:**
   - Scroll to the bottom
   - Review all your settings

2. **Create Distribution:**
   - Click the orange **"Create distribution"** button at the bottom
   - You'll see: "Creating distribution..."
   - **Wait 5-15 minutes** for the distribution to deploy
   - Status will change from "In Progress" to "Deployed"

3. **Note Your Distribution Details:**
   - Once created, you'll see your distribution in the list
   - **Distribution ID**: Note this down (e.g., `E1234567890ABC`)
   - **Domain name**: This is your CloudFront URL (e.g., `d1234567890abc.cloudfront.net`)
   - **Status**: Wait until it shows "Deployed" (green checkmark)

#### 5.7: Update S3 Bucket Policy (CRITICAL STEP!)

After CloudFront is created, you MUST update your S3 bucket policy to allow CloudFront access:

1. **Get Your Distribution Details:**
   - In CloudFront console, click on your distribution
   - **Distribution ID**: Copy this (e.g., `E1234567890ABC`)
   - **ARN**: You can also copy the full ARN from the "General" tab
     - Format: `arn:aws:cloudfront::ACCOUNT-ID:distribution/DISTRIBUTION-ID`

2. **Get Your AWS Account ID:**
   - Click on your username in the top-right corner of AWS Console
   - Your 12-digit Account ID is shown there
   - Copy it

3. **Update S3 Bucket Policy:**
   - Go back to **S3** service
   - Click on your bucket name
   - Go to **"Permissions"** tab
   - Scroll to **"Bucket policy"**
   - Click **"Edit"** button

4. **Add/Replace Bucket Policy:**
   - Delete any existing policy
   - Paste this policy (replace the placeholders):
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
         "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*",
         "Condition": {
           "StringEquals": {
             "AWS:SourceArn": "arn:aws:cloudfront::YOUR-ACCOUNT-ID:distribution/YOUR-DISTRIBUTION-ID"
           }
         }
       }
     ]
   }
   ```
   
   **Replace these values:**
   - `YOUR-BUCKET-NAME`: Your S3 bucket name (e.g., `loantube-b2c-app`)
   - `YOUR-ACCOUNT-ID`: Your 12-digit AWS account ID
   - `YOUR-DISTRIBUTION-ID`: Your CloudFront distribution ID (e.g., `E1234567890ABC`)

5. **Example Policy:**
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
         "Resource": "arn:aws:s3:::loantube-b2c-app/*",
         "Condition": {
           "StringEquals": {
             "AWS:SourceArn": "arn:aws:cloudfront::123456789012:distribution/E1234567890ABC"
           }
         }
       }
     ]
   }
   ```

6. **Save Policy:**
   - Click **"Save changes"**
   - You should see a green success message
   - ✅ **Your bucket remains private** - only CloudFront can access it!

#### 5.8: Verify CloudFront is Working

1. **Wait for Deployment:**
   - Go back to CloudFront console
   - Check that your distribution status is **"Deployed"** (green)
   - This can take 5-15 minutes

2. **Test Your Application:**
   - Copy your **CloudFront domain name** (e.g., `d1234567890abc.cloudfront.net`)
   - Open it in a new browser tab
   - Your application should load!
   - Try navigating to different routes (they should all work)

3. **Test HTTPS:**
   - Make sure the URL starts with `https://`
   - The browser should show a secure lock icon

---

### Quick Reference: Where to Find Values

- **Distribution ID**: CloudFront console → Your distribution → General tab
- **Distribution ARN**: CloudFront console → Your distribution → General tab → ARN
- **Account ID**: Top-right corner → Click your username
- **Bucket Name**: S3 console → Your bucket name

## Step 6: Access Your Application

- **✅ CloudFront URL (Recommended)**: `https://YOUR-DISTRIBUTION-ID.cloudfront.net`
  - HTTPS enabled
  - Better performance
  - Secure (bucket remains private)
  
- **S3 Website Endpoint (If not using CloudFront)**: `http://YOUR-BUCKET-NAME.s3-website-REGION.amazonaws.com`
  - HTTP only (no HTTPS)
  - Bucket must be public
  - Less secure

## Troubleshooting

### ❌ "Access Denied" Error on CloudFront URL

If you see "Access Denied" when accessing your CloudFront URL (`https://d31r2j5y872jl3.cloudfront.net/`), follow these steps:

#### Step 1: Verify S3 Bucket Policy

1. **Go to S3 Console**
   - Navigate to your bucket
   - Go to **"Permissions"** tab
   - Click on **"Bucket policy"**

2. **Check the Policy:**
   - The policy should allow CloudFront service principal
   - Make sure it includes your Distribution ARN
   - Example of correct policy:
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
         "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*",
         "Condition": {
           "StringEquals": {
             "AWS:SourceArn": "arn:aws:cloudfront::YOUR-ACCOUNT-ID:distribution/YOUR-DISTRIBUTION-ID"
           }
         }
       }
     ]
   }
   ```

3. **Common Issues:**
   - ❌ Missing Distribution ARN in Condition
   - ❌ Wrong Account ID
   - ❌ Wrong Distribution ID
   - ❌ Bucket name mismatch

#### Step 2: Verify Origin Access Control (OAC)

1. **Go to CloudFront Console**
   - Click on your distribution
   - Go to **"Origins"** tab
   - Click on your origin (S3 bucket)

2. **Check OAC Settings:**
   - **Origin access**: Should show "Origin Access Control"
   - **Origin access control**: Should have an OAC selected
   - If it says "Public" or "None", you need to update it

3. **If OAC is Missing:**
   - Click **"Edit"**
   - Select **"Origin Access Control settings (recommended)"**
   - Create a new OAC or select existing one
   - Save changes
   - Wait for distribution to update (5-15 minutes)

#### Step 3: Verify Files Are Uploaded to S3

1. **Check S3 Bucket Contents:**
   - Go to S3 Console → Your bucket
   - Verify `index.html` exists at the root
   - Verify `assets/` folder exists with files inside

2. **Test Direct S3 Access (Temporary):**
   - Try accessing: `https://YOUR-BUCKET-NAME.s3.REGION.amazonaws.com/index.html`
   - If this also gives "Access Denied", the bucket policy is blocking everything
   - This is expected if OAC is configured correctly

#### Step 4: Verify CloudFront Distribution Status

1. **Check Distribution Status:**
   - Go to CloudFront Console
   - Find your distribution
   - **Status** should be **"Deployed"** (green checkmark)
   - If it says "In Progress", wait for it to finish

2. **Check Origin Settings:**
   - Click on your distribution
   - Go to **"Origins"** tab
   - Click on the origin
   - Verify:
     - Origin domain points to your S3 bucket
     - Origin access control is configured
     - Origin path is empty (unless files are in subfolder)

#### Step 5: Common Fixes

**Fix 1: Update S3 Bucket Policy with Correct ARN**

1. Get your Distribution ARN:
   - CloudFront Console → Your distribution → General tab
   - Copy the **ARN** (e.g., `arn:aws:cloudfront::123456789012:distribution/E1234567890ABC`)

2. Update S3 Bucket Policy:
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
         "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*",
         "Condition": {
           "StringEquals": {
             "AWS:SourceArn": "arn:aws:cloudfront::YOUR-ACCOUNT-ID:distribution/YOUR-DISTRIBUTION-ID"
           }
         }
       }
     ]
   }
   ```
   - Replace `YOUR-BUCKET-NAME` with your actual bucket name
   - Replace `YOUR-ACCOUNT-ID` with your 12-digit AWS account ID
   - Replace `YOUR-DISTRIBUTION-ID` with your distribution ID (the part after `distribution/` in the ARN)

**Fix 2: Re-create Origin Access Control**

1. CloudFront Console → Your distribution → Origins tab
2. Click on origin → Edit
3. Under "Origin access", select "Origin Access Control settings"
4. Click "Create control setting"
5. Name: `loantube-oac`
6. Signing behavior: "Sign requests (recommended)"
7. Click "Create"
8. Select the OAC you just created
9. Save changes
10. Wait 5-15 minutes for deployment

**Fix 3: Verify Block Public Access Settings**

1. S3 Console → Your bucket → Permissions tab
2. Check "Block public access" settings
3. **All 4 boxes should be CHECKED** (enabled)
4. This is correct when using CloudFront with OAC

#### Step 6: Test After Fixes

1. **Wait for CloudFront to Update:**
   - After making changes, wait 5-15 minutes
   - Check CloudFront status is "Deployed"

2. **Clear Browser Cache:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or use incognito/private browsing mode

3. **Test the URL:**
   - Try: `https://d31r2j5y872jl3.cloudfront.net/`
   - Should load your application

#### Quick Checklist:

- [ ] S3 bucket policy includes CloudFront service principal
- [ ] S3 bucket policy has correct Distribution ARN
- [ ] CloudFront origin has OAC configured
- [ ] Files are uploaded to S3 bucket root
- [ ] CloudFront distribution status is "Deployed"
- [ ] Block public access is enabled on S3 bucket
- [ ] Waited 5-15 minutes after making changes

---

### Application shows blank page
- Check browser console for errors
- Verify `index.html` is uploaded correctly
- Ensure error pages are configured (403/404 → index.html)

### 403 Forbidden errors
- **If using CloudFront**: 
  - Verify CloudFront OAC is configured correctly
  - Check S3 bucket policy allows CloudFront service principal
  - Ensure bucket policy has correct Distribution ARN
  - Bucket should have "Block public access" ENABLED
- **If using S3 directly**:
  - Check bucket policy allows public access
  - Verify "Block public access" is disabled

### Routes not working (404 on refresh)
- Ensure error pages are configured in CloudFront
- Verify `index.html` is set as error document in S3

### Files not updating
- Clear CloudFront cache (Invalidations tab → Create invalidation → `/*`)
- Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)

## Next Steps

1. **Set up custom domain** (optional)
2. **Configure environment variables** in your build (rebuild if needed)
3. **Set up CI/CD** for automatic deployments
4. **Monitor costs** in AWS Cost Explorer

## Cost Estimate

- **S3 Storage**: ~$0.023 per GB/month (very cheap)
- **S3 Requests**: ~$0.0004 per 1,000 requests
- **CloudFront**: ~$0.085 per GB data transfer (first 10TB)
- **Free Tier**: 5 GB S3 storage, 50 GB CloudFront data transfer (first 12 months)

Your application should cost less than $1/month for low to moderate traffic.

