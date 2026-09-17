# KioskBot Frontend

Minimal setup to install and run the app with pnpm.

## Quickstart

1. ### Prerequisites

- Node.js 18+ and pnpm installed
  - Windows Setup
    - Run Windows Powershell (64bit) in Administrator mode
    ```
    Set-ExecutionPolicy Bypass -Scope Process -Force; & "C:\PATH TO Project\kioskbot_frontend\setup\install_node.ps1" "C:\C:\PATH TO Project\kioskbot_frontend\setup"

    ```
  - Mac Setup (with brew)
    ```
    chmod +x ./setup/install_node.sh
    ./setup/install_node.sh
    ```
  - Note that the scripts already installs the dependencies and therefore there is **no** need to run `pnpm install` again.

2. ### Configure environment

- Copy `.env.example` to `.env` and set the backend URL:
- `PUBLIC_API` — the backend base URL (including protocol), e.g. `https://your-backend.example.com`

3. ### Start the dev server

```pwsh
pnpm dev
```

If on windows, execution policy restrictions are present, run
`Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`

The app will be available on http://localhost:5173 (default).

## Build and preview

```pwsh
pnpm build
pnpm preview
```

## Useful scripts

- `pnpm check` — Svelte type checks
- `pnpm lint` — Prettier check + ESLint
- `pnpm format` — Format files with Prettier

## Environment variables

- `PUBLIC_API` is required and is exposed to the browser. Make sure it points to your backend (and that CORS is configured accordingly).
