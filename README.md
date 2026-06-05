# Pocket Finance

Bold news. Smarter moves. Mobile-first finance news feed.

## Local development

```bash
npm install
cp .env.example .env.local   # add your NewsAPI key
npm run dev                    # cleans .next cache, then starts dev server
```

## Deploy on Vercel

1. Push this repo to GitHub (see [DEPLOY.md](./DEPLOY.md)).
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. Add environment variable: `NEWS_API_KEY` = your key from [newsapi.org](https://newsapi.org).
4. Deploy — Vercel auto-detects Next.js.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Clean `.next`, start dev server |
| `npm run build` | Production build |
| `npm run build:clean` | Clean cache + build |
