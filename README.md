# 🎬 Serie Downloader

A premium, modern media center and automated serie downloader built with the Electron-Vite ecosystem. Transform your local library into a professional streaming-like experience with rich metadata, automated downloads, and a sleek, responsive interface.

---

## ✨ Key Features

- **📺 Professional Media Center**: Automatically enriches your videos with thumbnails, descriptions, and ratings.
- **🔗 Direct Download support**: Paste any direct URL to fetch content directly into your organized library.
- **⚡ High-Speed Architecture**: Built on Vite for near-instant development and optimized production bundles.
- **💾 Robust Persistence**: Uses `better-sqlite3` for lightning-fast database operations and reliable history tracking.
- **🚀 Automated Releases**: Integrated with GitHub Actions for automated Windows installer generation.
- **🎨 Modern UI/UX**: Crafted with React, Tailwind CSS, and Framer Motion for premium animations and glassmorphism aesthetics.

---

## 🛠️ Tech Stack

- **Core**: Electron, React, TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS
- **Database**: better-sqlite3
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Networking**: Axios, Playwright (for scraping logic)

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v20 or higher recommended)
- [Git](https://git-scm.com/)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/AmosQuety/Serie-Downloader.git
   cd Serie-Downloader
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Development
Launch the development environment:
```bash
npm run electron:dev
```

---

## 🏗️ Building for Production

To create a standalone professional installer (`.exe`) for Windows:

1. **Enable Developer Mode**: (Recommended) Windows Settings > For developers > Developer Mode: ON.
2. **Run Build**:
   ```bash
   npm run electron:build
   ```
The installer will be generated in the `release/0.0.0` folder.

---

## 📦 Automated Releases (CI/CD)

This project is configured with a automated release pipeline. To publish a new version:
1. Update version in `package.json`.
2. Push your changes.
3. Tag the commit: `git tag v0.1.0`.
4. Push the tag: `git push origin v0.1.0`.

GitHub Actions will automatically build the Windows installer and create a draft release on your repository!

---

## 📄 License
MIT License - Copyright © 2026

---

*Built with ❤️ for the community.*
