# YourApp - Modern  Application

A full-stack ecommerce application built with React, Vite, and modern web technologies.

## 📁 Project Structure

```
Ecommerce/
├── public/
│   ├── vite.svg
│   └── favicon.ico
├── src/
│   ├── api/
│   │   └── apiclient.js          # Axios API client with interceptors
│   ├── components/
│   │   ├── ApiExample.jsx        # API usage demonstration
│   │   ├── Footer.jsx            # Site footer component
│   │   └── Navbar.jsx            # Navigation component
│   ├── hooks/
│   │   └── useApi.js             # Custom hooks for API calls
│   ├── pages/
│   │   ├── About.jsx             # About page
│   │   ├── Contact.jsx           # Contact form page
│   │   ├── Home.jsx              # Homepage
│   │   ├── Login.jsx             # User login page
│   │   └── Register.jsx          # User registration page
│   ├── store/
│   │   └── store.jsx             # Zustand state management
│   ├── App.jsx                   # Main app component
│   ├── Layout.jsx                # Layout wrapper component
│   ├── index.css                 # Global styles
│   ├── main.jsx                  # App entry point
│   └── router.jsx                # React Router configuration
├── .gitignore
├── index.html                    # HTML template
├── package.json                  # Dependencies and scripts
├── tailwind.config.js            # Tailwind CSS configuration
├── vite.config.js               # Vite build configuration
└── README.md                     # Project documentation
```

## 🚀 Commands For This Project

### Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Styling
```bash
# Install Shadcn components (if needed)
npx shadcn@latest add <component name >

# Build Tailwind CSS
npm run build:css
```

## 🛠️ Tech Stack

- **Frontend**: React 18, JSX
- **Routing**: React Router v6
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Build Tool**: Vite
- **Development**: Hot reload, fast refresh

## 📱 Features

### Authentication System
- User registration and login
- Persistent authentication state
- Protected routes
- Logout functionality

### API Integration
- Axios instance with interceptors
- Request/response logging
- Error handling
- Authentication token management
- Custom React hooks for API calls

### UI/UX
- Responsive design
- Modern glassmorphism effects
- Gradient backgrounds
- Loading states
- Form validation
- Mobile-friendly navigation

### State Management
- Zustand for lightweight state management
- Persistent storage (localStorage)
- Authentication state
- Clean store architecture

## 🔗 Available Routes

- `/` - Homepage
- `/about` - About page
- `/contact` - Contact form
- `/login` - User login
- `/register` - User registration
- `/api-example` - API demonstration

## 🎯 Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Ecommerce
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open browser**
   ```
   http://localhost:5173
   ```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:
```env
REACT_APP_API_URL=https://your-api-url.com
```

### API Configuration
The API client is configured to use JSONPlaceholder as a fallback for testing:
- Base URL: `https://jsonplaceholder.typicode.com`
- Timeout: 10 seconds
- Auto token injection
- Error handling

## 📦 Dependencies

### Core
- React 19
- React Router DOM
- Zustand (state management)
- Axios (HTTP client)

### Styling
- Tailwind CSS
- PostCSS
- Autoprefixer

### Development
- Vite
- ESLint
- Hot reload
