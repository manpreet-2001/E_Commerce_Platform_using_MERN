# Fix: "Could not connect to any servers" (MongoDB Atlas)

This error means **your current IP is not allowed** to connect to your Atlas cluster. Fix it in the Atlas dashboard.

## Steps (do this first)

1. **Open MongoDB Atlas**  
   Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) and log in.

2. **Open Network Access**  
   In the left sidebar, click **Network Access** (under "Security").

3. **Add your IP**
   - Click **"+ ADD IP ADDRESS"**.
   - Click **"ADD CURRENT IP ADDRESS"** so Atlas fills in your current IP.
   - Optionally add a label (e.g. "Home" or "School").
   - Click **"Confirm"**.

4. **Wait 1–2 minutes**  
   Atlas can take a short time to apply the change.

5. **Restart your backend**  
   In the project folder run:
   ```bash
   cd backend
   npm run dev
   ```

You should see: `✅ MongoDB Connected: ...` and no crash.

---

## If you change networks (e.g. different Wi‑Fi or mobile hotspot)

Your IP will change. Either:

- Add the new IP in **Network Access** the same way, or  
- For **development only**, you can allow all IPs: in "ADD IP ADDRESS" enter `0.0.0.0/0` and confirm. (Do not use this for production.)

---

## Also check

- **Connection string in `.env`**  
  Use the exact URI from Atlas: **Connect → Drivers → Node.js**. Replace `<password>` with your DB user password. If the password has special characters (e.g. `#`, `@`, `%`), [URL‑encode](https://www.w3schools.com/tags/ref_urlencode.asp) them (e.g. `#` → `%23`).
- **Database user**  
  In Atlas: **Database Access** → your user must have at least "Read and write to any database" (or "Atlas admin") for the cluster.
