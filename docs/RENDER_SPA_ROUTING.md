# Fix "Not Found" for /reset-password and other app routes on Render

When you open a link like `https://citytechstore-frontend.onrender.com/reset-password?token=...` (e.g. from the password reset email), Render returns **Not Found** because the static file server looks for a file at `/reset-password` and there isn't one. The React app uses client-side routing: one `index.html` loads and React Router shows the right page based on the URL.

---

## Option 1 (recommended): Use Web Service instead of Static Site

Your repo has a Node server (`frontend/server.js`) that serves the built app and **already returns index.html for all routes** (e.g. `/reset-password`). If the frontend runs as a **Web Service** instead of a Static Site, the reset link works with no extra config.

### Steps on Render

1. Go to [Render Dashboard](https://dashboard.render.com/) → your **frontend** service (**citytechstore-frontend**).
2. Go to **Settings** (left sidebar).
3. If the service type is **Static Site**:
   - You have two choices:
   - **A)** Add the rewrite (Option 2 below), **or**
   - **B)** Delete this Static Site and create a **new Web Service** for the frontend (same repo, same branch) with:
     - **Root Directory:** `frontend`
     - **Build Command:** `npm install && npm run build`
     - **Start Command:** `npm run serve`
     - **Environment:** Add `REACT_APP_API_BASE` = your backend URL (e.g. `https://e-commerce-platform-using-mern.onrender.com`).
   - After the Web Service deploys, use its URL as your frontend URL (and update `FRONTEND_URL` on the backend if needed). The reset password link will work.

---

## Option 2: Keep Static Site – add a Rewrite rule

1. Go to [Render Dashboard](https://dashboard.render.com/) → your **frontend** service (**citytechstore-frontend**).
2. In the left sidebar, click **Redirects/Rewrites** (or open **Settings** and find the "Redirects/Rewrites" section).
3. Click **Add Rule** or **Add Redirect**.
4. Set:
   - **Source Path** (or "From"): `/*`
   - **Destination Path** (or "To"): `/index.html`
   - **Action**: **Rewrite** (must be Rewrite, not Redirect).
5. Save. If asked, redeploy the site.

After this, opening `/reset-password?token=...` will serve `index.html` and the React app will show the reset page.

### Why Rewrite (not Redirect)?

- **Rewrite**: Serves the content of `/index.html` at the requested path. The URL in the browser stays the same (e.g. `/reset-password?token=...`). Correct for SPAs.
- **Redirect**: Sends the browser to a different URL; the `?token=...` can be lost. Do not use for this.

Reference: [Render – Static Site Redirects and Rewrites](https://render.com/docs/redirects-rewrites).
