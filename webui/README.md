# WebUI - Chat Interface for Carcará

This folder contains the web interface (frontend) for the chat system used in the **Carcará** project — part of the LLM infrastructure running locally on the Santos Dumont supercomputer.

---

## Development Environment

### 1. Install dependencies

```bash
npm install
```

### 2. Run in development mode

```bash
npm run dev -- --host=0.0.0.0
```

> This starts the development server with hot-reload enabled and allows access from other devices on the same network.

---

## Production Deployment

### 1. Install dependencies (if not already done)

```bash
npm install
```

### 2. Build for production

```bash
npm run build
```

> Optimized static files will be generated inside the `dist/` folder.

### 3. Install a static file server (example using `serve`)

```bash
npm install -g serve
```

### 4. Serve the built files

```bash
serve -s dist -l 3000
```

> This starts an HTTP server on port 3000 serving the production build.

---

## Requirements

- Node.js (version 18 or higher recommended)
- npm

---

## Project Structure

- `src/` – Frontend source code
- `dist/` – Production build output (after `npm run build`)
- `public/` – Static public assets
- `Config.ts` – Configuration for chat behavior

---

## Notes

- For real production environments, it is recommended to serve the `dist` folder using a proper web server like **Nginx** or **Caddy**.
- The `--host=0.0.0.0` flag allows access to the interface via the machine's IP address on the local network.
