# Croporia — Crop Simulator

A browser-based farm simulator. You pick land size, soil, crop, and weather, then run a day-by-day simulation with growth stages, yield estimates, and optional random events (drought, flood, pests).

## What’s in this folder

| File | Purpose |
|------|---------|
| `index.html` | Page layout and controls |
| `script.js` | Simulation logic |
| `styles.css` | Look and layout |
| `package.json` | Dev tools (Vite) |
| `vite.config.js` | Local server settings |

Fonts and icons load from the internet (Google Fonts, Font Awesome). You need a working connection for those.

## Run it on your computer

### Option A — Recommended (local server)

1. Open **Terminal** (Mac) or **Command Prompt** (Windows).
2. Go to this project folder:

   ```bash
   cd path/to/FarmToHome/crop-simulator
   ```

   Replace `path/to` with the real path (for example `Desktop/FarmToHome/crop-simulator`).

If you are using the simulator from the FarmToHome app, it is embedded from `frontend/public/simulator/index.html` and loaded at `/simulator/index.html`.

3. Install dependencies (only needed the first time, or after cloning):

   ```bash
   npm install
   ```

4. Start the dev server:

   ```bash
   npm run dev
   ```

5. Your browser should open automatically. If not, open the address Terminal shows (usually `http://localhost:5173`).

6. To stop the server, press **Ctrl+C** in Terminal.

### Option B — No Node.js

If you don’t use npm, you can still open `index.html` in your browser (double-click it). Keep `index.html`, `script.js`, and `styles.css` in the **same folder**.

Or, from this folder in Terminal:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080` in your browser.

## Build a static copy (optional)

```bash
npm run build
```

Output goes into the `dist/` folder. You can upload `dist/` to any static host if you want the app online.

---

## Put this project on your GitHub

GitHub is a website that stores your code. You copy your folder from your computer **to** GitHub with **git push**.

### Step 1 — Create an empty repository on GitHub

1. Sign in at [github.com](https://github.com).
2. Click your profile → **Your repositories** → green **New** button.
3. Choose a name (example: `croporia-simulator`).
4. Leave **Add a README** unchecked (this project already has files).
5. Click **Create repository**.

### Step 2 — Connect your folder and upload

GitHub will show you commands. In short, in Terminal (inside this project folder):

- If this folder is **not** a git repo yet:

  ```bash
  git init
  git add .
  git commit -m "Initial commit: Croporia simulator"
  git branch -M main
  git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
  git push -u origin main
  ```

- If it **is** already a git repo, set `origin` to **your** new repo URL (from GitHub), then push:

  ```bash
  git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
  git push -u origin main
  ```

Replace `YOUR_USERNAME` with your GitHub username (for example `gannamanenideepak`) and `YOUR_REPO_NAME` with the repo name you created.

When Git asks you to log in, use your GitHub account or a **Personal Access Token** (GitHub → Settings → Developer settings → Personal access tokens). **Do not** paste tokens into chat or commit them into files.

### Your profile

You can keep all your repos under your account: [github.com/gannamanenideepak](https://github.com/gannamanenideepak).

---

## License

Private / personal project unless you add an open-source license.
