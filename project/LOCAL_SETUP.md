# Road Compliance Smart System - Local Setup & Offline Guide

Complete guide to run the system locally on your laptop with offline capability, local database, and phone camera integration.

## Quick Start (5 minutes)

### Prerequisites
- Node.js 16+ installed
- Any modern browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# 1. Navigate to project folder
cd /path/to/project

# 2. Install dependencies (if not already done)
npm install

# 3. Start development server
npm run dev

# 4. Open browser
# Navigate to: http://localhost:3000

# 5. Login
# Username: admin
# Password: 222911
```

That's it! System runs fully offline with local database.

---

## What's Included

### Local Database (IndexedDB)
- **No internet required** - runs entirely in browser
- **No Supabase** - all data stored locally on laptop
- **Automatic sync** - changes save instantly
- **Tables included**:
  - Analysis Results (frame analysis history)
  - Notifications (violation alerts)
  - Demo Scenarios (pre-configured test cases)
  - Vehicles (vehicle database)
  - Violations (violation logs)
  - Alerts (alert history)

### Admin Login
- **Hardcoded credentials**: `admin` / `222911`
- **Session management** - 24 hour session timeout
- **Logout button** - top right of screen
- **Role-based** - admin and operator roles

### Demo Scenario Manager
- **Pre-configure test cases** for presentations
- **Create multiple scenarios** with different violations
- **Instant analysis** - click analyze to get predefined results
- **No AI required** - pure demo mode for testing

### Frame Analysis Features
- **Image upload** - drag and drop or click to select
- **Demo scenarios** - dropdown to select pre-configured test case
- **Real-time results** - plate, occupants, violations detected
- **Analysis history** - view last 10 analyses
- **Offline compatible** - works without internet

---

## System Features Breakdown

### 1. Admin Login Page
```
URL: http://localhost:3000
- Username: admin
- Password: 222911
- OR: operator / operator123
```

Login persists for 24 hours. Data encrypted in browser storage.

### 2. Dashboard View
Overview of all system metrics:
- Total vehicles monitored
- Violations detected
- Notifications pending
- System status

### 3. Live Monitoring
**Features:**
- Add camera feeds (supports phone cameras)
- Start/stop monitoring
- Real-time detection display
- Frame-by-frame analysis toggle
- Multi-camera grid layout

**Phone Camera Options:**
1. **Android**: IP Webcam app (see PHONE_CAMERA_SETUP.md)
2. **iOS**: Browser-based camera
3. **Web**: Use browser camera directly

### 4. Frame Analysis
**Key features:**
- Upload any image
- Select demo scenario (optional)
- Instant analysis
- Results stored in local database
- Configure new demo scenarios on the fly

**Demo Scenario Manager:**
```
In Frame Analysis page:
1. Click "Configure Demo" button
2. Create new scenario:
   - Name: "Overcrowded Vehicle"
   - License Plate: "KBE 100A"
   - Occupant Count: 14
   - Violations: [overcrowding]
3. Save
4. Select in dropdown when analyzing images
```

### 5. Vehicles & Violations
Database of registered vehicles and violations:
- View all registered vehicles
- Check violation history
- Search by license plate
- Filter by date range

### 6. Notifications
Real-time violation alerts:
- Auto-created when violations detected
- Color-coded by severity
- Mark as read
- Delete notifications
- Filter by critical/high/unread

### 7. Alerts
SMS/Email alert management (mock):
- View alert history
- Check delivery status
- Filter by type/status

---

## Phone Camera Setup

### Option 1: Android (Easiest)

**Requirements:** Android phone with IP Webcam app

```bash
# 1. Download app
# Google Play Store: Search "IP Webcam" by Pavel Khlebovich

# 2. Open app on phone
# Note the Server URL shown (e.g., http://192.168.1.50:8080)

# 3. Start server (tap "Start server" button)

# 4. In admin panel
# Live Monitoring → Add Camera
# Paste the server URL

# 5. Start monitoring and click "Analyze" to capture frames
```

### Option 2: iOS or Browser Camera

```bash
# 1. Get your laptop IP
# Windows: ipconfig | find "IPv4"
# Mac: ifconfig | grep "inet "

