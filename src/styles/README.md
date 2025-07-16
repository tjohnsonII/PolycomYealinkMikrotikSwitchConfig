# CSS Organization

This document describes the modular CSS structure for the Phone Configuration Generator application.

## Structure Overview

The CSS is organized into three main categories:

### 1. Base Styles (`base.css`)
- CSS custom properties (variables)
- Typography
- Common component styles (buttons, inputs, etc.)
- Layout utilities
- Responsive breakpoints

### 2. Component Styles (`components/`)
- **`navigation.css`** - Navigation bar and menu styles
- **`terminal-panel.css`** - Terminal/console component styles
- **`footer.css`** - Footer component styles

### 3. Page Styles (`pages/`)
- **`dashboard.css`** - Dashboard/home page styles
- **`phone-config.css`** - Phone configuration page styles
- **`expansion-modules.css`** - Expansion modules page styles
- **`mikrotik-templates.css`** - MikroTik templates page styles
- **`switch-templates.css`** - Switch templates page styles
- **`reference.css`** - Reference documentation page styles
- **`diagnostic.css`** - Diagnostic tools page styles
- **`import-export.css`** - Import/export functionality page styles

## CSS Variables

All styles use CSS custom properties defined in `base.css`:

### Colors
- `--brand-primary: #3498db` - Primary brand color
- `--brand-secondary: #2ecc71` - Secondary brand color
- `--brand-success: #27ae60` - Success states
- `--brand-warning: #f39c12` - Warning states
- `--brand-danger: #e74c3c` - Error states
- `--brand-info: #3498db` - Info states

### Text Colors
- `--text-primary: #2c3e50` - Primary text
- `--text-secondary: #7f8c8d` - Secondary text
- `--text-white: #ffffff` - White text

### Background Colors
- `--bg-white: #ffffff` - White backgrounds
- `--bg-light: #f8f9fa` - Light gray backgrounds
- `--bg-gray-50: #f9fafb` - Very light gray
- `--bg-gray-100: #f3f4f6` - Light gray
- `--bg-gray-900: #1a1a1a` - Dark gray for terminals

### Borders and Shadows
- `--border-light: #e5e7eb` - Light borders
- `--shadow: 0 2px 10px rgba(0, 0, 0, 0.1)` - Standard drop shadow

## Responsive Design

All CSS files include responsive breakpoints:
- Mobile: `@media (max-width: 768px)`
- Print: `@media print`

## Migration Guide

### From Old CSS to New Modular CSS

1. **Remove inline styles** - Use CSS classes instead
2. **Use CSS variables** - Replace hardcoded colors with variables
3. **Import page-specific CSS** - Each page should import its CSS file
4. **Use consistent naming** - Follow BEM methodology where applicable

### Example Migration

**Old way:**
```css
.my-button {
  background: #3498db;
  color: white;
  padding: 12px 24px;
}
```

**New way:**
```css
.my-button {
  background: var(--brand-primary);
  color: var(--text-white);
  padding: 12px 24px;
}
```

## Adding New Styles

### For New Pages
1. Create a new CSS file in `src/styles/pages/`
2. Follow the naming convention: `page-name.css`
3. Import the CSS file in `App.css`
4. Use the established CSS variables and patterns

### For New Components
1. Create a new CSS file in `src/styles/components/`
2. Follow the naming convention: `component-name.css`
3. Import the CSS file in `App.css`
4. Use the established CSS variables and patterns

## Best Practices

1. **Use CSS Variables** - Always use the defined CSS custom properties
2. **Mobile-First** - Design for mobile, then enhance for desktop
3. **Consistent Spacing** - Use multiples of 4px for spacing
4. **Semantic Class Names** - Use descriptive class names
5. **Component Isolation** - Keep component styles isolated to their files
6. **Print Styles** - Include print-friendly styles for all components

## File Structure

```
src/styles/
├── App.css                     # Main CSS file with imports
├── base.css                    # Base styles and variables
├── inline-styles-fix.css       # Legacy utility classes
├── components/
│   ├── navigation.css          # Navigation component
│   ├── terminal-panel.css      # Terminal component
│   └── footer.css              # Footer component
└── pages/
    ├── dashboard.css           # Dashboard page
    ├── phone-config.css        # Phone configuration page
    ├── expansion-modules.css   # Expansion modules page
    ├── mikrotik-templates.css  # MikroTik templates page
    ├── switch-templates.css    # Switch templates page
    ├── reference.css           # Reference pages
    ├── diagnostic.css          # Diagnostic page
    └── import-export.css       # Import/export page
```

## Maintenance

1. **Regular Review** - Periodically review and clean up unused styles
2. **Performance** - Monitor CSS file sizes and optimize when needed
3. **Consistency** - Ensure new styles follow established patterns
4. **Documentation** - Update this README when adding new CSS files
