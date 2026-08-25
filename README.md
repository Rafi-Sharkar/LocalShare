# 🚀 LocalShare — Instant Local Wi-Fi File & Text Sharing

**LocalShare** is a high-speed, peer-to-peer web application built with **Next.js 14**, **Tailwind CSS**, and **Docker** that allows anyone connected to the same Wi-Fi network (Windows, macOS, Linux, iOS, Android) to instantly share files and clipboard text notes with zero configuration.

---

## ✨ Features

- ⚡ **High-Speed LAN Transfers**: Files transfer directly over your local router at maximum Wi-Fi speeds without ever passing through external third-party cloud servers.
- 📱 **Instant QR Code Connect**: Automatic local network IP discovery and one-click QR code generation. Mobile devices can scan with their camera to connect in 1 second.
- 📂 **Drag-and-Drop File Sharing**: Drag and drop any file or batch of files with live progress tracking, file category tags, and storage stats.
- 👁️ **In-Browser File Preview**:
  - 🖼️ Images (full zoom/preview)
  - 🎥 Video player (HTML5 player)
  - 🎵 Audio player (with playback controls)
  - 📄 PDF reader
  - 💻 Code & text viewer with line numbers and one-click copy
- 📋 **Quick Notes & Clipboard Sharing**: Share URLs, text notes, credentials, or code snippets across devices with one click.
- 🔄 **Real-Time Live Sync**: Utilizes Server-Sent Events (SSE) so all connected devices update their lists automatically when a new file or note is shared.
- 🐳 **Fully Dockerized**: Production-ready multi-stage `Dockerfile` and `docker-compose.yml` with persistent storage volumes.
- 🌙 **Modern Dark/Light UI**: Built with a glowing glassmorphism aesthetic and responsive mobile-first layouts.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Glassmorphism
- **Icons**: Lucide React
- **QR Engine**: `qrcode`
- **Real-time Sync**: Server-Sent Events (SSE)
- **Containerization**: Docker & Docker Compose (Node.js 20 Alpine standalone output)

---

## 🚀 Quick Start

### Method 1: Using Docker (Recommended)

