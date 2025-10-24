# Survey App - Environment Setup Guide

## Setting Up Supabase Authentication

This guide will help you configure Supabase for your survey application.

### Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click **"New Project"**
4. Fill in the following details:
   - **Project Name**: survey-app (or your preferred name)
   - **Database Password**: Create a strong password (save this securely)
   - **Region**: Choose the closest region to your users
5. Click **"Create new project"**
6. Wait for the project to be provisioned (this may take a few minutes)

### Step 2: Get Your API Keys

1. Once your project is ready, navigate to **Settings** (gear icon in the left sidebar)
2. Click on **API** in the settings menu
3. You'll see the following important values:
   - **Project URL**: This is your `VITE_SUPABASE_URL`
   - **Project API keys**: 
     - **anon/public**: This is your `VITE_SUPABASE_ANON_KEY`
     - **service_role**: Keep this secret and don't use it in frontend code

### Step 3: Configure Your Environment Variables

1. In your project root directory, you'll find a `.env` file
2. Open the `.env` file and replace the placeholder values:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Example:**
```env
VITE_SUPABASE_URL=https://xyzabcdef123456.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emFiY2RlZjEyMzQ1NiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjE2MjM5MDIyfQ.abc123xyz789
```

### Step 4: Configure Email Authentication in Supabase

1. Go to **Authentication** → **Providers** in your Supabase dashboard
2. Find **Email** in the list of providers
3. Make sure it's **enabled** (it should be enabled by default)
4. Configure the following settings:
   - **Confirm email**: Toggle ON (recommended for production)
   - **Secure email change**: Toggle ON (recommended)

### Step 5: Configure Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Customize the following templates as needed:
   - **Confirm signup**: Email sent when users sign up
   - **Magic Link**: For passwordless login
   - **Change Email Address**: When users change their email
   - **Reset Password**: For password reset requests

### Step 6: Test Your Setup

1. Save your `.env` file
2. Restart your development server:
   ```bash
   bun run dev
   ```
3. Navigate to the signup page
4. Create a test account
5. Check your email for the verification link (if email confirmation is enabled)

### Important Notes

⚠️ **Security Best Practices:**
- Never commit your `.env` file to version control (it's already in `.gitignore`)
- Never share your `service_role` key publicly
- Use the `anon` key for client-side applications
- Keep your environment variables secure

⚠️ **Development vs Production:**
- For production, set environment variables in your hosting platform (Vercel, Netlify, etc.)
- Use different Supabase projects for development and production
- Enable email confirmation for production environments

### Troubleshooting

**Issue: "Missing Supabase environment variables"**
- Make sure your `.env` file is in the project root directory
- Verify that variable names start with `VITE_` (required for Vite projects)
- Restart your development server after modifying `.env`

**Issue: "Invalid API key"**
- Double-check that you copied the complete API key
- Make sure there are no extra spaces or line breaks
- Verify you're using the `anon` key, not the `service_role` key

**Issue: "Email not sending"**
- Check your Supabase project's email settings
- For development, check spam/junk folders
- For production, consider setting up a custom SMTP provider in Supabase

### Next Steps

Now that authentication is set up, you can:
1. Test the sign-up and sign-in flows
2. Add password reset functionality
3. Implement social authentication providers (Google, GitHub, etc.)
4. Create database tables for surveys
5. Set up Row Level Security (RLS) policies

### Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [React + Supabase Tutorial](https://supabase.com/docs/guides/getting-started/tutorials/with-react)
