# Kounta Mobile App — Code Audit Report

## MEDIUM-SEVERITY ISSUES

---

### 15. useGoogleDriveBackup — Placeholder client ID

**File:** `hooks/useGoogleDriveBackup.ts` (line 9)

`CLIENT_ID = "your-client-id.apps.googleusercontent.com"` — Google Drive
backup/restore will always fail.

**Proposed fix:** Move to an environment variable or configure properly.

---

## LOW-SEVERITY / CODE QUALITY ISSUES

---

### 16. AppBar menu items do nothing

**File:** `components/AppBar.tsx` (lines 59-61)

```tsx
<Menu.Item onPress={() => {}} title="Profile" />
<Menu.Item onPress={() => {}} title="Settings" />
<Menu.Item onPress={() => {}} title="Logout" />
```

These are placeholder buttons with no functionality.

**Proposed fix:** Either implement or remove to avoid confusing users.

---

### 17. SettingsScreen is a stub

**File:** `screens/SettingsScreen.tsx`

Just displays "Settings Screen" text with no functionality, and isn't even
accessible from navigation.

**Proposed fix:** Remove or implement.

---

### 25. Multiple hook instances firing simultaneously

**Files:** All detail screens (`screens/AccountDetailScreen.tsx`,
`screens/AssetDetailScreen.tsx`, `screens/EnvelopeDetailScreen.tsx`,
`screens/LiabilityDetailScreen.tsx`, `screens/TransactionDetailScreen.tsx`)

Each detail screen calls `useGetAccounts()`, `useGetCategories()`,
`useGetTransactionTypes()`, etc. Each of these hooks creates its own event
subscription via `addEventListener(EVENTS.DATA_CHANGED, ...)`. When a single
data change occurs, **every active instance** of every hook fires a refresh
query. If the user is on `TransactionDetailScreen` (which uses 7+ hooks), one
`emitEvent` triggers 7+ database queries simultaneously.

**Proposed fix:** Long-term, consider a centralized data store or context
providers. Short-term, you could debounce the event handling or memoize at the
context level.

---

## SUMMARY TABLE

| #   | Severity   | Issue                      | File(s)              | Status |
| --- | ---------- | -------------------------- | -------------------- | ------ |
| 15  | **MEDIUM** | Placeholder client ID      | useGoogleDriveBackup | Open   |
| 16  | **LOW**    | Empty menu handlers        | AppBar               | Open   |
| 17  | **LOW**    | Stub screen                | SettingsScreen       | Open   |
| 25  | **LOW**    | Excessive hook re-fetching | All detail screens   | Open   |
