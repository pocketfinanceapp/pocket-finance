# Deploy Pocket Finance to Vercel

Follow these steps in order. Total time: ~10 minutes.

## Prerequisites

- GitHub account: https://github.com/signup
- Vercel account (free): https://vercel.com/signup — use **Continue with GitHub**
- NewsAPI key (optional but recommended): https://newsapi.org/register

---

## Step 1 — Initialize Git (if not done)

In Terminal, from the project folder:

```bash
cd /Users/oscarho/Desktop/pocket-finance
git init
git add .
git commit -m "Initial commit: Pocket Finance app"
```

---

## Step 2 — Create a GitHub repository

1. Open https://github.com/new
2. **Repository name:** `pocket-finance` (or any name)
3. Set to **Private** or **Public**
4. Do **not** add README, .gitignore, or license (this project already has them)
5. Click **Create repository**

---

## Step 3 — Push your code to GitHub

GitHub shows commands after creating the repo. Use yours, or:

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pocket-finance.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username. Sign in if prompted.

---

## Step 4 — Import project on Vercel

1. Go to https://vercel.com/new
2. Click **Import** next to your `pocket-finance` repository
3. **Framework Preset:** Next.js (auto-detected)
4. **Root Directory:** `./` (default)
5. **Build Command:** `npm run build` (default)
6. **Output Directory:** leave default (Next.js handles this)

Do **not** deploy yet — add the env var first.

---

## Step 5 — Environment variables

On the import screen (or **Settings → Environment Variables** after import):

| Name | Value |
|------|--------|
| `NEWS_API_KEY` | Your key from newsapi.org |

Apply to **Production**, **Preview**, and **Development**.

Without this key, the app still runs but uses demo articles only.

---

## Step 6 — Deploy

Click **Deploy**. Wait 1–3 minutes.

When finished, Vercel shows:

- **Production URL:** `https://pocket-finance-xxxx.vercel.app`
- Optional custom domain under **Settings → Domains**

---

## Step 7 — Share and test

1. Open the production URL on your phone
2. Complete onboarding once
3. Test feed swipe and **Markets** tab

Every `git push` to `main` triggers a new production deploy automatically.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails on Vercel | Run `npm run build:clean` locally; fix errors; push again |
| No news articles | Add `NEWS_API_KEY` in Vercel env vars; redeploy |
| Old UI on phone | Hard refresh or clear PWA cache |
| `git push` rejected | `git pull origin main --rebase` then push again |

---

## Optional: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

Set `NEWS_API_KEY` in the Vercel dashboard when prompted or via `vercel env add`.
