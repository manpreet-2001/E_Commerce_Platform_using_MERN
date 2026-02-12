# Security Alert - MongoDB Credentials Exposed

## ⚠️ CRITICAL: Rotate MongoDB Credentials Immediately

Your MongoDB Atlas connection string was exposed in a GitHub commit. **You must rotate your database password immediately.**

---

## Immediate Actions Required

### 1. Rotate MongoDB Atlas Password (DO THIS NOW)

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Navigate to: **Database Access** → Find user `manpreet123singh987_db_user`
3. Click **Edit** → **Edit Password**
4. Generate a new secure password
5. **Save** the new password securely (you'll need it for Render)

### 2. Update Render Environment Variables

After rotating the password:

1. Go to **Render Dashboard** → Your Backend Service → **Environment**
2. Update `MONGODB_URI` with the new connection string:
   ```
   mongodb+srv://manpreet123singh987_db_user:NEW_PASSWORD@cluster0.bh3sbvy.mongodb.net/citytechstore?retryWrites=true&w=majority&appName=Cluster0
   ```
3. Replace `NEW_PASSWORD` with your new password
4. **Save Changes** (Render will redeploy automatically)

### 3. Update Local `.env` File

Update `backend/.env` with the new password:
```env
MONGODB_URI=mongodb+srv://manpreet123singh987_db_user:NEW_PASSWORD@cluster0.bh3sbvy.mongodb.net/citytechstore?retryWrites=true&w=majority&appName=Cluster0
```

---

## What Was Fixed

✅ **Removed hardcoded MongoDB URI** from `backend/config/db.js`  
✅ **Created `.env.example`** template file (safe to commit)  
✅ **Verified `.env` is in `.gitignore`** (won't be committed)

---

## Prevention

### ✅ DO:
- Store secrets in environment variables only
- Use `.env.example` for templates (with placeholders)
- Never commit `.env` files
- Use Render/Vercel environment variables for production

### ❌ DON'T:
- Hardcode credentials in code
- Commit `.env` files
- Share connection strings in error messages
- Store secrets in README or documentation

---

## Removing from Git History (Optional)

If you want to remove the exposed secret from git history:

```bash
# WARNING: This rewrites history. Only do this if you understand the risks.
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/config/db.js" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (WARNING: This will rewrite remote history)
git push origin --force --all
```

**Note:** This is advanced and can break things. The exposed secret is already in GitGuardian's database, so rotating credentials is more important than removing from history.

---

## After Rotating Credentials

1. ✅ Old password is invalid
2. ✅ New password is only in Render/local `.env`
3. ✅ Code no longer contains hardcoded credentials
4. ✅ Future commits won't expose secrets

---

**Status:** Credentials removed from code. **Action Required:** Rotate MongoDB password immediately.
