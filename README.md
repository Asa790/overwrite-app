# Overwrite 💖

**Overwrite** is a lightweight web application that lets users record, transform, and release their memories. It provides three main modes:

- **Vent / Overwrite Bad** – Capture a troubling thought and replace it with a positive affirmation.
- **+ Seed Good** – Save a good memory, optionally attaching a photo and caption.
- **🕊️ Let Go** – Review and release past thoughts, celebrating personal growth.
- **⚙️ Manage All** – View, edit, and delete saved memories and custom encouragement quotes.

The app runs as a simple Node.js server and serves a responsive, styled front‑end built with HTML, CSS, and vanilla JavaScript.

---

## Table of Contents

- [Features](#features)
- [Demo](#demo)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Interactive UI** with glassmorphism styling and smooth animations.
- **Memory Management** – Store bad and good memories in an SQLite database (`override.db`).
- **Photo Upload** – Attach images to good memories (client‑side preview, stored as file paths).
- **Quote Library** – Add custom encouragement quotes that appear in the _Let Go_ view.
- **Responsive Design** – Works on desktop and mobile browsers.
- **No Backend Dependencies** beyond Express and SQLite3, making it easy to deploy.

---

## Demo

You can see the app in action by opening the locally hosted site after running the server:

```bash
# After installation (see below)
npm start
```

Then navigate to `http://localhost:3000` in your browser.

---

## Installation

1. **Clone the repository** (or copy the project folder to your machine).
2. **Install Node.js** (v18 or later is recommended).
3. Open a terminal in the project root (`overwrite-app`) and run:

```bash
npm install
```

This will install the required dependencies listed in `package.json` (Express and SQLite3).

4. Ensure you have write permissions in the project folder – the server creates/updates `override.db`.

---

## Usage

```bash
# Start the server
node server.js
```

The server listens on **port 3000** (default) and serves the static files from the `public` directory.

- Open `http://localhost:3000` in a browser.
- Use the UI tabs to add, view, or delete memories.
- All data is persisted in `override.db`.

---

## Project Structure

```
overwrite-app/
├─ public/               # Front‑end assets
│   ├─ index.html        # Main UI markup and styles
│   └─ (optional) assets like images
├─ server.js             # Express server, SQLite handling
├─ override.db           # SQLite database (generated at first run)
└─ README.md            # This file
```

---

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the repository.
2. Create a feature branch:
   ```bash
   git checkout -b feature/my-feature
   ```
3. Commit your changes and push to your fork.
4. Open a Pull Request describing the changes.

---

## License

This project is licensed under the MIT License – see the `LICENSE` file for details.

---

_Enjoy using Overwrite to transform your thoughts!_
