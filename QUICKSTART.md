# Survey App - Quick Start Guide

## 🚀 Getting Started

This survey application features a complete authentication system with protected routes, built with React, Vite, Supabase, and Tailwind CSS.

## 📋 Prerequisites

- Node.js (v18 or higher) or Bun runtime
- A Supabase account (free tier available)
- A modern web browser

## 🔧 Installation

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Configure Supabase:**
   - Follow the detailed instructions in `SUPABASE_SETUP.md`
   - Copy your Supabase URL and anon key to the `.env` file

3. **Start the development server:**
   ```bash
   bun run dev
   ```

4. **Open your browser:**
   - Navigate to `http://localhost:5173` (or the URL shown in terminal)

## 🎯 Features Implemented

### ✅ Authentication System
- **Sign Up**: Create new accounts with email validation
- **Sign In**: Secure login with credential validation
- **Sign Out**: Clean session termination
- **Email Verification**: Users receive verification emails (configurable in Supabase)
- **Protected Routes**: Dashboard is only accessible when logged in

### 🎨 User Interface
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern Styling**: Clean, professional design with Tailwind CSS
- **Icons**: Lucide React icon pack for consistent iconography
- **Toast Notifications**: Real-time feedback for user actions
- **Password Visibility Toggle**: Eye icon to show/hide passwords
- **Form Validation**: Real-time validation with helpful error messages

### 🔒 Security Features
- **Client-side Validation**: Email format and password strength checks
- **Server-side Authentication**: Supabase handles secure authentication
- **Protected Routes**: Automatic redirection for unauthenticated users
- **Environment Variables**: Sensitive keys stored securely
- **Loading States**: Prevents duplicate submissions

## 📱 Application Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Redirects to sign in |
| `/signup` | Public | User registration page |
| `/signin` | Public | User login page |
| `/dashboard` | Protected | User dashboard (requires authentication) |

## 🎨 Tech Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Package Manager**: Bun
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Routing**: React Router DOM v7
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 📖 Usage

### Creating an Account

1. Navigate to the **Sign Up** page
2. Fill in:
   - Full Name
   - Email Address
   - Password (minimum 6 characters)
   - Confirm Password
3. Click **"Create Account"**
4. Check your email for verification (if enabled in Supabase)
5. You'll be redirected to the sign-in page

### Signing In

1. Navigate to the **Sign In** page
2. Enter your email and password
3. Click **"Sign In"**
4. Upon successful authentication, you'll be redirected to the dashboard

### Dashboard

- View your account information
- See your email verification status
- Access placeholder statistics (ready for future features)
- Sign out of your account

## 🛠️ Development

### Project Structure

```
survey_app/
├── src/
│   ├── components/
│   │   └── ProtectedRoute.jsx    # Route guard for authentication
│   ├── contexts/
│   │   └── AuthContext.jsx       # Authentication state management
│   ├── lib/
│   │   └── supabase.js           # Supabase client configuration
│   ├── pages/
│   │   ├── Dashboard.jsx         # Protected dashboard page
│   │   ├── SignIn.jsx            # Login page
│   │   └── SignUp.jsx            # Registration page
│   ├── App.jsx                   # Main app with routing
│   └── main.jsx                  # App entry point
├── .env                          # Environment variables (not in git)
├── .env.example                  # Environment variables template
└── SUPABASE_SETUP.md            # Detailed Supabase setup guide
```

### Adding New Features

1. **Add a new route:**
   - Create a new component in `src/pages/`
   - Add the route to `App.jsx`
   - Wrap with `<ProtectedRoute>` if authentication is required

2. **Access user data:**
   ```jsx
   import { useAuth } from '../contexts/AuthContext';
   
   function MyComponent() {
     const { user, loading } = useAuth();
     // user contains all user information
   }
   ```

3. **Add authentication actions:**
   ```jsx
   const { signUp, signIn, signOut } = useAuth();
   ```

## 🔍 Environment Variables

Required environment variables (add to `.env`):

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

⚠️ **Important**: Never commit the `.env` file to version control!

## 🐛 Troubleshooting

### Development Server Won't Start
- Ensure all dependencies are installed: `bun install`
- Check that `.env` file exists and contains valid keys
- Try clearing the cache: `rm -rf node_modules && bun install`

### Authentication Not Working
- Verify Supabase credentials in `.env`
- Check Supabase dashboard for service status
- Ensure email provider is enabled in Supabase

### Styling Issues
- Make sure Tailwind CSS is properly configured
- Check that `postcss.config.js` and `tailwind.config.js` exist
- Verify `@tailwind` directives are in `src/index.css`

## 📝 Next Steps

Here are some features you might want to add:

- [ ] Password reset functionality
- [ ] Social authentication (Google, GitHub)
- [ ] User profile editing
- [ ] Survey creation and management
- [ ] Response collection and analytics
- [ ] Email templates customization
- [ ] Role-based access control
- [ ] Dark mode toggle

## 📄 License

This project is created for educational and commercial purposes.

## 👨‍💻 Support

For Supabase-specific issues, refer to:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Community Discord](https://discord.supabase.com/)

---

**Happy coding! 🎉**
