# Kazakh Hub

A modern code sharing and collaboration platform built with React and TypeScript.

## Features

- 📤 **Upload Code Files** - Share your code files with the community
- 🔍 **Search & Filter** - Find code by language, tags, or keywords
- 👁️ **View Code** - Syntax-highlighted code viewing with copy/download options
- 👤 **User Profiles** - Track your uploaded files and statistics
- 🎨 **Modern UI** - Beautiful, responsive design with dark mode support
- 📱 **Mobile Friendly** - Works seamlessly on all devices

## Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **React Syntax Highlighter** - Code syntax highlighting

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **CORS** - Cross-origin resource sharing

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd kazakh-hub
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd backend
npm install
cd ..
```

4. Start the backend server (in one terminal):
```bash
cd backend
npm run dev
```

5. Start the frontend development server (in another terminal):
```bash
npm run dev
```

6. Open your browser and navigate to `http://localhost:5173`

**Note:** Backend сервері `http://localhost:3000` адресінде жұмыс істеуі керек.

## Project Structure

```
kazakh-hub/
├── backend/         # Backend API server
│   ├── server.js    # Express server
│   └── package.json
├── public/          # Static assets
├── src/
│   ├── components/   # Reusable UI components
│   ├── pages/       # Page components
│   ├── utils/       # Utility functions and API
│   ├── hooks/       # Custom React hooks
│   └── styles/      # Global styles and themes
├── package.json
└── README.md
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Configuration

### API Configuration

Frontend үшін `.env` файлын құрып, API URL-ін көрсетіңіз:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

**Ескерту:** Егер `.env` файлын құрмасаңыз, frontend әдепкі мән ретінде `http://localhost:3000/api` пайдаланады.

### Backend Configuration

Backend сервері әдепкі түрде `3000` портында жұмыс істейді. Портты өзгерту үшін:

```bash
PORT=4000 npm run dev
```

## Features in Detail

### Code Upload
- Drag and drop file upload
- Support for multiple programming languages
- Add titles, descriptions, and tags
- File size validation

### Code Viewing
- Syntax highlighting for multiple languages
- Line numbers
- Copy to clipboard
- Download code files
- Responsive code editor

### Search & Filter
- Real-time search across titles, content, and descriptions
- Filter by programming language
- Tag-based filtering

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License

