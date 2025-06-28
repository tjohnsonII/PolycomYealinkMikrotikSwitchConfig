# PolycomYealinkMikrotikSwitchConfig

A web app for generating configuration code for Polycom and Yealink phones, as well as templates for FBPX, VPBX, Streeto, Mikrotik, and Switch devices. Built with React, TypeScript, and Vite, this app features dynamic forms, CSV import/export, and customizable static/dynamic templates for various network devices and phone models.

---

## Table of Contents
- [Features](#features)
- [How It Works](#how-it-works)
- [File-by-File Technical Overview](#file-by-file-technical-overview)
- [Development](#development)
- [License](#license)

---

## Features
- **Tabbed UI** for easy navigation between device/template types
- **Dynamic forms** for phone and device configuration
- **Model-specific templates** for Polycom and Yealink (including expansion modules and feature keys)
- **CSV import/export** for FBPX, VPBX, and Streeto tabs (using papaparse)
- **Editable static/dynamic templates** for Mikrotik and Switch devices
- **Fully commented code** for maintainability

---

## How It Works

The app uses a tabbed interface to separate configuration generators for different device types. Each tab presents a form or table tailored to the selected device or template. Users can input data, generate configuration code, and (where supported) import/export CSV files for bulk operations. The app is built with React functional components and TypeScript, ensuring type safety and maintainability.

- **Phone Configs Tab:**
  - Select Polycom or Yealink, choose a model, and enter extension, IP, and label information.
  - Generates model-specific configuration code, including expansion module and feature key templates.
- **FBPX/VPBX Tabs:**
  - Dynamic forms for PBX configuration.
  - Support for CSV import/export for bulk editing.
- **Streeto Tab:**
  - Table-based import/export for Streeto device data.
- **Mikrotik/Switch Tabs:**
  - Editable templates for Mikrotik routers and Switches (8/24 port), with fields for hostname and asset tag.

---

## File-by-File Technical Overview

### `/src/App.tsx`
- **Main application component.**
- Implements the tabbed UI and manages state for the selected tab.
- Renders the appropriate form/component for each tab (Phone Configs, FBPX, VPBX, Streeto, Mikrotik, Switch).
- Handles passing props and state to child components.
- Contains high-level and section comments for clarity.

### `/src/main.tsx`
- **Entry point for the React app.**
- Renders the `App` component inside `React.StrictMode` and attaches it to the DOM.
- Imports global styles from `index.css`.
- Fully commented to explain initialization logic.

### `/src/index.css`
- **Global CSS styles** for the app.
- Includes resets, base styles, and layout rules.
- Commented to explain style sections and their purpose.

### `/src/App.css`
- **Component-specific styles** for the `App` and its children.
- Styles for tab navigation, forms, tables, and config output areas.
- Commented for maintainability.

### `/src/MikrotikDynamicTemplate.tsx`
- **Component for Mikrotik router configuration.**
- Provides a form for editing Mikrotik config templates.
- Allows users to customize and copy/paste generated config.
- Uses TypeScript for type safety and is fully commented.

### `/src/SwitchDynamicTemplate.tsx`
- **Component for generic switch configuration.**
- Allows editing of hostname and asset tag.
- Generates switch config templates dynamically.
- Fully commented and type-safe.

### `/src/Switch24DynamicTemplate.tsx`
- **Component for 24-port switch configuration.**
- Similar to `SwitchDynamicTemplate` but tailored for 24-port models.
- Editable fields for hostname and asset tag.
- Fully commented.

### `/src/Switch8DynamicTemplate.tsx`
- **Component for 8-port switch configuration.**
- Similar to `SwitchDynamicTemplate` but tailored for 8-port models.
- Editable fields for hostname and asset tag.
- Fully commented.

### `/src/StrettoImportExportTab.tsx`
- **Component for Streeto tab.**
- Provides a table interface for importing/exporting Streeto device data.
- Supports CSV import/export using papaparse.
- Fully commented and type-safe.

### `/src/.github/copilot-instructions.md`
- **Custom Copilot instructions** for workspace-specific coding guidelines.
- Ensures best practices for React and TypeScript are followed.

### `/README.md` (this file)
- **Project documentation.**
- Explains app features, technical architecture, and file responsibilities.
- Provides setup and usage instructions.

---

## Development

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Start the development server:**
   ```bash
   npm run dev
   ```
3. **Build for production:**
   ```bash
   npm run build
   ```
4. **Preview production build:**
   ```bash
   npm run preview
   ```

---

## License
MIT
