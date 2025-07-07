# PolycomYealinkMikrotikSwitchConfig

A modular web app for generating configuration code for Polycom and Yealink phones, as well as templates for FBPX, VPBX, Streeto, Mikrotik, and Switch devices. Built with React, TypeScript, and Vite, this app features dynamic forms, CSV import/export, and customizable static/dynamic templates for various network devices and phone models.

---

## Table of Contents
- [Features](#features)
- [How It Works](#how-it-works)
- [Modular Project Structure](#modular-project-structure)
- [How to Contribute](#how-to-contribute)
- [File-by-File Technical Overview](#file-by-file-technical-overview)
- [Development](#development)
- [Automated Start Script](#automated-start-script)
- [License](#license)

---

## Features
- **Tabbed UI** for easy navigation between device/template types, including a dedicated Reference tab for Polycom/Yealink config legends
- **Dynamic forms** for phone and device configuration
- **Model-specific templates** for Polycom and Yealink (including expansion modules and feature keys)
- **CSV import/export** for FBPX, VPBX, and Streeto tabs (using papaparse)
- **Editable static/dynamic templates** for Mikrotik and Switch devices
- **Graphical preview** for Yealink and Polycom expansion modules (with tooltips and user guidance)
- **Authentication & User Management** with JWT-based security and admin dashboard
- **VPN Diagnostics** with real network connectivity testing to PBX servers
- **Persistent VPN Connection** for dedicated troubleshooting server deployment
- **Fully commented, modular code** for maintainability and easy contribution

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
- **Reference Tab:**
  - Dedicated legend for Polycom and Yealink configuration settings, with tables and feature explanations for both brands.

---

## Modular Project Structure

```
src/
  components/         # Reusable UI (InfoIcon, EditableTable, etc.)
  tabs/               # Each main tab as a component (ExpansionModuleTab, PhoneConfigTab, etc.)
  templates/          # Static config templates (mikrotik, switch, etc.)
  types/              # TypeScript types/interfaces
  utils/              # Shared logic (CSV, config generation, etc.)
  constants/          # Shared constants (icons, tooltips, etc.)
  App.tsx             # Main app, handles layout and tab switching
  main.tsx            # Entry point
```

- Each tab/component manages its own state and logic.
- Shared UI and logic should be imported from `components/`, `utils/`, or `constants/`.
- `App.tsx` should only handle layout, navigation, and tab switching.

---

## How to Contribute

1. **Fork the repo and create a new branch.**
2. **Add or update features:**
   - Add a new tab: create a file in `src/tabs/` and add it to the tab navigation in `App.tsx`.
   - Add shared UI: place reusable components in `src/components/`.
   - Add config templates: place static templates in `src/templates/`.
   - Add shared logic: place utility functions in `src/utils/`.
   - Add or update types: place TypeScript interfaces/types in `src/types/`.
   - Add shared constants: place icons, tooltips, and other constants in `src/constants/`.
3. **Use TypeScript and React best practices.**
4. **Keep components small and focused.**
5. **Use Prettier and ESLint for formatting and linting.**
6. **Add comments for complex logic and UI.**
7. **Submit a pull request with a clear description.**
8. **See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for more details and guidelines.**

---

## File-by-File Technical Overview

### `/src/App.tsx`
- **Main application component.**
- Implements the tabbed UI and manages state for the selected tab.
- Renders the appropriate form/component for each tab (Phone Configs, FBPX, VPBX, Streeto, Mikrotik, Switch, Reference).
- Handles passing props and state to child components.
- Contains high-level and section comments for clarity.
- The Reference tab provides a legend for Polycom and Yealink config settings and features.

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

### Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start all services (recommended):**
   ```bash
   chmod +x start-app.sh
   ./start-app.sh
   ```

3. **Manual development mode:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

### Dedicated PBX Troubleshooting Server Setup

For a dedicated server that maintains persistent VPN connectivity for PBX diagnostics:

1. **Check VPN client compatibility:**
   ```bash
   ./check-vpn-clients.sh
   ```

2. **Set up persistent VPN:**
   ```bash
   ./setup-persistent-vpn.sh
   ```

3. **Install a SAML-compatible VPN client:**
   ```bash
   # Ubuntu/Debian
   sudo apt install network-manager-openvpn-gnome
   
   # Or install OpenVPN Connect
   # Follow instructions from check-vpn-clients.sh
   ```

4. **Connect to VPN manually (for SAML configs):**
   - Import `backend/tjohnson-work.ovpn` into your VPN client
   - Complete SAML authentication
   - Enable auto-reconnect if available

5. **Start the application:**
   ```bash
   ./start-app.sh
   ```

The diagnostic page will now be able to reach PBX servers through the server's VPN connection!

---

## Automated Start Script

The `start-app.sh` script provides a complete application stack with enhanced features:

```bash
chmod +x start-app.sh
./start-app.sh
```

### Services Started:
- **Frontend:** Vite development server (port 3000)
- **Backend:** SSH WebSocket server (port 3001) 
- **Auth:** Authentication server (port 3002)
- **VPN:** Optional persistent VPN connection

### Enhanced Features:
- Process cleanup and port management
- Health checks and auto-recovery
- Dependency validation
- VPN connectivity support
- User management and authentication
- Real network diagnostics

### Configuration:
- Edit `.env` file for custom settings
- Set `ENABLE_PERSISTENT_VPN=true` for dedicated server mode
- Configure admin users and JWT secrets

---

## License
MIT
