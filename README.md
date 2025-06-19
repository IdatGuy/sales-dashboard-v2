# Sales Dashboard

A modern, responsive sales dashboard built with React, TypeScript, and Tailwind CSS. This project demonstrates a comprehensive approach to building a full-stack web application with real-time data visualization, user authentication, and role-based access control.

## 🔗 Live Demo

**[View Live Application](https://sales-dashboard-v2.vercel.app)**

> **Demo Credentials**: Use any email/password combination to access the demo dashboard with sample data.

The live demo includes:
- ✅ Full dashboard functionality with sample sales data
- ✅ Interactive charts and data visualization  
- ✅ Goal tracking and progress indicators
- ✅ Commission calculations
- ✅ Responsive design across all devices
- ✅ Dark/light mode toggle

*Note: The demo uses mock authentication for portfolio purposes.*

## 🌟 Features

- **Real-time Sales Analytics**: Interactive charts showing daily, monthly, and yearly sales data
- **Goal Tracking**: Set and monitor sales goals with visual progress indicators
- **Commission Management**: Track and display commission calculations
- **Responsive Design**: Fully responsive interface that works on desktop, tablet, and mobile
- **Dark Mode Support**: Toggle between light and dark themes
- **User Authentication**: Secure login with Supabase authentication
- **Role-based Access**: Different views for employees, managers, and admins
- **Sales Projections**: Advanced calculations for monthly and yearly projections
- **Data Visualization**: Charts powered by Chart.js for clear data representation

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development with excellent IntelliSense
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **React Router** - Client-side routing
- **Chart.js** - Interactive charts and data visualization
- **Lucide React** - Beautiful, customizable icons

### Backend & Database
- **Supabase** - Backend-as-a-Service with PostgreSQL database
- **Real-time subscriptions** - Live data updates
- **Row Level Security** - Secure data access patterns

### Development Tools
- **Vite** - Fast development server and build tool
- **ESLint** - Code linting and formatting
- **PostCSS** - CSS processing and optimization

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/IdatGuy/sales-dashboard-v2.git
   cd sales-dashboard-v2
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   
   Then edit `.env.local` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   
   **To get your Supabase credentials:**
   - Create a project at [supabase.com](https://supabase.com/dashboard)
   - Go to Settings → API in your dashboard
   - Copy the Project URL and anon public key

4. Set up the database schema:
   
   The project includes a Supabase configuration in the `supabase/` directory. You can:
   
   **Option A: Use Supabase CLI (Recommended)**
   ```bash
   # Install Supabase CLI
   npx supabase init
   npx supabase db push
   ```
   
   **Option B: Manual Setup**
   - Import the database schema from `src/lib/database.types.ts`
   - Create the required tables: `profiles`, `stores`, `sales`, `store_goals`, `commissions`
   - Set up Row Level Security policies for data access

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Build for production:
   ```bash
   npm run build
   ```

## 📊 Key Components

### Dashboard Features
- **Sales Chart**: Interactive line charts showing sales trends over time
- **Goals Progress**: Visual progress bars for sales, accessory, and home connect goals
- **Sales Projection**: Smart forecasting based on completed business days
- **Commission Widget**: Real-time commission calculations and breakdowns
- **Leaderboard**: Employee performance ranking system

### Data Architecture
- **Context API**: Centralized state management for dashboard data
- **Service Layer**: Clean separation between UI and API calls
- **Type Safety**: Comprehensive TypeScript interfaces for all data structures
- **Caching**: Efficient data caching to minimize API calls

### User Experience
- **Responsive Design**: Mobile-first approach with seamless device adaptation
- **Loading States**: Skeleton screens and loading indicators
- **Error Handling**: Graceful error handling with user-friendly messages
- **Accessibility**: WCAG compliance with proper ARIA labels and keyboard navigation

## 🏗 Architecture Decisions

### Date Handling
- Fixed timezone issues by using explicit date parsing instead of relying on browser timezone interpretation
- Implemented safe date parsing to prevent off-by-one errors in date calculations

### Projection Logic
- Uses only completed business days for accurate monthly projections
- Excludes Sundays and incomplete periods from calculations
- Separate logic for monthly vs. yearly projections based on data completeness

### Performance Optimizations
- Memoized expensive calculations using React.useMemo
- Efficient data fetching with request caching
- Lazy loading of non-critical components

## 🎨 Design System

- **Color Palette**: Professional blue-based theme with dark mode support
- **Typography**: Clear hierarchy with proper font weights and sizes
- **Spacing**: Consistent spacing using Tailwind's spacing scale
- **Components**: Reusable UI components following atomic design principles

## 📱 Responsive Breakpoints

- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: 1024px+

## 🔒 Security Features

- **Authentication**: Secure user authentication with Supabase Auth
- **Authorization**: Role-based access control (Employee, Manager, Admin)
- **Data Protection**: Row-level security policies in Supabase
- **Input Validation**: Client and server-side validation

## 🧪 Code Quality

- **TypeScript**: 100% TypeScript coverage for type safety
- **ESLint**: Comprehensive linting rules for code consistency
- **Component Structure**: Clean, maintainable component architecture
- **Error Boundaries**: Proper error handling and user feedback

## 📈 Performance Metrics

- **Bundle Size**: Optimized build with code splitting
- **Load Time**: Fast initial page load with lazy loading
- **Runtime Performance**: Efficient re-renders with React optimizations

## 🔄 Future Enhancements

- Real-time notifications for goal achievements
- Advanced analytics with trend analysis
- Export functionality for reports
- Integration with external CRM systems

## 📄 License

This project is part of a portfolio demonstration and is not intended for commercial use.

## 🤝 Contact

For questions about this project or potential collaboration opportunities, please reach out through email at isaiah.fouse01@gmail.com.

---

*This project demonstrates proficiency in modern web development technologies, clean architecture patterns, and user-centered design principles.*
