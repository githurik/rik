# Phone Camera Integration Guide

Your Road Compliance Smart System supports live frame capture from your phone camera. Here are the setup options:

## Option 1: Android (Recommended - Simple HTTP Streaming)

### Requirements:
- Android phone (API 21+)
- WiFi connection to same network as your laptop

### Setup Steps:

1. **Install IP Webcam App** (Free)
   - Download from Google Play Store: "IP Webcam" by Pavel Khlebovich
   - Open the app on your Android phone

2. **Configure in App**
   - Go to Settings → Video resolution (set to 1280x720 for best performance)
   - Enable "Auto-focus"
   - Note the **Server URL** shown at the bottom (e.g., `http://192.168.x.x:8080`)

3. **Start Server**
   - Tap "Start server" button
   - Keep phone on same WiFi network as laptop

4. **Configure in Admin Panel**
   - In Frame Analysis page, click "Configure Demo"
   - Add demo scenarios with expected results
   - Or use Live Monitoring page to capture frames automatically

5. **Access in Admin Panel**
   - Use the server URL from step 2
   - Example: `http://192.168.x.x:8080/video.mjpg`

### Testing Connection:
```bash
# Open in terminal to test video stream
curl http://192.168.x.x:8080/video.mjpg -o test_stream.mjpg

# View in browser
# Navigate to: http://192.168.x.x:8080
```

## Option 2: iOS (Web-based)

### Requirements:
- iPhone with iOS 13+
- WiFi connection to same network

### Setup Steps:

1. **Use Safari Native Camera**
   - Open Safari on iPhone
   - Navigate to: `http://<laptop-ip>:3000/camera` (when you run local server)
   - Allow camera permissions

2. **Stream Option: Use RTMP App**
   - Download "StreamLabs" or "Larix Broadcaster" (Free)
   - Configure RTMP server (optional advanced setup)

3. **Simpler Option: Screen Share**
   - Use AirPlay to mirror iPhone to Mac
   - Then capture from Mac using system tools

## Option 3: Browser-based (Works on Both)

### Setup on Phone:
1. Open phone's browser
2. Navigate to your laptop IP: `http://192.168.x.x:3000`
3. Go to "Live Monitoring" section
4. Click "Add Camera" and select "Use Phone Camera"
5. Grant camera permissions
6. Camera will start streaming to the admin panel

## Running Laptop HTTP Server

To enable phone to connect to your laptop:

```bash
# Ensure development server is running
npm run dev

# Server will be available at: http://localhost:3000
# For phone connection, use your laptop IP instead of localhost
# Find your IP:
#   Windows: ipconfig (look for IPv4 Address)
#   Mac/Linux: ifconfig (look for inet)
```

## Example Setup Walkthrough

### Step 1: Get Laptop IP
```bash
# Mac/Linux
ifconfig | grep "inet " | grep -v "127.0.0.1"

# Windows
ipconfig | find "IPv4"
# Output example: 192.168.1.100
```

### Step 2: Start Admin Panel
```bash
cd /path/to/project
npm run dev
# Admin panel runs at http://localhost:3000
```

### Step 3: Connect Phone
- **Android**:
  - Open IP Webcam app
  - Start server
  - Note the URL shown (e.g., http://192.168.1.50:8080)
  - In admin panel, use this URL when adding camera

- **iOS**:
  - Open browser on iPhone
  - Navigate to: http://192.168.1.100:3000
  - (Replace 192.168.1.100 with your actual laptop IP)

### Step 4: Test Frame Analysis
1. In admin panel, go to "Live Monitoring"
2. Add camera (uses phone camera)
3. Click "Start" to begin monitoring
4. Click "Analyze" to capture and analyze a frame
5. Results appear in real-time

## Firewall Configuration

If phone can't connect, check firewall:

### Windows Firewall:
1. Windows Defender Firewall → Allow an app through firewall
2. Allow your development server (node.exe)

### Mac Firewall:
1. System Preferences → Security & Privacy → Firewall Options
2. Add your development app

## Troubleshooting

### Phone can't connect to laptop
- Ensure both on same WiFi network
- Check laptop IP is correct
- Disable any VPN
- Restart router

### IP Webcam stream not showing
- Verify "Start server" is clicked
- Check phone is on same WiFi
- Try accessing directly in browser: http://phone-ip:8080
- Restart IP Webcam app

### Frame analysis not working
- Verify camera stream is accessible
- Check admin panel console for errors (F12)
- Try with sample image first in "Frame Analysis" tab

### Performance issues
- Reduce video resolution in IP Webcam settings
- Move phone closer to WiFi router
- Close other heavy apps on phone

## Demo Scenario Quick Start

1. **Login** with `admin / 222911`
2. Go to **Frame Analysis** tab
3. Click **Configure Demo** button
4. Create scenarios:
   - Name: "Overcrowded Vehicle"
   - License Plate: "KBE 100A"
   - Occupants: 14
   - Violations: Check "overcrowding"
5. Save scenario
6. Back in Analysis, upload any image
7. Select your demo scenario from dropdown
8. Click "Analyze" - results will show your configured data

## Pro Tips

- **For presentations**: Pre-configure demo scenarios with realistic data
- **For testing**: Use Android IP Webcam for reliable streaming
- **For quick demo**: Just use browser camera on same device (no phone needed)
- **Multiple cameras**: Add multiple IP Webcam instances (different ports) to monitor different angles

## Support

If you encounter issues:
1. Check browser console (F12)
2. Verify network connectivity
3. Restart development server
4. Clear browser cache (Ctrl+Shift+Delete)
5. Check that IndexedDB is not full (Admin tools → Application → IndexedDB)

---

**Remember**: Everything runs locally on your laptop. No internet required after initial setup!
