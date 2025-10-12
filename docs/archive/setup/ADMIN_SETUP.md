# Admin User Setup Guide

## Issue: Dashboard Shows "Consumer" Instead of "Admin"

The user role is cached in browser localStorage. Here's how to fix it:

### Option 1: Clear Browser Cache (Recommended)

1. **Logout** from the app
2. **Clear browser localStorage**:
   - Press `F12` to open Developer Tools
   - Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
   - Find **Local Storage** → `https://frontend-two-swart-31.vercel.app`
   - Delete the `performile-auth` entry
   - Close Developer Tools
3. **Login again** with `admin@performile.com` / `Test1234!`
4. Role should now show as **Admin**

### Option 2: Force Logout/Login

1. Click **Logout** in the app
2. **Login again** with `admin@performile.com` / `Test1234!`
3. The new login will fetch fresh user data from the database

### Option 3: Hard Refresh

1. Press `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)
2. This clears the cache and reloads the page
3. Login again if needed

## Verify Admin Role

After logging in, check the JWT token:
1. Open Developer Tools (F12)
2. Go to **Application** → **Local Storage**
3. Look for the token (or check Network tab → `/api/auth` response)
4. Decode the JWT at https://jwt.io
5. Verify it contains: `"role": "admin"`

## Admin Features Available

Once logged in as admin, you have access to:

- **User Management**: `/api/admin/users`
  - View all consumers, merchants, couriers
  - See subscription details
  - Filter by role and status

- **Review Validation**: `/api/admin/reviews`
  - View reviews without tracking numbers
  - Discard invalid reviews

- **Analytics**: `/api/admin/analytics`
  - Courier performance metrics
  - Filter by time, location, postal code
  - Compare all couriers
  - Rankings and insights

## Database Scripts Run

Make sure you've run these in Supabase:

1. ✅ `supabase-setup-minimal.sql` - Database schema
2. ✅ `disable-rls.sql` - Disable RLS for API access
3. ✅ `create-test-users.sql` - Create test users
4. ✅ `fix-admin-user.sql` - Fix admin role
5. ✅ `add-admin-features.sql` - Add admin views and functions
6. ✅ `seed-demo-data.sql` - Populate demo data

## Troubleshooting

### Still showing "Consumer"?
- Clear all browser data for the site
- Try incognito/private browsing mode
- Check database: `SELECT email, user_role FROM Users WHERE email = 'admin@performile.com'`

### Admin endpoints return 403?
- Verify JWT token has `"role": "admin"`
- Check browser console for errors
- Ensure you're logged in with admin@performile.com

### Can't login?
- Verify database connection in Vercel environment variables
- Check Supabase is not paused
- Run `fix-admin-user.sql` again
