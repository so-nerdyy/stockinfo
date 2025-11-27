# Vercel Deployment Guide for Stock Analysis App

## Frontend Deployment (Vercel)

### Vercel Configuration Settings:

```
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### Environment Variables (Set in Vercel Dashboard):

```
VITE_API_URL=<your-backend-api-url>
```

**Example**: `VITE_API_URL=https://your-backend.onrender.com`

---

## Backend Deployment Options

Your FastAPI backend needs to be deployed separately. Here are the recommended options:

### Option 1: Render.com (Recommended - Free Tier Available)

1. Create account at [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `stock-analyzer-api`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Deploy and copy the URL (e.g., `https://stock-analyzer-api.onrender.com`)
6. Use this URL as `VITE_API_URL` in Vercel

### Option 2: Railway.app

1. Create account at [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Configure:
   - **Root Directory**: `/backend`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Railway will auto-detect Python and install dependencies
6. Copy the generated URL and use as `VITE_API_URL`

### Option 3: Vercel Serverless Functions (Advanced)

Convert your FastAPI app to Vercel serverless functions (requires code changes).

---

## Deployment Steps

### Step 1: Deploy Backend First

1. Choose a backend hosting platform (Render/Railway recommended)
2. Deploy your `backend` folder
3. Copy the deployed backend URL

### Step 2: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Add Environment Variable:
   - **Name**: `VITE_API_URL`
   - **Value**: Your backend URL (e.g., `https://your-backend.onrender.com`)
6. Click "Deploy"

### Step 3: Update Backend CORS

After deployment, update your backend's CORS settings in `backend/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Local development
        "https://your-vercel-app.vercel.app",  # Your Vercel URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Important Notes

⚠️ **CRITICAL**: The frontend code currently has hardcoded `localhost:8000` URLs. These need to be replaced with `import.meta.env.VITE_API_URL` before deployment.

✅ **Local Development**: The `.env` file is already set up for local development with `VITE_API_URL=http://localhost:8000`

🔒 **Security**: Never commit `.env` files to Git. The `.env.example` file is provided as a template.

---

## Testing Your Deployment

1. Visit your Vercel URL
2. Upload a CSV file
3. Select date range and click "Analyze"
4. Verify all charts and tables load correctly

## Troubleshooting

- **CORS Errors**: Update backend CORS settings to include your Vercel domain
- **API Not Found**: Verify `VITE_API_URL` is set correctly in Vercel
- **Build Fails**: Check that all dependencies are in `package.json`
- **Charts Not Showing**: Verify backend is returning data in correct format

---

## Quick Deployment Checklist

- [ ] Deploy backend to Render/Railway
- [ ] Copy backend URL
- [ ] Set `VITE_API_URL` in Vercel environment variables
- [ ] Deploy frontend to Vercel
- [ ] Update backend CORS with Vercel URL
- [ ] Test the deployed application

