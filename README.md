# Entertainment Passport

A personal media tracking application built with Electron, React, and TypeScript. Keep track of your favorite **movies, video games, music albums, books, and TV shows** in one local, offline-first database.

## Features

* **Multi-Category Tracking:** Dedicated views for Movies, Games, Music, Books, and TV Shows.
* **Search Integration:** Search for new media to add to your collection (powered by external APIs).
* **Local Library:** Uses [Dexie.js](https://dexie.org/) (IndexedDB) to store your data locally on your device—no account required.
* **Data Management:**
    * Sort by Title, Year, or Date Added.
    * Import and Export your entire library as JSON for backup.
* **Cross-Platform:** Runs as a desktop application via Electron.

## Technologies

* **Core:** [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
* **Desktop Wrapper:** [Electron](https://www.electronjs.org/) + [Electron Forge](https://www.electronforge.io/)
* **Database:** [Dexie.js](https://dexie.org/)
* **Styling:** [Bootstrap 5](https://getbootstrap.com/)

## Installation

1.  **Clone the repository** (or unzip the source):
    ```bash
    git clone https://github.com/yourusername/entertainment-passport.git
    cd entertainment-passport
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

## Usage

### Running in Development Mode

You can run the app in a browser (web mode) or as a desktop window (Electron mode).

* **Desktop App (Recommended):**
    ```bash
    npm start
    ```
    *This runs `electron-forge start`.*

* **Web Browser Mode:**
    ```bash
    npm run dev
    ```
    *This runs the Vite development server.*

### Building for Production

To create a distributable file (e.g., `.zip`, `.deb`, `.rpm`) for your operating system:

```bash
npm run make
