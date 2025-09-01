# EHR Resource Viewer

This is a small Next.js app that lists EHR resources from Firestore using TanStack Table and shadcn/ui

- Table shows: Resource Type, Created (absolute), Fetched (relative), and State

- Click any row (or the resource type) to open a details sheet with humanReadableStr and aiSummary

- Includes an optional “Seed demo data” button for local/dev (was developed locally, so best way to demo/verify this works is creating a .env.local file and running it with instructions below)

## Stack

- Next.js 15 (App Router, TypeScript)

- React 18

- Tailwind CSS + shadcn/ui

- TanStack Table v8

- Firebase (Firestore + Anonymous Auth)

## Prerequisites

- Node.js 18+ (Node 20+ recommended)

- A Firebase project with Firestore enabled

## 1) Firebase setup

1. Create a project at https://console.firebase.google.com

2. Add a Web app (</>), copy the config values.

3. Enable Firestore (start in production or test mode).

4. Enable Anonymous Auth
Console → Build → Authentication → Sign-in method → Anonymous → Enable.

## Firestore data model

Collection - ehrResources

Each document follows:
```
// Types used in the app
export interface EHRResourceIdentifier {
  key: string;
  uid: string;
  patientId: string;
}

export enum ProcessingState {
  PROCESSING_STATE_UNSPECIFIED = "PROCESSING_STATE_UNSPECIFIED",
  PROCESSING_STATE_NOT_STARTED = "PROCESSING_STATE_NOT_STARTED",
  PROCESSING_STATE_PROCESSING = "PROCESSING_STATE_PROCESSING",
  PROCESSING_STATE_COMPLETED = "PROCESSING_STATE_COMPLETED",
  PROCESSING_STATE_FAILED = "PROCESSING_STATE_FAILED",
}

export enum FHIRVersion {
  FHIR_VERSION_UNSPECIFIED = "FHIR_VERSION_UNSPECIFIED",
  FHIR_VERSION_R4 = "FHIR_VERSION_R4",
  FHIR_VERSION_R4B = "FHIR_VERSION_R4B",
}

export interface EHRResourceMetadata {
  state: ProcessingState;
  createdTime: string;   // ISO
  fetchTime: string;     // ISO
  processedTime?: string;// ISO
  identifier: EHRResourceIdentifier;
  resourceType: string;  // e.g. "Condition", "AllergyIntolerance"
  version: FHIRVersion;  // e.g. FHIR_VERSION_R4B
}

export interface EHRResourceJson {
  metadata: EHRResourceMetadata;
  humanReadableStr: string;
  aiSummary?: string;
}

export interface ResourceWrapper {
  resource: EHRResourceJson;
}
```
## 2) Configure environment variables

Create .env.local in the project root:
```
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_DOMAIN.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT_ID.appspot.com
NEXT_PUBLIC_FIREBASE_SENDER_ID=YOUR_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID

# Optional: show the "Seed demo data" button
NEXT_PUBLIC_ALLOW_DEMO_SEED=true
```

Note: values are unquoted.

## 3) Install & run
```
npm install
npm run dev
```
Open http://localhost:3000

## 4) Seeding demo data (optional)

If ```NEXT_PUBLIC_ALLOW_DEMO_SEED=true```, you’ll see a “Seed demo data” button on the page.
Clicking it writes a batch of example ```ResourceWrapper``` docs to the ```ehrResources``` collection.

To clear the data, you can delete the ehrResources collection in the Firebase Console

(Firestore Database → Data → ehrResources → ⋮ → Delete collection).

## Main Project structure
```
app/
  layout.tsx         # imports globals.css; wraps the page
  page.tsx           # Firestore query + renders <ResourceTable/>
components/
  ui/*               # shadcn/ui components
src/
  components/
    resource-table.tsx  # TanStack table + details Sheet
    dev-seed.tsx        # "Seed demo data" button (dev only)
  lib/
    firebase.ts         # Firebase init + seed helpers
  types/
    ehr.ts              # TypeScript interfaces for ResourceWrapper
```

Path aliases (see tsconfig.json):

```@/components/*``` → ```./src/components/*``` (then ```./components/*``` as fallback)

```@/lib/*``` → ```./lib/*```, ```./src/lib/*```

```@/types/*``` → ```./src/types/*```

## What the app does

- Reads Firestore in real-time and renders a table of resources.

- Columns

    - Resource Type – clickable to open details

    - Created – absolute time (e.g., 2025-09-01 10:40)

    - Fetched – relative time (e.g., about 2 hours ago)

    - State – styled badge (COMPLETED, PROCESSING, FAILED, etc.)

- Details sheet (right-side panel) shows:

    - Core metadata (type, created, fetched, processed, version, identifiers)

    - humanReadableStr

    - aiSummary (or — if missing)

- Filter input (client-side) by resource type or state

- Sortable headers (default sort by Fetched desc)

## Notes

Tailwind is loaded from app/globals.css with:
```
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- TanStack Table uses flexRender so custom cell JSX (like relative time) actually renders.

- The “Seed demo data” component is gated by NEXT_PUBLIC_ALLOW_DEMO_SEED; set it to false (or remove the variable) for production.

## Firestore Rules (dev-friendly example)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /ehrResources/{id} {
      allow read, write: if request.auth != null; // anonymous auth is OK
    }
  }
}
```

For production, change the rules as needed.

## Troubleshooting

If Styles look plain

- Ensure ```app/layout.tsx``` imports ```./globals.css``` and ```tailwind.config.js``` includes
```./app/**/*.{ts,tsx}```, ```./components/**/*.{ts,tsx}```, ```./src/**/*.{ts,tsx}``` in content.

Not seeing relative times
- Confirm the app renders ```src/components/resource-table.tsx``` (console shows “ResourceTable from src is loaded”) and that the table body is using ```flexRender```.

Auth invalid / API key
- Verify ```.env.local``` values match Firebase → Project settings → Web app config, and Anonymous Auth is enabled.

Scripts
```
npm run dev     # start Next.js (Turbopack)
npm run build   # production build
npm run start   # run production build
```