# 🚀 Quick Start Guide

## The Issue
You have Node.js installed (v22.19.0) but npm is not found in the current PowerShell session. This is a common PATH issue.

## 🔧 Solutions

### Option 1: Use the Batch Script (Easiest)
1. **Double-click `install_and_run.bat`**
2. The script will:
   - Find Node.js and npm
   - Install dependencies
   - Start the application
   - Open http://localhost:3000

### Option 2: Restart Computer
1. **Restart your computer** (this updates PATH)
2. **Open new PowerShell**
3. **Run these commands:**
   ```bash
   cd "C:\Users\gonch\OneDrive\Рабочий стол\ventprom-packer-starter"
   npm install
   npm run dev
   ```

### Option 3: Use Command Prompt
1. **Open Command Prompt** (not PowerShell)
2. **Run these commands:**
   ```bash
   cd "C:\Users\gonch\OneDrive\Рабочий стол\ventprom-packer-starter"
   npm install
   npm run dev
   ```

### Option 4: Manual PATH Fix
1. **Find Node.js installation:**
   - Usually in `C:\Program Files\nodejs\`
   - Or `C:\Program Files (x86)\nodejs\`
2. **Add to PATH:**
   - Right-click "This PC" → Properties
   - Advanced System Settings
   - Environment Variables
   - Edit PATH
   - Add Node.js folder path
3. **Restart PowerShell**

## 🧪 Testing the Universal Parser

Once the application is running:

1. **Open browser:** http://localhost:3000
2. **Upload your example files:**
   - `example xlsx.xlsx`
   - `example pdf.pdf`
   - `example png.png`
   - All other example files
3. **Verify universal extraction:**
   - ✅ All cross-sections extracted
   - ✅ Various lengths (1160, 1250, 2000, 3000)
   - ✅ All dimensions and properties
   - ✅ Multiple item types (not just air ducts)

## 🎯 Expected Results

**Universal Parser Should Extract:**
```
ID    | TYPE      | WIDTH | HEIGHT | LENGTH | QTY | MATERIAL
R1    | rectangular| 500   | 300    | 1160   | 2   | steel
R2    | rectangular| 400   | 200    | 1250   | 1   | aluminum
C1    | round     | 200   | 0      | 2000   | 3   | steel
C2    | round     | 150   | 0      | 3000   | 1   | plastic
P1    | panel     | 600   | 400    | 100    | 5   | stainless
```

**Multiple cross-sections, various lengths, ALL data extracted!**

## 🆘 Still Having Issues?

If you're still having problems:

1. **Try the batch script first** (`install_and_run.bat`)
2. **Restart your computer** (updates PATH)
3. **Use Command Prompt** instead of PowerShell
4. **Check Node.js installation** at https://nodejs.org/

The universal parser is ready to extract ALL data from your files! 🎉




