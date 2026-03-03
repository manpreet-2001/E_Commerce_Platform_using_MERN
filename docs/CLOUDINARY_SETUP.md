# Cloud Storage (Cloudinary) – Step-by-Step Setup

This project supports **Cloudinary** for product image uploads. When enabled, images are stored in the cloud instead of the server’s `uploads` folder, which is better for production (e.g. Render, Heroku).

---

## Step 1: Create a Cloudinary account

1. Go to [https://cloudinary.com](https://cloudinary.com) and sign up (free tier is enough).
2. Log in and open the **Dashboard**.

---

## Step 2: Get your credentials

1. On the Dashboard you’ll see **Cloud name**, **API Key**, and **API Secret**.
2. Copy these; you’ll add them to the backend `.env` in the next step.

---

## Step 3: Add environment variables (backend)

1. In the **backend** folder, copy `.env.example` to `.env` if you don’t have `.env` yet.
2. Add or update these in **backend/.env**:

```env
USE_CLOUDINARY=true
CLOUDINARY_CLOUD_NAME=your_cloud_name_from_dashboard
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Replace `your_cloud_name_from_dashboard`, `your_api_key`, and `your_api_secret` with the values from the Cloudinary Dashboard.

---

## Step 4: Restart the backend

1. Stop the backend server (Ctrl+C).
2. Start it again: `npm run dev` (or `npm start`).
3. New product image uploads will go to Cloudinary and the API will return Cloudinary URLs (e.g. `https://res.cloudinary.com/...`).

---

## Step 5: Deploying to production

1. In your hosting dashboard (Render, Heroku, etc.), open your backend service **Environment** / **Config Vars**.
2. Add the same variables:
   - `USE_CLOUDINARY` = `true`
   - `CLOUDINARY_CLOUD_NAME` = (from Cloudinary)
   - `CLOUDINARY_API_KEY` = (from Cloudinary)
   - `CLOUDINARY_API_SECRET` = (from Cloudinary)
3. Redeploy the backend. Uploads in production will then use Cloudinary.

---

## Behavior summary

| Setting | Result |
|--------|--------|
| **No Cloudinary vars** or **USE_CLOUDINARY not set** | Images are saved to the backend `uploads` folder (current behavior). |
| **USE_CLOUDINARY=true** and all three Cloudinary vars set | Images are uploaded to Cloudinary; the API returns Cloudinary URLs. |

The frontend does not need changes: it already uses the `url` / `urls` returned by the API, and `getImageUrl()` supports both relative paths and full URLs (including Cloudinary).

---

## Security note

- **Never** commit `.env` or put your **API Secret** in frontend code.
- Keep `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` only in the backend environment.
