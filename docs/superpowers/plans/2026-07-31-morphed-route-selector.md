# Smooth Morphing Route Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the Route & Date selection form into a decoupled `RouteSelectorCard.tsx` component with an iOS-style fluid morphing animation that automatically shrinks into a compact header pill after loading data.

**Architecture:** Add CSS morphing transition classes in `src/index.css`, create `RouteSelectorCard.tsx` component managing expanded vs morphed state, and integrate it seamlessly into `Dashboard.tsx`.

**Tech Stack:** React 19, TypeScript, Lucide React, Vanilla CSS (`cubic-bezier(0.16, 1, 0.3, 1)` transitions).

## Global Constraints

- Must follow strict TypeScript (`strict: true`).
- Must use CSS transitions with `cubic-bezier(0.16, 1, 0.3, 1)` for fluid morphing.
- Must support both Light and Dark themes via CSS variables.
- Must preserve all existing route saving and date selection capabilities.

---

### Task 1: Add Morphing CSS Animations (`src/index.css`)

**Files:**
- Modify: `src/index.css`

**Interfaces:**
- Produces: CSS classes `.morph-selector-container`, `.morph-pill-content`, `.morph-form-content`

- [ ] **Step 1: Append morphing CSS rules to `src/index.css`**

Add the following CSS rules at the bottom of `src/index.css`:
```css
/* Smooth Morphing Selector Card */
.morph-selector-card {
  background: var(--card-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
  overflow: hidden;
  transition: all 0.45s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.morph-selector-card.morphed {
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(30, 41, 59, 0.85);
  border-color: rgba(56, 189, 248, 0.3);
  box-shadow: 0 4px 20px rgba(56, 189, 248, 0.15);
}

[data-theme='light'] .morph-selector-card.morphed {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(37, 99, 235, 0.3);
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.12);
}

.morph-pill-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  animation: fadeIn 0.3s ease forwards;
}

.morph-pill-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}

.morph-pill-badge {
  background: rgba(59, 130, 246, 0.15);
  color: var(--accent-color);
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.morph-pill-edit-btn {
  background: var(--input-bg);
  border: 1px solid var(--card-border);
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;
}

.morph-pill-edit-btn:hover {
  background: var(--accent-color);
  color: #fff;
  border-color: var(--accent-color);
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}
```

- [ ] **Step 2: Verify `pnpm run build`**

Run: `pnpm run build`
Expected: Build passes cleanly.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat(ui): add CSS rules for smooth morphing route selector"
```

---

### Task 2: Morphing Route Selector Component (`src/components/RouteSelectorCard.tsx`)

**Files:**
- Create: `src/components/RouteSelectorCard.tsx`

**Interfaces:**
- Consumes: Route & date selection props from `Dashboard.tsx`
- Produces: `RouteSelectorCard` component

- [ ] **Step 1: Create `src/components/RouteSelectorCard.tsx`**

```tsx
import { useState, useEffect } from 'react';
import { MapPin, Calendar, Edit3, Plus, X, Loader2, ChevronDown } from 'lucide-react';

export interface SavedRoute {
  title: string;
  url: string;
}

interface Props {
  sheetUrl: string;
  setSheetUrl: (url: string) => void;
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
  savedRoutes: SavedRoute[];
  days: string[];
  isLoading: boolean;
  isDataLoaded: boolean;
  onLoadData: () => void;
  onSaveNewRoute: (title: string, url: string) => void;
  onDeleteRoute: (index: number) => void;
}

