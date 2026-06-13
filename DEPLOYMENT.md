# 🚀 GitHub Actions Deployment Guide

## What's Been Set Up

I've created a GitHub Actions workflow that automatically builds and deploys your wedding website to GitHub Pages whenever you push to the `main` or `master` branch.

## Prerequisites

1. **GitHub Repository** - Push this code to GitHub: https://github.com
2. **GitHub Pages Enabled** - Enable in repository settings (see steps below)
3. **Git Configured** - Make sure you've initialized git in your project

## Initial Setup Steps

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Build and deployment":
   - Select **Source**: "GitHub Actions"
   - Click **Save**

### 2. Push to GitHub

```bash
# Initialize if not already done
git init

# Add all files
git add .

# Initial commit
git commit -m "Initial commit - wedding website"

# Create main branch and push
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/wedding_app.git
git push -u origin main
```

### 3. Monitor Deployment

1. Go to your repo on GitHub
2. Click **Actions** tab
3. You'll see the workflow running
4. Once complete (✅), your site is live at: `https://YOUR_USERNAME.github.io/wedding_app`

## Configuring the Base URL

If your site is deployed to a repository (not your root domain), you need to set the base URL.

### Option A: Repository URL (e.g., username.github.io/wedding_app)

Add to `.github/workflows/deploy.yml` in the build step:

```yaml
- name: Build frontend
  run: npm run build
  env:
    VITE_BASE_URL: /wedding_app/
```

### Option B: Custom Domain (e.g., mysitename.com)

1. Add `CNAME` file to `Wedding_App/public/` with your domain:
   ```
   mysitename.com
   ```

2. In `.github/workflows/deploy.yml`:
   ```yaml
   - name: Build frontend
     run: npm run build
     env:
       VITE_BASE_URL: /
   ```

3. Point your domain DNS to GitHub Pages (see GitHub docs)

## Environment Variables

If you need to use environment variables (API endpoints, secrets, etc.):

1. Create a `.env.production` file in `Wedding_App/`:
   ```
   VITE_API_URL=https://your-api-domain.com/api
   ```

2. Reference in your code:
   ```javascript
   const apiUrl = import.meta.env.VITE_API_URL || '/api'
   ```

## Backend Deployment

Currently, this workflow **only deploys the frontend**. If you need to deploy your Python FastAPI backend:

### Option 1: Heroku, Railway, Render, or Vercel

Create a separate workflow or use their deployment tools:
- Heroku: `git push heroku main`
- Railway: Connect GitHub repo in dashboard
- Render: Connect GitHub repo and select `Wedding_App/main.py`

### Option 2: VPS (Linode, DigitalOcean, AWS)

Deploy via SSH in your GitHub Actions workflow (requires SSH keys in secrets).

## Proxy Configuration for Production

Your current `vite.config.js` has a proxy for `/api` → `localhost:8000`. This works locally but not in production.

**For production API calls:**

1. Update your API calls to use the full URL:
   ```javascript
   const apiUrl = process.env.NODE_ENV === 'production' 
     ? 'https://api.yourbackend.com'
     : '/api'
   ```

2. Or set `VITE_API_URL` environment variable as shown above

## Troubleshooting

### Pages 404 After Deploy

- Check that the base URL is correct in `vite.config.js`
- Verify the `dist` folder was built correctly
- Check the **Actions** tab for build errors

### Blank Page

- Open browser DevTools → Console
- Check for 404 errors on assets
- Likely base URL issue (see "Configuring the Base URL")

### API Calls Failing

- The frontend and backend need to be deployed separately
- Use full URLs for API endpoints in production
- Enable CORS on your backend

## Monitor Deployments

Every time you push to `main`, GitHub will automatically:
1. ✅ Checkout your code
2. ✅ Install dependencies  
3. ✅ Build the React app with Vite
4. ✅ Upload to GitHub Pages
5. ✅ Deploy to your site

Check progress in the **Actions** tab of your repo.

## Quick Reference

| What | Where |
|------|-------|
| Workflow file | `.github/workflows/deploy.yml` |
| Build config | `Wedding_App/vite.config.js` |
| Build output | `Wedding_App/dist/` |
| Live URL | `https://USERNAME.github.io/wedding_app` |
| Environment vars | `.env.production` in `Wedding_App/` |

---

**Need help?** Check GitHub's Pages docs: https://docs.github.com/en/pages
