# Social Media Scheduler Pro

## Overview

This is a comprehensive social media management platform built with a modern full-stack architecture. The application enables users to compose, schedule, and publish posts across multiple social media platforms while providing analytics, team collaboration features, and AI-powered content suggestions. The system integrates with Ayrshare's unified social media API to handle the complexity of managing different social platform APIs through a single interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Language Support**: Custom internationalization system supporting English and Thai

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Pattern**: REST API with centralized route handling
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Middleware**: Custom logging, error handling, and authentication middleware

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Session Storage**: PostgreSQL-backed session store with connect-pg-simple
- **In-Memory Fallback**: Custom MemStorage implementation for development/testing

### Authentication and Authorization
- **Authentication Method**: JWT tokens stored in localStorage and HTTP headers
- **Password Security**: Bcrypt hashing with salt rounds
- **Session Management**: Persistent sessions with database storage
- **Authorization**: Role-based access control (admin, editor, user roles)
- **Frontend Auth State**: Custom auth hook with React Context pattern

### External Service Integrations
- **Social Media API**: Ayrshare unified API for multi-platform posting
- **Profile Management**: Ayrshare Business Plan integration for user profile creation
- **Social Account Linking**: JWT-based secure authentication flow for connecting social accounts
- **Media Handling**: Support for image and video uploads across platforms
- **Analytics Integration**: Platform-specific engagement metrics through Ayrshare

### Design System
- **Color Palette**: Sage green primary with cream background, supporting turquoise, orange, purple, and amber accent colors
- **Typography**: Multi-font system with Sarabun for Thai content and system fonts for English
- **Components**: Modular component architecture with consistent design tokens
- **Responsive Design**: Mobile-first approach with responsive grid layouts
- **Accessibility**: ARIA compliance and keyboard navigation support

### Key Features Architecture
- **Post Composition**: Rich text editor with media attachment support
- **Scheduling System**: Date/time picker with timezone handling
- **Multi-Platform Publishing**: Single interface for posting to Facebook, Instagram, Twitter/X, LinkedIn, TikTok, and YouTube
- **Analytics Dashboard**: Real-time engagement metrics and performance tracking
- **Team Collaboration**: Role-based permissions and activity tracking
- **AI Suggestions**: Content optimization recommendations and optimal posting times
- **Template System**: Reusable post templates for consistent branding

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL driver for Neon Database
- **drizzle-orm**: Type-safe ORM with schema definition and query building
- **express**: Web application framework for Node.js backend
- **react**: Frontend UI library with hooks and context
- **@tanstack/react-query**: Server state management and caching

### UI and Styling
- **@radix-ui/react-***: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **clsx**: Conditional CSS class name utility

### Authentication and Security
- **jsonwebtoken**: JWT token generation and verification
- **bcryptjs**: Password hashing and salt generation
- **connect-pg-simple**: PostgreSQL session store for Express

### Development and Build Tools
- **vite**: Fast build tool and development server
- **typescript**: Static type checking
- **tsx**: TypeScript execution for Node.js
- **esbuild**: Fast JavaScript bundler for production builds

### Form and Data Validation
- **react-hook-form**: Performant form handling with minimal re-renders
- **@hookform/resolvers**: Form validation resolver integrations
- **zod**: Runtime type validation and schema parsing
- **drizzle-zod**: Integration between Drizzle ORM and Zod validation

### Utility Libraries
- **date-fns**: Modern date utility library
- **cmdk**: Command menu component
- **wouter**: Minimalist routing library
- **nanoid**: URL-safe unique ID generator