# 2. On phone, open browser
# Navigate to: http://YOUR_LAPTOP_IP:3000

# 3. Go to Live Monitoring
# Grant camera permissions
# Camera streams directly to admin panel

# 4. Click "Analyze" to capture frames for analysis
```

### Option 3: Same Device (No Phone Needed)

```bash
# Just use your laptop/desktop browser camera
# In Live Monitoring → Add Camera
# Select "Use Computer Camera"
# Works immediately
```

---

## Demo Presentation Walkthrough

Perfect for showcasing to clients:

### Setup (5 minutes before demo)

1. **Create demo scenarios**:
   ```
   Frame Analysis → Configure Demo → Create Scenario:

   Scenario 1: "Overcrowded Minibus"
   - Plate: KBE 100A
   - Occupants: 14 (exceeds limit)
   - Violation: overcrowding (CRITICAL)

   Scenario 2: "Wrong Lane"
   - Plate: KCA 200B
   - Occupants: 5
   - Violation: wrong_lane (HIGH)

   Scenario 3: "Unsafe Load"
   - Plate: KDA 300C
   - Occupants: 3
   - Violations: unsafe_loading, wrong_lane (HIGH)
   ```

2. **Pre-add test vehicles** (optional):
   - Vehicles → Register test plates

### Demo Flow

**Part 1: Login & Overview** (2 min)
```
1. Show login screen (admin / 222911)
2. Login
3. Show dashboard with stats
4. Explain: "Everything runs locally offline"
```

**Part 2: Configure Demo** (3 min)
```
1. Go to Frame Analysis
2. Click "Configure Demo"
3. Show how to create scenarios
4. Create "Overcrowded Vehicle" scenario
5. Save and return
```

**Part 3: Analyze Image** (5 min)
```
1. Upload any vehicle image (or demo image)
2. Select "Overcrowded Vehicle" scenario
3. Click "Analyze"
4. Show results:
   - License plate detected
   - 14 occupants detected (exceeds limit of 5)
   - Violation: "Overcrowding" marked CRITICAL
5. Show notification auto-created in Alerts tab
```

**Part 4: Live Monitoring** (5 min)
```
1. Go to Live Monitoring
2. Click "Start" (starts mock camera)
3. Explain frame-by-frame analysis
4. Click "Analyze" button
5. Show real-time violations in detection list
```

**Part 5: Offline Capability** (1 min)
```
1. Disconnect internet (turn off WiFi)
2. Refresh page (works normally)
3. Analyze another image
4. Show data persists without internet
5. Reconnect internet
```

---

## Technical Details

### Data Storage
```
Browser IndexedDB:
├── analysisResults (frame analysis history)
├── notifications (violation alerts)
├── vehicles (vehicle registry)
├── violations (violation logs)
├── alerts (alert history)
└── demoScenarios (pre-configured test cases)
```

### Local Offline Storage
- **No backend required** - everything in browser
- **No API calls** - pure client-side
- **Auto-save** - changes save immediately
- **24-hour session** - login persists
- **Cross-tab sync** - works across browser tabs

### Session Management
```
Location: localStorage
Key: rc_admin_session
Data: {
  userId: "222911",
  username: "admin",
  role: "admin",
  loginTime: timestamp
}
```

### Demo Data Storage
```
IndexedDB → demoScenarios store
Each scenario:
{
  id: string,
  name: string,
  licensePlate: string,
  occupantCount: number,
  violations: string[],
  plateConfidence: number,
  occupantConfidence: number,
  description: string
}
```

---

## Troubleshooting

### Login Issues
**Problem:** "Invalid credentials"
**Solution:**
- Username must be: `admin`
- Password must be: `222911`
- Check caps lock

### Data Not Saving
**Problem:** Analysis results disappear
**Solution:**
- Check if logged in (should see username in top right)
- Check browser console for errors (F12)
- Try clearing cache (Ctrl+Shift+Delete)

### Camera Not Working
**Problem:** "Camera permission denied"
**Solution:**
- Check browser permissions (top address bar)
- Click camera icon → allow permission
- Refresh page after allowing

**Problem:** "Phone can't connect to admin panel"
**Solution:**
- Ensure both on same WiFi
- Check firewall isn't blocking
- Use correct laptop IP (not localhost)
- Restart development server

### IndexedDB Full
**Problem:** "Storage quota exceeded"
**Solution:**
- Go to DevTools → Application → Storage
- Click "Clear site data"
- Refresh page

### Session Timeout
**Problem:** "Logged out after 24 hours"
**Solution:**
- Login again with same credentials
- Session auto-renews when you login

---

## Performance Optimization

### For Presentations
1. Pre-create demo scenarios before showing
2. Use lower resolution images for faster analysis
3. Close other browser tabs to free memory
4. Disable auto-sync in DevTools (F12 → Console)

### For Production Use
1. Regularly backup IndexedDB data
2. Implement data export feature (coming soon)
3. Monitor browser storage usage
4. Clear old notifications monthly

---

## FAQ

**Q: Do I need internet?**
A: No! Everything runs offline on your laptop.

**Q: Is there a server?**
A: No server needed. Just browser + IndexedDB.

**Q: Can multiple people use it?**
A: Currently single-user. One login session per browser.

**Q: Where's my data?**
A: All in browser's IndexedDB. Never sent anywhere.

**Q: How do I backup data?**
A: Export from DevTools → Application → IndexedDB → Export as JSON

**Q: Can I use this on mobile?**
A: Yes! Open http://laptop-ip:3000 on phone browser.

**Q: What if I clear browser cache?**
A: Data in IndexedDB persists. Only session cookies cleared.

**Q: How long does session last?**
A: 24 hours from login. Auto-logout after that.

**Q: Can I add more admin users?**
A: Yes, edit src/lib/auth.ts (see HARDCODED_ADMINS array)

---

## Command Reference

```bash
# Start development server
npm run dev
# Runs on http://localhost:3000

