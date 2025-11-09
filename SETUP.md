# Parla Italiano - Setup Guide

This guide will walk you through setting up your Italian learning game from start to finish.

## Prerequisites

- Node.js 20+ installed
- A Supabase account (free tier is perfect for personal use)
- A code editor (VS Code recommended)

## Step 1: Supabase Project Setup

### 1.1 Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in the details:
   - **Name**: `parla-italiano` (or any name you prefer)
   - **Database Password**: Create a strong password (save it somewhere safe)
   - **Region**: Choose the closest region to you
   - **Pricing Plan**: Free tier is perfect for personal use
4. Click "Create new project" and wait ~2 minutes for setup

### 1.2 Get Your Supabase Credentials

1. Once your project is ready, go to **Project Settings** (gear icon in sidebar)
2. Click on **API** in the left menu
3. You'll see two important values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)
4. Copy these values - you'll need them next

### 1.3 Set Up Environment Variables

1. Open the file `.env.local` in the root of your project
2. Replace the placeholder values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
3. Save the file

### 1.4 Run the Database Schema

1. In Supabase dashboard, click on **SQL Editor** (in the left sidebar)
2. Click "New Query"
3. Open the file `lib/supabase/schema.sql` from this project
4. Copy ALL the contents
5. Paste into the Supabase SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. Wait for success message: "Success. No rows returned"

This creates all your database tables, security policies, and sample achievements!

### 1.5 Verify Database Setup

1. Click on **Table Editor** in Supabase
2. You should see these tables:
   - lessons
   - vocabulary
   - user_progress
   - vocabulary_mastery
   - achievements
   - user_achievements
   - user_streaks
   - user_stats
   - user_preferences

3. Click on `achievements` table - you should see 10 pre-loaded achievements!

### 1.6 Enable Authentication

1. Go to **Authentication** > **Providers** in Supabase
2. Make sure **Email** is enabled (it should be by default)
3. Optionally configure:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: `http://localhost:3000/**` (for development)

## Step 2: Install Dependencies

The dependencies are already installed from the initial setup, but if you need to reinstall:

```bash
cd parla-italiano
npm install
```

## Step 3: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 4: Google Cloud Setup (Optional - Can Do Later)

For text-to-speech and advanced speech recognition:

### 4.1 Create Google Cloud Project

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable these APIs:
   - **Cloud Text-to-Speech API**
   - **Cloud Speech-to-Text API**

### 4.2 Create API Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **API Key**
3. Copy the API key
4. Add to `.env.local`:
   ```env
   GOOGLE_CLOUD_API_KEY=your-api-key
   GOOGLE_CLOUD_TTS_API_KEY=your-api-key
   ```

**Note**: Google Cloud has a generous free tier:
- Text-to-Speech: 1 million characters/month free
- Speech-to-Text: 60 minutes/month free

## Step 5: ElevenLabs Setup (Optional - Premium TTS)

If you want the best Italian pronunciation:

1. Go to [https://elevenlabs.io](https://elevenlabs.io)
2. Sign up for free account (10,000 characters/month free)
3. Get your API key from Settings
4. Add to `.env.local`:
   ```env
   ELEVENLABS_API_KEY=your-elevenlabs-key
   ```

## Step 6: Verify Everything Works

1. Make sure dev server is running (`npm run dev`)
2. Check the console for any errors
3. Open `http://localhost:3000`
4. You should see the default Next.js page (we'll build the app next!)

## Troubleshooting

### "Error: Invalid Supabase URL"
- Check that you copied the full URL from Supabase (including `https://`)
- Make sure there are no extra spaces in `.env.local`

### "Error: Failed to fetch"
- Verify your Supabase anon key is correct
- Check that your Supabase project is running (not paused)
- Ensure RLS policies were created (re-run the schema.sql if needed)

### "Module not found" errors
- Run `npm install` again
- Delete `node_modules` and `.next` folders, then run `npm install`

### Port 3000 already in use
- Kill the process using port 3000
- Or run on different port: `npm run dev -- -p 3001`

## Next Steps

Once setup is complete:
1. We'll create the authentication pages
2. Build the lesson system
3. Add the game mechanics
4. Create Italian content
5. Deploy to Vercel

## Useful Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Run production build locally
npm start

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

## Resources

- **Supabase Docs**: [https://supabase.com/docs](https://supabase.com/docs)
- **Next.js Docs**: [https://nextjs.org/docs](https://nextjs.org/docs)
- **Phaser.js Docs**: [https://photonstorm.github.io/phaser3-docs](https://photonstorm.github.io/phaser3-docs)

## Support

If you encounter any issues during setup, check:
1. The error message in the console
2. Supabase logs (in dashboard)
3. Browser developer console (F12)

Ready to start building? Let's go!
