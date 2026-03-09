# Quick Start - 5 Minutes to Running System

## Step 1: Start the System (2 min)

```bash
# Open terminal/command prompt
cd /path/to/your/project

# Start development server
npm run dev

# Output will show:
# ➜  Local:   http://localhost:3000/
```

## Step 2: Open Browser (1 min)

```
Go to: http://localhost:3000
```

You'll see the login screen.

## Step 3: Login (1 min)

```
Username: admin
Password: 222911

Click "Sign In"
```

✅ **You're in!** System is fully functional and offline.

---

## 5-Minute Demo

### Part 1: Create Demo Scenario (2 min)

1. Click **"Frame Analysis"** in left menu
2. Click **"Configure Demo"** (purple button)
3. Click **"New Scenario"**
4. Fill in:
   - **Name**: "Overcrowded Bus"
   - **License Plate**: "KBE 100A"
   - **Occupant Count**: 14
   - Check **"overcrowding"** under Violations
5. Click **"Save Scenario"**
6. Click **"Back to Analysis"**

### Part 2: Analyze Image (3 min)

1. You're back on Frame Analysis page
2. Click the image upload area or drag-drop any image
3. A dropdown appears: **"Select Demo Scenario"**
4. Choose **"Overcrowded Bus"**
5. Click **"Analyze"** (blue button)

**Results show:**
- ✅ License Plate: **KBE 100A** (85% confidence)
- ✅ Occupants: **14** (90% confidence)
- ❌ Violations: **Overcrowding** (CRITICAL - red)

---

## What's Working

✅ **Local Database** - All data stored locally, no internet needed
✅ **Admin Login** - Secure session with 24-hour timeout
✅ **Demo Scenarios** - Create and use test cases instantly
✅ **Real-Time Analysis** - Upload image, get results immediately
✅ **Notifications** - Violations auto-create alerts
✅ **Offline Mode** - Disconnect WiFi, everything still works

---

## Try This

1. **Test Offline**:
   - Disconnect WiFi
   - Refresh browser (Ctrl+R)
   - Everything still works! ✅

2. **Create More Scenarios**:
   - Configure Demo → New Scenario
   - Create "Wrong Lane" scenario
   - Set occupants to 5
   - Check "wrong_lane" violation

3. **Check Notifications**:
   - Click **"Alerts"** tab
   - See all detected violations
   - Try to filter by severity

---

## Phone Camera (Optional)

### Android Users:
1. Download **IP Webcam** app from Google Play
2. Open app, note the Server URL
3. In Live Monitoring, add that URL
4. Click "Analyze" to capture frames

### iOS/Web Users:
1. Get your laptop IP: `ipconfig` (Windows) or `ifconfig` (Mac)
2. On phone, go to: `http://YOUR_LAPTOP_IP:3000`
3. Grant camera permission
4. Use Live Monitoring normally

---

## Key Shortcuts

| Action | Where |
|--------|-------|
| **Login** | http://localhost:3000 |
| **Create Demo** | Frame Analysis → Configure Demo |
| **View Alerts** | Click "Alerts" tab |
| **Check Data** | Press F12 → Application → IndexedDB |
| **Logout** | Top right corner → Click logout icon |

---

## Credentials

```
Username: admin
Password: 222911
Session: 24 hours
Role: admin
```

(Or use: operator / operator123 for operator role)

---

## That's It!

Everything is working. The system is:
- ✅ Fully offline
- ✅ No internet needed
- ✅ All data local
- ✅ Ready to customize

For more details, see:
- **LOCAL_SETUP.md** - Complete documentation
- **PHONE_CAMERA_SETUP.md** - Camera setup guide
- **IMPLEMENTATION_SUMMARY.md** - Technical details

Enjoy! 🚀
