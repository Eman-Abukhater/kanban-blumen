# 🔧 Supabase Connection Performance Fix

## The Problem You're Experiencing

- **Transaction Pooler (port 6543)** - Works but VERY SLOW with Prisma
- **Direct Connection (port 5432)** - Fast but IPv6 issues on Render
- **Session Pooler** - The solution you need!

---

## ✅ Solution: Proper Supabase Configuration

### Step 1: Get Your Supabase Connection Strings

Go to your Supabase Dashboard → Project Settings → Database

You'll see 3 connection modes:

#### 1. **Session Mode** (Use this for DATABASE_URL)

```
postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

- Port: **5432**
- Mode: **Session**
- Use for: **Runtime queries**
- Fast with Prisma ✅

#### 2. **Transaction Mode** (DO NOT USE with Prisma)

```
postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

- Port: **6543**
- Mode: **Transaction**
- **SLOW with Prisma** ❌ (This is your current issue!)

#### 3. **Direct Connection** (Use for DIRECT_URL)

```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

- Port: **5432**
- Direct database connection
- Use for: **Migrations only**

---

## Step 2: Update Your .env File

Create/update your `.env` file in `kanban-backend-/`:

```env
# Use SESSION POOLER for runtime (fast with Prisma)
DATABASE_URL="postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Use DIRECT connection for migrations
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Other required vars
NODE_ENV=production
PORT=7260
JWT_SECRET=your_jwt_secret_here

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URLs
FRONTEND_URL=https://your-frontend.vercel.app
FRONTEND_URL_ALT=http://localhost:3000
```

---

## Step 3: Verify Connection String Format

### ✅ CORRECT Session Pooler Format:

```
postgres://postgres.xxxxx:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres
         ↑                                  ↑                        ↑
      pooler prefix                    pooler domain            port 5432
```

### ❌ WRONG Transaction Pooler Format:

```
postgres://postgres.xxxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres
                                                                       ↑
                                                                  port 6543 = SLOW!
```

---

## Step 4: For Render.com Deployment

### Option A: Use Render's Internal Network (Recommended)

If you're on Render Pro and have IPv6 support:

```env
# In Render Dashboard → Environment Variables
DATABASE_URL=postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1

DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

Key parameters:

- `pgbouncer=true` - Optimizes for connection pooling
- `connection_limit=1` - Prevents connection exhaustion

### Option B: Use Supavisor (Supabase's New Pooler)

If available in your region:

```env
DATABASE_URL=postgresql://postgres.xxxxx:[PASSWORD]@[PROJECT-REF].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

---

## Step 5: Alternative - Use PgBouncer Directly

If Render still has IPv6 issues, deploy your own PgBouncer:

### Quick PgBouncer Setup on Render:

1. Create a new **Background Worker** on Render
2. Use Docker image: `edoburu/pgbouncer`
3. Set environment variables:

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
POOL_MODE=session
MAX_CLIENT_CONN=100
DEFAULT_POOL_SIZE=20
```

4. Connect your app to PgBouncer's internal URL

---

## Step 6: Rebuild and Deploy

```bash
# Regenerate Prisma Client
cd kanban-backend-
npx prisma generate

# Build the project
npm run build

# Test locally first
npm start

# Then deploy to Render
git add .
git commit -m "fix: optimize Supabase connection pooling"
git push
```

---

## 🚀 Better Alternative: Switch from Render to Railway

Railway handles connection pooling better:

### Why Railway is Better:

1. ✅ **Better IPv6 support**
2. ✅ **Built-in connection pooling**
3. ✅ **Faster deployment**
4. ✅ **Better PostgreSQL integration**
5. ✅ **$5 free credit monthly**

### Quick Migration to Railway:

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your `kanban-backend-` repo
5. Add PostgreSQL service (or link Supabase)
6. Set environment variables (same as above)
7. Deploy!

**Frontend on Vercel + Backend on Railway = Excellent performance**

---

## 📊 Expected Performance After Fix:

| Connection Type    | Query Speed  | Your Current  | After Fix         |
| ------------------ | ------------ | ------------- | ----------------- |
| Transaction Pooler | 🐌 200-500ms | ✅ (slow)     | ❌ Don't use      |
| Session Pooler     | ⚡ 20-50ms   | ❌ Not used   | ✅ Use this!      |
| Direct Connection  | ⚡ 10-30ms   | ❌ IPv6 issue | 🟡 For migrations |

**Expected improvement: 5-10x faster database queries!** 🚀

---

## 🔍 Verify Your Setup

After deployment, check the logs:

```bash
# Should see:
✅ Database connected successfully

# Should NOT see:
❌ ENOTFOUND
❌ Connection timeout
❌ IPv6 error
```

Test an API endpoint:

```bash
curl https://your-backend.onrender.com/health
# Should respond in < 200ms
```

---

## 🆘 Troubleshooting

### Issue: Still slow after changes

**Solution:** Make sure you're using port **5432** NOT **6543**

### Issue: "Connection timeout"

**Solution:** Check if your Supabase project is paused (free tier pauses after inactivity)

### Issue: "Too many connections"

**Solution:** Add `?connection_limit=1` to DATABASE_URL

### Issue: IPv6 still not working on Render

**Solution:** Switch to Railway or use PgBouncer as a proxy

---

## 🎯 Recommended Stack for Best Performance:

1. **Frontend**: Vercel (Free tier, excellent for Next.js)
2. **Backend**: Railway (Better than Render for this use case)
3. **Database**: Supabase PostgreSQL
4. **Connection**: Session Pooler (port 5432)
5. **Caching**: Already implemented in your code ✅

This setup will give you **sub-100ms response times** consistently!