# Build for production
npm run build
# Creates dist/ folder ready for deployment

# Type checking
npm run typecheck
# Checks for TypeScript errors

# Linting
npm run lint
# Checks code style
```

---

## File Structure

```
project/
├── src/
│   ├── lib/
│   │   ├── localDb.ts          (IndexedDB operations)
│   │   ├── auth.ts             (Login/session management)
│   │   └── supabase.ts         (removed, but file kept)
│   ├── contexts/
│   │   ├── AuthContext.tsx     (Auth state)
│   │   └── DashboardContext.tsx (Navigation state)
│   ├── components/
│   │   ├── LoginPage.tsx       (Login screen)
│   │   ├── Header.tsx          (Top bar with logout)
│   │   ├── Sidebar.tsx         (Navigation)
│   │   ├── DemoScenarioManager.tsx (Create test cases)
│   │   └── views/ (Dashboard, Monitoring, Analysis, etc)
│   ├── App.tsx                 (Main app with auth)
│   └── main.tsx                (Entry point)
└── [Config files]
```

---

## Deployment Options

### Option 1: Local Only (Current)
- Access via http://localhost:3000
- Work on laptop only

### Option 2: Network Access
- Run on laptop
- Access via http://laptop-ip:3000 from any device on network
- Same local database

### Option 3: Docker
```bash
docker build -t road-compliance .
docker run -p 3000:3000 road-compliance
```

### Option 4: Web Server
```bash
# Build
npm run build

# Upload dist/ to web server
# Or serve locally with Python:
cd dist
python -m http.server 3000
```

---

## Next Steps

1. **Customize admin users**: Edit `src/lib/auth.ts`
2. **Add more violation types**: Edit `DemoScenarioManager.tsx`
3. **Export data**: Implement IndexedDB export feature
4. **Real AI integration**: Replace mock analysis with actual API
5. **Multi-user support**: Add user management

---

## Support & Issues

Check the project structure and logs:

```bash
# View browser console
Press F12 in browser

# Check errors
Console tab shows all errors

# Check stored data
DevTools → Application → IndexedDB → RoadComplianceDB

# Check session
DevTools → Application → Local Storage → rc_admin_session
```

---

**Ready to go!** Your Road Compliance Smart System is fully set up for offline, local-only operation. No internet required!
