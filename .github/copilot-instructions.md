# Copilot Instructions: Kounta

This document provides instructions for GitHub Copilot to assist in the
development of the Kounta mobile application.

## 1. Framework and UI

- **Framework:** The project is built with **React Native** and **Expo**.
- **UI Library:** We use **React Native Paper** for UI components. Ensure all
  new UI components are from this library to maintain consistency with Material
  Design principles.
- **Styling:** All styling should be done using the custom theme file. Use the
  defined color palettes for light and dark modes.
- **Typography:** Use the **Poppins** font for headings and the **Inter** font
  for body text, as configured in the theme.

## 2. State Management and Database

- **Database:** All data is persisted locally using **sqlite** with a **SQLite**
  adapter.
- **Data Interaction:** Interact with the database _only_ through the repository
  layer -> hooks -> UI. to make UI components reactive to database changes.
- **CRUD Operations:** Use SQLite methods for all CRUD operations (e.g.,
  `database.get('accounts').create(...)`).
- **Atomicity:** Wrap all related database operations for a single transaction
  (e.g., creating a transaction and updating an account balance) in a single
  `database.write()` block to ensure atomicity.

## 3. Navigation

- **Routing:** Use **React Navigation** for all screen transitions.

## 4. Authentication

- **Method:** Implement Google Sign-In using `expo-auth-session` and
  `expo-google-app-auth`.
- **Scope:** When requesting authentication, ensure the
  `https://www.googleapis.com/auth/drive.file` scope is included to allow for
  Google Drive backup.

## 5. Code Conventions

- **File Naming:** Follow the existing file naming conventions (e.g.,
  `*.model.ts`, `*.repository.ts`, `*.hook.ts`).
- **Code Style:** Adhere to the existing code style for consistency.
- **Business Logic:** Place all business logic in hooks that interact with the
  repository layer. UI components should be as stateless as possible.

## 6. Folder Structure

### Current Workspace Structure

```
/ (root)
├── apps/
│   └── mobile/   # React Native + Expo mobile app
├── docs/
│   ├── brand-guideline.pdf
│   ├── project-description.pdf
│   └── technical-guidelines.pdf
├── scripts/
├── README.md
├── GEMINI.md
```

### Recommended Mobile App Structure

```
apps/mobile/
├── assets/           # Images, fonts, icons
├── components/       # Stateless UI components (React Native Paper)
├── hooks/            # Business logic hooks (e.g., useAccounts.hook.ts)
├── repositories/     # Data access layer (e.g., account.repository.ts)
├── navigation/       # React Navigation setup
├── screens/          # Screen components (stateless, UI only)
├── theme/            # Custom theme, color palettes, typography
├── utils/            # Utility functions
├── App.ts            # Entry point
├── database.ts       # sqlite setup
├── .env              # Environment variables
└── ...
```

> Always refer to the docs for brand, technical, and architectural standards.
