# Boardify Frontend

## Setup

1. Create project: `npm create vite@latest boardify-frontend -- --template 
react-ts`
2. Copy files from this scaffold.
3. Install deps: `npm install`.
4. Start dev server: `npm run dev`.

## Notes- Backend expectations:- `POST /api/auth/login` returns `{ accessToken, email }` and sets a Secure

HttpOnly refresh cookie.- `POST /api/auth/logout` blacklists tokens and clears refresh cookie server
side.- `POST /api/auth/refresh` reads refresh cookie and returns `{ accessToken }`.- Boards/lists/tasks endpoints as used in code.- Security: access token stored in Redux (memory); refresh token in HttpOnly
cookie.
