# PDO Mobile v1.1 - UX & Reliability Improvements

**Date**: 2026-07-13
**Topic**: Manual Theme Toggle, Global Offline Banner, & Pull-to-Refresh

## Context & Purpose
PDO Mobile v1.0 heavily relies on OS-level dark mode and provides offline visual cues only when a save action is queued. For v1.1, we are enhancing the field-worker experience by adding manual theme controls and native-app-like network visibility (global offline banner + pull-to-refresh).

## Core Architecture

### 1. Manual Theme Toggle
Currently, the app relies on CSS media queries (`@media (prefers-color-scheme: light)`). We will migrate this to a data-attribute approach.
- **State**: The user's preference will be stored in `localStorage` under the key `PDO_THEME` (`'light'` or `'dark'`).
- **UI**: A new toggle button (Sun/Moon icon) will be added to the `Dashboard.tsx` header.
- **Implementation**: We will add a small script to `index.html` to read `localStorage` and set `document.documentElement.setAttribute('data-theme', theme)` immediately to prevent flickering on load. `index.css` will be updated to use `[data-theme='light']` instead of media queries.

### 2. Global Offline Banner
- **UI**: A sticky/fixed banner at the top of the app that displays a high-contrast warning (e.g., red background) with the text "Koneksi Terputus - Mode Offline Aktif".
- **State**: A new state `isOnline` in `Dashboard.tsx` (or extracted to a hook), initialized with `navigator.onLine`.
- **Implementation**: `useEffect` hooks will listen to `window.addEventListener('online')` and `window.addEventListener('offline')` to dynamically mount/unmount the banner.

### 3. Pull-to-Refresh
To give the PWA a native feel without full page reloads:
- **Interaction**: We will wrap the main content area in `Dashboard.tsx` with a touch-event listener (`onTouchStart`, `onTouchMove`, `onTouchEnd`).
- **Logic**: If the user scrolls to the absolute top (`scrollTop === 0`) and swipes down past a threshold (e.g., 80px), a visual spinner will pull down from the top.
- **Action**: On release (`onTouchEnd`), if the threshold was met, it will trigger the existing `handleLoadData` function to silently refresh the bus list from Google Sheets.

## Scope Check
This scope is strictly focused on UI/UX improvements (Theme, Banner, Touch events) without altering the core Google Sheets syncing mechanism or the existing offline queue logic. It is perfectly sized for the v1.1 release cycle.