Make sure [Docker Desktop](https://www.docker.com/products/docker-desktop/) is installed and running.

```bash
# Clone or navigate to the project directory
cd LocalShare

# Run with Docker Compose
docker compose up --build
```

Access the application in your browser at `http://localhost:3000` or via your LAN IP `http://<YOUR_LAN_IP>:3000`.

---

### Method 2: Using Node.js / NPM Directly

```bash
# 1. Install dependencies
npm install

# 2. Start the development server (listens on all network interfaces 0.0.0.0)
npm run dev

# Or build and run production:
npm run build
npm run start
```

---

## 📖 How to Send and Receive Files

### 📤 1. How the Sender Sends Files / Notes

#### A. Sending Files from a PC or Mac (Desktop / Laptop):
1. Open `http://localhost:3000` (or `http://<LAN_IP>:3000`) in your browser.
2. Under the **Files** tab, you have two simple ways to send:
   - **Drag & Drop**: Drag any file(s) from your desktop/file explorer and drop them directly onto the dashed upload zone.
   - **File Picker**: Click anywhere inside the upload box to browse and select one or multiple files.
3. You will see a **live progress bar** showing upload percentage.
4. Once completed, your file is instantly available to all other connected devices on the Wi-Fi.

#### B. Sending Files from a Mobile Phone (iPhone / Android):
1. Connect your phone to the same Wi-Fi.
2. Open your phone's **Camera** or QR scanner and scan the QR code displayed on the host PC screen.
3. Tap the link to open LocalShare in Safari or Chrome.
4. Tap the **Upload** area, choose **Photo Library**, **Take Photo/Video**, or **Choose Files**.
5. The file is uploaded immediately and appears on your PC screen in real time.

#### C. Sharing Clipboard Text, Links, or Code Snippets:
1. Switch to the **Quick Notes** tab in the top navigation.
2. Type or click **"Paste from Clipboard"** to insert text, URLs, passwords, or code.
3. Add an optional title and click **"Share Note"**.
4. The note will instantly pop up on all other connected devices.

---

### 📥 2. How the Receiver Receives & Downloads Files / Notes

#### A. Connecting to LocalShare:
1. Ensure your receiving device (MacBook, iPad, Android phone, Windows laptop, etc.) is connected to the **same Wi-Fi network**.
2. **Option 1 (Fastest for Phones & Tablets)**:
   - On the host screen, click **"Connect Device"** or the Wi-Fi IP badge in the top navbar.
   - Scan the QR code with your phone camera.
3. **Option 2 (For Laptops & Desktops)**:
   - Open Safari, Chrome, Edge, or Firefox.
   - Enter the host machine's IP address and port (e.g. `http://192.168.1.45:3000`).

#### B. Receiving & Downloading Files:
1. **Live Real-time Sync**: You do **not** need to refresh the page. As soon as the sender uploads a file, it will automatically appear in your file list.
2. **One-Click Download**:
   - Click the green **"Download"** button on any file card to save it directly to your device's `Downloads` folder.
3. **In-Browser File Preview**:
   - Click the **Eye icon (👁️)** on any file to preview it without downloading:
     - **Images**: High-res view.
     - **Videos**: Stream and play full video directly.
     - **Audio**: Listen with built-in audio player.
     - **PDFs**: Read documents inside the browser.
     - **Code & Text**: View syntax-styled code and copy directly.
4. **Copy Direct Download Link**:
   - Click the **Copy link icon** to get a shareable direct URL (e.g. for sharing via Slack, chat, or curl/wget).

#### C. Receiving & Copying Shared Notes:
1. Open the **Quick Notes** tab.
2. Click the **"Copy"** button next to any note snippet to copy its full contents to your clipboard in 1 click.

---

## 📱 Real-World Use Case Scenarios

| Scenario | Sender Steps | Receiver Steps |
| :--- | :--- | :--- |
| **📱 iPhone ➔ 💻 Windows PC** | Scan QR code on PC, tap upload box, pick photo/video. | File appears instantly on PC screen; click **Download** or **Preview**. |
| **💻 Windows PC ➔ 🍏 Mac** | Drag file into LocalShare on Windows. | Open `http://<WINDOWS_IP>:3000` in Safari on Mac, click **Download**. |
| **📋 Share URL / Wi-Fi Password** | Paste text into **Quick Notes** on any device and click **Share Note**. | On any other device, click **Copy** to paste into browser or settings. |
| **🎥 Large 4K Video Transfer** | Drop large video into upload zone on PC. | Watch directly via **Preview** or download at full gigabit Wi-Fi speed. |

---

## ⚙️ Windows 11 Firewall Configuration

If another device on the Wi-Fi cannot reach the server, ensure Windows Defender Firewall allows Node.js / Docker on Private Networks:

1. Open **Start Menu** -> Search **"Allow an app through Windows Firewall"**.
2. Locate **Node.js JavaScript Runtime** or **Docker Desktop**.
3. Check both **Private** and **Public** boxes.
4. Click **OK**.

---

## 📁 Project Structure

```
LocalShare/
├── Dockerfile                  # Multi-stage Docker build
├── docker-compose.yml          # Docker compose configuration
├── package.json                # Dependencies & scripts
├── next.config.mjs             # Next.js config (standalone mode)
├── tailwind.config.ts          # Tailwind styling & themes
├── tsconfig.json               # TypeScript config
├── run.bat                     # 1-click Windows launcher
├── run.sh                      # 1-click macOS/Linux launcher
├── uploads/                    # Persistent storage for shared files
├── data/                       # Persistent JSON metadata and notes
└── src/
    ├── app/
    │   ├── globals.css         # Theme styles & glassmorphism
    │   ├── layout.tsx          # HTML wrapper & Google fonts
    │   ├── page.tsx            # Main application UI & real-time sync
    │   └── api/
    │       ├── network-info/   # Discovers active Wi-Fi LAN IP
    │       ├── files/          # Upload & list files
    │       ├── files/[id]/     # Download & preview stream
    │       ├── texts/          # Quick notes API
    │       └── events/         # Server-Sent Events (SSE)
    ├── components/
    │   ├── Navbar.tsx          # Header with LAN IP badge
    │   ├── QRCodeModal.tsx     # Dynamic QR code generator
    │   ├── FileUploader.tsx    # Drag-and-drop uploader with progress
    │   ├── FileList.tsx        # Grid/list file manager
    │   ├── FilePreviewModal.tsx# In-browser media & code preview
    │   ├── TextShare.tsx       # Quick clipboard sharing
    │   ├── StorageStats.tsx    # Storage usage widget
    │   └── Toast.tsx           # Notifications
    └── lib/
        ├── network.ts          # Network interface inspector
        ├── storage.ts          # Storage engine & metadata manager
        ├── types.ts            # Client-safe types and formatters
        └── events.ts           # Event bus for SSE
```

---

## 📄 License

MIT License. Open source and free to use for personal or team local sharing.
