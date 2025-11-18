# Ting Tong Next

## Project Overview

This project is a modern, mobile-first social media application inspired by TikTok, built with Next.js. It features a video feed, a comment system, user authentication, and a foundation for future growth. The application is designed to be deployed on Vercel.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- Yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```bash
   cd ting-tong-next
   ```
3. Install the dependencies:
   ```bash
   yarn install
   ```
4. Create a `.env.local` file in the root of the project and add the following environment variable:
   ```env
   DATABASE_URL="your-database-url"
   ```
   A valid database URL is required to run the application. You can obtain one from [Vercel Postgres](https://vercel.com/postgres) or any other PostgreSQL provider.

### Running the Development Server

To start the development server, run:

```bash
yarn dev
```

The application will be available at `http://localhost:3000`.

### Database Initialization

The project includes scripts to initialize and reset the database.

- To create the database tables and seed them with initial data, run:
  ```bash
  yarn db:init
  ```
- To reset the database (dropping all tables and recreating them), run:
  ```bash
  yarn db:reset
  ```

## Key Functionalities

- **Video Feed**: A TikTok-style video feed that serves as the main interface of the application.
- **User Authentication**: A JWT-based authentication system with session management.
- **Commenting System**: Users can comment on videos and reply to other comments.
- **Image Uploads**: Users can upload images to their comments.
- **User Roles**: A role-based access control system with three roles:
  - `ADMIN`: Can manage user roles.
  - `PATRON`: The default role for new users.
  - `TWÓRCA`: Can publish videos.
- **Admin Panel**: A simple admin panel for managing user roles.
- **Video Publishing**: "Creators" can upload videos through a dedicated publishing interface.

## Technology Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database**: [Vercel Postgres](https://vercel.com/postgres)
- **File Storage**: [Vercel Blob](https://vercel.com/blob)
- **Authentication**: [JWT (jose)](https://github.com/panva/jose)
- **Form Management**: [React Hook Form](https://react-hook-form.com/)
- **Schema Validation**: [Zod](https://zod.dev/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

## Critical Analysis and To-Do

This section outlines critical issues, recommended improvements, and weak points of the project.

### Urgent Issues

- **Missing Video Transcoding**: The application currently stores and serves raw video files. This is inefficient and will lead to poor performance. Implementing a video transcoding pipeline (e.g., using Mux or AWS Elemental MediaConvert) to generate HLS/DASH streams is a top priority.
- **No Rate Limiting**: The application lacks rate limiting on critical actions like commenting, liking, and logging in. This makes it vulnerable to spam and abuse. Implementing a rate limiting solution (e.g., with Upstash Redis) is essential.
- **Insecure Password Handling**: The `init-db.ts` script stores passwords in plain text. This is a major security risk. All password handling should be done using a secure hashing algorithm like bcrypt.
- **No Test Coverage**: The project has no automated tests. This makes it difficult to refactor code and add new features without introducing bugs. Adding a testing framework (e.g., Jest and React Testing Library) is crucial.

### Recommended Improvements

- **Refactor Database Logic**: The database logic in `lib/db-postgres.ts` is functional but could be improved. Consider using an ORM like Prisma to simplify database interactions and improve type safety.
- **Enhance Admin Panel**: The current admin panel is very basic. It should be expanded to include features like user search, pagination, and more detailed user management.
- **Improve UI/UX**: The UI is functional but could be polished. Consider adding features like loading skeletons, optimistic UI updates, and more intuitive navigation.
- **Implement a Notification System**: A notification system would greatly improve user engagement. This could include notifications for new comments, likes, and followers.

### Weak Points

- **Scalability**: The current architecture may not scale well to a large number of users. The database schema and application logic should be reviewed and optimized for scalability.
- **Security**: In addition to the issues mentioned above, the application should undergo a thorough security audit to identify and address any potential vulnerabilities.
- **Code Organization**: While the project has a decent structure, some of the code could be better organized. For example, some of the server actions could be moved to more specific files.
