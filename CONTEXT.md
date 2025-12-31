# Attendance App

## Project Overview
This is a Next.js-based attendance tracking application designed for small teams of 8-10 employees. The app supports one admin user who can manage employee accounts, and employees who can perform daily punch-in and punch-out operations.

## Key Features
- **Admin Management**: Single admin can create, view, and manage employee accounts
- **Employee Attendance**: Employees can punch in/out once per day
- **Simple Authentication**: Basic login system for admin and employees
- **Data Persistence**: Uses JSON file storage for user and attendance data
- **Responsive Design**: Built with Tailwind CSS for mobile-friendly interface

## Architecture Decisions
- **Framework**: Next.js 15 with App Router for server-side rendering and API routes
- **Styling**: Tailwind CSS v4 for utility-first styling
- **Data Storage**: Supabase PostgreSQL database for users and attendance data
- **Authentication**: Session-based auth using Next.js cookies (simplified for demo)
- **Components**: Reusable components in src/components/

## Project Structure
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - Reusable React components
- `data/` - JSON files for data persistence
- `CONTEXT.md` - This documentation file

## Conventions
- Use Server Components by default
- Client components marked with "use client"
- API routes in src/app/api/ for backend logic
- Consistent naming: kebab-case for files, PascalCase for components

## Major Changes Log
- Initial setup: Basic Next.js project with Tailwind
- Added user management and attendance features
- Implemented authentication and data persistence
- Fixed ESLint errors and completed build
- Migrated to Supabase for database storage