export function RouteSelectorCard({
  sheetUrl,
  setSheetUrl,
  selectedTab,
  setSelectedTab,
  savedRoutes,
  days,
  isLoading,
  isDataLoaded,
  onLoadData,
  onSaveNewRoute,
  onDeleteRoute
}: Props) {
  const [isMorphed, setIsMorphed] = useState(false);
  const [isAddingRoute, setIsAddingRoute] = useState(false);
  const [newRouteTitle, setNewRouteTitle] = useState('');

  // Auto morph into compact pill when data successfully loads
  useEffect(() => {
    if (isDataLoaded) {
      setIsMorphed(true);
    }
  }, [isDataLoaded]);

  // Find active route title
  const activeRouteObj = savedRoutes.find(r => r.url === sheetUrl);
  const activeRouteTitle = activeRouteObj ? activeRouteObj.title : 'Rute Kostum';

  const handleSaveRoute = () => {
    if (!newRouteTitle.trim() || !sheetUrl.trim()) return;
    onSaveNewRoute(newRouteTitle.trim(), sheetUrl.trim());
    setNewRouteTitle('');
    setIsAddingRoute(false);
  };

  const handleLoadClick = () => {
    onLoadData();
  };

  return (
    <div className={`morph-selector-card ${isMorphed ? 'morphed' : ''}`}>
      {isMorphed ? (
        /* Morphed Compact Pill View */
        <div className="morph-pill-content">
          <div className="morph-pill-info">
            <span style={{ display: 'flex', itemsCenter: 'center', gap: '4px' }}>
              <MapPin size={16} style={{ color: 'var(--accent-color)' }} />
              <b>{activeRouteTitle}</b>
            </span>
            <span className="morph-pill-badge">
              <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
              Tgl {selectedTab}
            </span>
          </div>

          <button
            type="button"
            className="morph-pill-edit-btn"
            onClick={() => setIsMorphed(false)}
          >
            <Edit3 size={13} />
            <span>Ubah</span>
          </button>
        </div>
      ) : (
        /* Expanded Form View */
        <div className="space-y-3">
          <div className="input-group" style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ margin: 0 }}>Pilih Rute</label>
              {!isAddingRoute && (
                <button
                  type="button"
                  onClick={() => setIsAddingRoute(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-color)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Plus size={14} /> Tambah Rute
                </button>
              )}
            </div>

            {savedRoutes.length > 0 && (
              <select
                className="input-field"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                style={{ marginBottom: '8px' }}
              >
                <option value="" disabled>-- Pilih Rute Tersimpan --</option>
                {savedRoutes.map((route, idx) => (
                  <option key={idx} value={route.url}>
                    {route.title}
                  </option>
                ))}
              </select>
            )}

            {isAddingRoute && (
              <div style={{ background: 'var(--input-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--card-border)', marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>Tambah Rute Baru</span>
                  <button type="button" onClick={() => setIsAddingRoute(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <X size={16} />
                  </button>
                </div>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Nama Rute (misal: JAK.76)..."
                  value={newRouteTitle}
                  onChange={(e) => setNewRouteTitle(e.target.value)}
                  style={{ marginBottom: '8px' }}
                />
                <input
                  type="text"
                  className="input-field"
                  placeholder="Link Google Sheets..."
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  style={{ marginBottom: '8px' }}
                />
                <button type="button" className="btn" onClick={handleSaveRoute}>
                  Simpan Rute
                </button>
              </div>
            )}
          </div>

          <div className="input-group" style={{ marginBottom: '16px' }}>
            <label>Pilih Tanggal (Tab)</label>
            <select
              className="input-field"
              value={selectedTab}
              onChange={(e) => setSelectedTab(e.target.value)}
            >
              {days.map(day => (
                <option key={day} value={day}>Tanggal {day}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="btn"
            onClick={handleLoadClick}
            disabled={isLoading || isAddingRoute}
          >
            {isLoading ? <Loader2 className="spinner" size={20} /> : 'Load Data Bus'}
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/RouteSelectorCard.tsx
git commit -m "feat(ui): add RouteSelectorCard component with fluid morphing animation"
```

---

### Task 3: Integration into `src/components/Dashboard.tsx`

**Files:**
- Modify: `src/components/Dashboard.tsx`

**Interfaces:**
- Replaces legacy form inputs in `Dashboard.tsx` with `<RouteSelectorCard>`

- [ ] **Step 1: Replace route selection JSX in `src/components/Dashboard.tsx`**

In `src/components/Dashboard.tsx`:
Import `RouteSelectorCard`:
```tsx
import { RouteSelectorCard } from './RouteSelectorCard';
```

Replace the legacy route input card JSX (around lines 260-330) with:
```tsx
<RouteSelectorCard
  sheetUrl={sheetUrl}
  setSheetUrl={setSheetUrl}
  selectedTab={selectedTab}
  setSelectedTab={setSelectedTab}
  savedRoutes={savedRoutes}
  days={days}
  isLoading={isLoading}
  isDataLoaded={!!busData}
  onLoadData={() => handleLoadData(false)}
  onSaveNewRoute={(title, url) => {
    const updated = [...savedRoutes, { title, url }];
    setSavedRoutes(updated);
    localStorage.setItem('PDO_SAVED_ROUTES', JSON.stringify(updated));
  }}
  onDeleteRoute={(index) => {
    const updated = savedRoutes.filter((_, i) => i !== index);
    setSavedRoutes(updated);
    localStorage.setItem('PDO_SAVED_ROUTES', JSON.stringify(updated));
  }}
/>
```

- [ ] **Step 2: Run `pnpm run build`**

Run: `pnpm run build`
Expected: Build passes cleanly with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat(dashboard): integrate RouteSelectorCard with fluid morphing"
```
