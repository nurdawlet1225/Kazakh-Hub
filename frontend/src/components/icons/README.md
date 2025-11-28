# SVG Icons

This directory contains reusable SVG icon components using the W3C SVG namespace (`http://www.w3.org/2000/svg`).

## Usage

### Basic Icons

```tsx
import { HomeIcon, UserIcon, SettingsIcon, ChatIcon, UploadIcon } from './components/icons';

function MyComponent() {
  return (
    <div>
      <HomeIcon size={24} className="icon-home" />
      <UserIcon size={32} fill="#007bff" />
      <SettingsIcon size={20} />
    </div>
  );
}
```

### Custom SVG Icon

```tsx
import SvgIcon from './components/SvgIcon';

function CustomIcon() {
  return (
    <SvgIcon viewBox="0 0 24 24" width={24} height={24}>
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </SvgIcon>
  );
}
```

### Loading Icons from External Sources (e.g., oyji.org)

```tsx
import IconLoader from './components/icons/IconLoader';

function ExternalIcon() {
  return (
    <IconLoader
      src="https://oyji.org/path/to/icon.svg"
      size={24}
      className="external-icon"
      fallback={<span>Loading...</span>}
    />
  );
}
```

## Available Icons

- `HomeIcon` - Home navigation icon
- `UserIcon` - User/profile icon
- `SettingsIcon` - Settings/gear icon
- `ChatIcon` - Chat/message icon
- `UploadIcon` - Upload/file icon

## Props

### SvgIcon Props

- `viewBox` (string, default: "0 0 24 24") - SVG viewBox attribute
- `width` (string | number, default: 24) - Icon width
- `height` (string | number, default: 24) - Icon height
- `className` (string) - CSS class name
- `style` (React.CSSProperties) - Inline styles
- `fill` (string, default: "currentColor") - Fill color
- `stroke` (string) - Stroke color
- `strokeWidth` (string | number) - Stroke width
- `children` (React.ReactNode) - SVG path/elements

### IconLoader Props

- `src` (string, required) - URL to external SVG file
- `size` (string | number, default: 24) - Icon size
- `className` (string) - CSS class name
- `fallback` (React.ReactNode) - Fallback content if loading fails
- `viewBox` (string) - Override viewBox if needed

## W3C SVG Namespace

All icons use the proper W3C SVG namespace: `http://www.w3.org/2000/svg`

This ensures compatibility with SVG 1.0, 1.1, 1.2, and SVG 2.0 specifications.





