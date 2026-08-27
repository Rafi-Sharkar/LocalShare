# 🚀 LocalShare — Instant Local Wi-Fi File & Text Sharing (Public & 1-to-1 Direct)

**LocalShare** is a high-speed, peer-to-peer web application built with **Next.js**, **Tailwind CSS**, and **Docker** that allows anyone connected to the same Wi-Fi network (Windows, macOS, Linux, iOS, Android) to instantly share files and clipboard text notes with zero configuration.

Supports both **Public LAN Sharing** (accessible to all devices on the Wi-Fi) and **Private 1-to-1 Sharing** (secured directly to a specific device's MAC address / identity).

---

## ✨ Features

- ⚡ **High-Speed LAN Transfers**: Files transfer directly over your local router at maximum Wi-Fi speeds without ever passing through external third-party cloud servers.
- 🔒 **1-to-1 Direct MAC Sharing**: Send files or notes securely to a specific device on your Wi-Fi network. Only the designated recipient can view and download private transfers.
- 🌐 **Public Broadcast Sharing**: Share files and notes with all devices connected to the Wi-Fi simultaneously.
- 📱 **Instant QR Code Connect**: Automatic local network IP discovery and one-click QR code generation. Mobile devices can scan with their camera to connect in 1 second.
- 🔍 **Auto Device Discovery & Naming**: Discovers active Wi-Fi clients and automatically labels them (e.g. *iOS (iPhone)*, *Android*, *Windows PC*, *macOS*). You can rename your device anytime.
- 📂 **Drag-and-Drop File Sharing**: Drag and drop any file or batch of files with live progress tracking, category filtering, and storage statistics.
- 👁️ **In-Browser File Preview**:
  - 🖼️ Images (full zoom/preview)
  - 🎥 Video player (HTML5 streaming player)
  - 🎵 Audio player (with playback controls)
  - 📄 PDF reader
  - 💻 Code & text viewer with syntax highlighting and one-click copy
- 📋 **Quick Notes & Clipboard Sharing**: Share URLs, text notes, credentials, or code snippets across devices with one click.
- 🔄 **Real-Time Live Sync**: Utilizes Server-Sent Events (SSE) so all connected devices update their lists automatically when a new file or note is shared.
- 🐳 **Fully Dockerized**: Production-ready multi-stage `Dockerfile` and `docker-compose.yml` with persistent storage volumes.
- 🌙 **Modern Dark/Light UI**: Built with a glowing glassmorphism aesthetic and responsive mobile-first layouts.

---

## 🛠️ Tech Stack

- **Framework**: Next.js (App Router)
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

## 📖 How to Share: Public vs 1-to-1 Direct Device Sharing

LocalShare gives you two flexible sharing modes for both **Files** and **Quick Notes**:

### 🌐 Mode 1: Public LAN Sharing (Default)
When in Public mode, anything you share is immediately accessible to **all devices** connected to your local Wi-Fi.

1. In the **Files** or **Quick Notes** tab, check that the **Recipient** selector is set to **`🌐 Everyone (Public LAN)`**.
2. Select or drop your files, or enter your text note and tap **Share**.
3. Every connected phone, laptop, or tablet on your Wi-Fi will see the file/note in real time.

---

### 🔒 Mode 2: Direct 1-to-1 Sharing (Specific Device / MAC Address)
When you want to send a file or private note to **only one person/device** (e.g. sending a file from your laptop directly to your phone):

#### Method A: Using the Recipient Selector Dropdown
1. Above the upload area (or note input), tap the **`Recipient:`** dropdown pill.
2. Under **Discovered Devices**, tap the recipient's device (e.g. `📱 iPhone` or `💻 Windows PC`).
   - *(Optional)* You can also type any custom MAC address (e.g. `AA:BB:CC:DD:EE:FF`).
3. The upload area will switch to **`🔒 Direct 1-to-1: [Recipient Name]`**.
4. Drop or select your file. Only that specific device's MAC address will be authorized to view or download it.

#### Method B: Using the Device Manager Modal
1. Tap the **Device Pill** in the top navbar (e.g. `💻 My Device`).
2. View the list of all currently active Wi-Fi devices under **Active LAN Devices**.
3. Tap **"Send Direct"** next to the target device.
4. The file uploader is instantly configured to transfer privately to that device.

---

## 📂 Filtering & Managing Shared Content

In the **Files** section, you can filter your view at any time using the filter tabs:

- **All Files**: Displays all public files plus any 1-to-1 files sent to or by you.
- **🌐 Public**: Shows only public files accessible to everyone.
- **📥 Received (1-to-1)**: Shows private files sent directly to your device from another device.
- **📤 Sent (1-to-1)**: Shows private files you sent to a specific target device.

---

## 📱 Real-World Use Case Scenarios

| Scenario | Mode | Sender Steps | Receiver Steps |
| :--- | :--- | :--- | :--- |
| **📱 iPhone ➔ 💻 PC (Public)** | 🌐 Public | Scan QR code on PC, tap upload box, pick photo/video with Recipient set to `Everyone`. | File appears instantly on PC screen; click **Download** or **Preview**. |
| **💻 PC ➔ 📱 Phone (1-to-1)** | 🔒 1-to-1 | In Recipient dropdown, select your phone. Drop file into upload box. | File pops up with a **🔔 Direct 1-to-1 Received** notification on your phone only. |
| **📋 Private Password / API Key** | 🔒 1-to-1 | Switch to **Quick Notes**, set Recipient to recipient's device, click **Send 1-to-1**. | Note only appears on the recipient's screen; click **Copy**. |
| **🎥 Large 4K Video Transfer** | 🌐 Public / 🔒 1-to-1 | Drop large video into upload zone on PC. | Watch directly via **Preview** or download at full gigabit Wi-Fi speed. |

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
├── next.config.mjs             # Next.js config (standalone mode & 1GB limit)
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
    │       ├── devices/        # Device heartbeat & MAC registration
    │       ├── files/          # Upload & list files (with MAC access control)
    │       ├── files/[id]/     # Download & preview stream
    │       ├── texts/          # Quick notes API (with 1-to-1 targeting)
    │       └── events/         # Server-Sent Events (SSE)
    ├── components/
    │   ├── Navbar.tsx          # Header with device indicator & LAN info
    │   ├── QRCodeModal.tsx     # Dynamic QR code generator
    │   ├── DeviceManagerModal.tsx # LAN device discovery & 1-to-1 selector
    │   ├── FileUploader.tsx    # Drag-and-drop uploader with recipient selector
    │   ├── FileList.tsx        # Grid/list file manager with 1-to-1 filters
    │   ├── FilePreviewModal.tsx# In-browser media & code preview
    │   ├── TextShare.tsx       # Quick clipboard sharing with recipient selector
    │   ├── StorageStats.tsx    # Storage usage widget
    │   └── Toast.tsx           # Notifications
    └── lib/
        ├── network.ts          # Network interface inspector
        ├── devices.ts          # Device presence, ARP resolver, & MAC manager
        ├── storage.ts          # Storage engine & metadata manager
        ├── types.ts            # Client-safe types and formatters
        └── events.ts           # Event bus for SSE
```

---

## 📄 License

MIT License. Open source and free to use for personal or team local sharing.
