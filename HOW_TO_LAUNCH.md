# How to Launch Parla Italiano

There are **3 easy ways** to launch your Italian learning app:

---

## 🎯 Option 1: Desktop Shortcut (RECOMMENDED)

**One-time setup** (takes 1 minute):

1. **Right-click** `create-desktop-shortcut.ps1` in this folder
2. Click **"Run with PowerShell"**
3. If prompted about execution policy, type `Y` and press Enter
4. A shortcut appears on your Desktop!

**Daily use**:
- Double-click "Parla Italiano" icon on your Desktop
- Browser opens automatically
- Start learning!

**Features**:
- ✅ Auto-opens browser
- ✅ Shows colored status messages
- ✅ Checks dependencies
- ✅ One-click launch

---

## 🚀 Option 2: Simple Batch File (EASIEST)

**No setup needed!**

1. Double-click `start.bat` in this folder
2. Browser opens in 3 seconds
3. Start learning!

**Features**:
- ✅ No setup required
- ✅ Auto-opens browser
- ✅ Checks dependencies
- ✅ Simple and reliable

---

## 💻 Option 3: Command Line (CLASSIC)

If you prefer the command line:

1. Open Command Prompt or PowerShell
2. Navigate to this folder:
   ```
   cd "C:\Users\c_clo\OneDrive\Personal\Coding\italian\parla-italiano"
   ```
3. Run:
   ```
   npm run dev
   ```
4. Open browser to: http://localhost:3000

---

## ❓ Troubleshooting

### "Scripts are disabled on this system"

If you get this error when running PowerShell scripts:

1. Open PowerShell **as Administrator**
2. Run:
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
3. Type `Y` and press Enter
4. Close PowerShell
5. Try again!

### Port 3000 already in use

If you see "Port 3000 is already in use":
1. Close any previous instance of the app
2. Or use a different port: `npm run dev -- -p 3001`

### Dependencies not installed

If you see errors about missing packages:
1. Run: `npm install`
2. Then try launching again

---

## 🎨 Customizing the Desktop Shortcut

Want a custom icon?

1. Right-click the "Parla Italiano" shortcut
2. Click **Properties**
3. Click **Change Icon**
4. Browse for an `.ico` file or choose from Windows icons
5. Click OK!

---

## 📌 Pin to Taskbar

For super-easy access:

1. Right-click the Desktop shortcut
2. Click **"Pin to taskbar"**
3. Now launch from your taskbar with one click!

---

## 🎯 Which Option Should You Use?

| Option | Best For | Setup Time | Features |
|--------|----------|------------|----------|
| **Desktop Shortcut** | Daily use | 1 minute | Auto-browser, colored output |
| **Batch File** | Quick start | 0 seconds | Simple, reliable |
| **Command Line** | Developers | 0 seconds | Full control |

**Recommendation**: Use **Desktop Shortcut** for the best experience!

---

## 🔥 Quick Start (TL;DR)

1. Double-click `start.bat` → App launches immediately!
2. (Optional) Run `create-desktop-shortcut.ps1` once → Get desktop icon

**That's it!** 🎉
