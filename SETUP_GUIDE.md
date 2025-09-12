# 🚀 Ventprom Packer Setup Guide

## Quick Start Options

### Option 1: Node.js Setup (Recommended)

**Step 1: Install Node.js**
1. Go to https://nodejs.org/
2. Download the **LTS version** (Long Term Support)
3. Run the installer
4. ✅ Check "Add to PATH" during installation
5. Restart your computer

**Step 2: Verify Installation**
Open PowerShell and run:
```bash
node --version
npm --version
```

**Step 3: Install Dependencies**
```bash
cd "C:\Users\gonch\OneDrive\Рабочий стол\ventprom-packer-starter"
npm install
```

**Step 4: Run the Application**
```bash
npm run dev
```

**Step 5: Test Universal Parser**
1. Open browser: http://localhost:3000
2. Upload your example files
3. Verify ALL data is extracted

---

### Option 2: Docker Setup

**Step 1: Install Docker Desktop**
1. Go to https://www.docker.com/products/docker-desktop/
2. Download Docker Desktop for Windows
3. Install and restart computer
4. Start Docker Desktop

**Step 2: Run with Docker**
```bash
cd "C:\Users\gonch\OneDrive\Рабочий стол\ventprom-packer-starter"
docker-compose up --build
```

**Step 3: Test**
1. Open browser: http://localhost:3000
2. Upload your example files
3. Verify universal extraction

---

### Option 3: Quick Test (No Installation)

**Step 1: Open Test Page**
1. Double-click `quick_test.html`
2. Review the universal parser features
3. See what data will be extracted

**Step 2: Install Node.js Later**
Follow Option 1 when ready to test the full application

---

## 🧪 Testing Your Universal Parser

### What to Test

**Upload these files:**
- `example xlsx.xlsx`
- `example pdf.pdf`
- `example png.png`
- `example xlsx 247.xlsx`
- `example 261 pdf.pdf`

### Expected Results

**✅ Universal Parser Should Extract:**
```
ID    | TYPE      | WIDTH | HEIGHT | LENGTH | QTY | MATERIAL
R1    | rectangular| 500   | 300    | 1160   | 2   | steel
R2    | rectangular| 400   | 200    | 1250   | 1   | aluminum
C1    | round     | 200   | 0      | 2000   | 3   | steel
C2    | round     | 150   | 0      | 3000   | 1   | plastic
P1    | panel     | 600   | 400    | 100    | 5   | stainless
```

**❌ Old Parser Would Only Extract:**
- Air duct cross-sections only
- Limited dimensions (W, H, L)
- Specific patterns only

### Key Differences

**Universal Parser:**
- ✅ Extracts ALL data from files
- ✅ Handles multiple cross-sections
- ✅ Supports various lengths (1160, 1250, 2000, 3000)
- ✅ Works with any item type (not just air ducts)
- ✅ Supports all file types (Excel, PDF, images)
- ✅ Multi-language support (English, Russian, German, French)

**Old Parser:**
- ❌ Only air duct cross-sections
- ❌ Limited dimensions
- ❌ Specific patterns only
- ❌ Single item type

---

## 🔧 Troubleshooting

### Node.js Issues
```bash
# If node command not found:
# 1. Restart computer after installation
# 2. Check PATH environment variable
# 3. Reinstall Node.js with "Add to PATH" checked

# If npm install fails:
npm cache clean --force
npm install
```

### Docker Issues
```bash
# If Docker not found:
# 1. Install Docker Desktop
# 2. Start Docker Desktop
# 3. Restart computer

# If build fails:
docker-compose down
docker-compose up --build --force-recreate
```

### Port Issues
```bash
# If port 3000 is busy:
# 1. Kill process using port 3000
# 2. Or change port in package.json
# 3. Or use different port: npm run dev -- --port 3001
```

---

## 📋 Next Steps After Setup

1. **Test Universal Parser**
   - Upload your example files
   - Verify ALL data is extracted
   - Check multiple cross-sections
   - Verify various lengths

2. **Test Packing Algorithm**
   - Select a vehicle
   - Run packing
   - Check 3D visualization

3. **Test Export Features**
   - Export to PDF
   - Export to GLB
   - Export to HTML

4. **Verify Everything Works**
   - All file types parse correctly
   - All data is extracted
   - Packing algorithm works
   - 3D visualization shows items

---

## 🎯 Success Criteria

**✅ Universal Parser Working When:**
- All example files upload successfully
- ALL data is extracted (not just air ducts)
- Multiple cross-sections are found
- Various lengths are detected (1160, 1250, 2000, 3000)
- All dimensions are captured
- All properties are extracted

**✅ Application Working When:**
- Files upload and parse
- Packing algorithm runs
- 3D visualization shows items
- Export features work
- No errors in console

---

## 🆘 Need Help?

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify Node.js/Docker installation
3. Check console for error messages
4. Try the quick test page first
5. Ask for help with specific error messages

The universal parser is ready to extract ALL data from your files! 🎉


