# 🎮 Minecraft Bedrock Add-on Host

A web platform for hosting, validating, and packaging Minecraft Bedrock Edition add-ons for Xbox players.

## Features

✅ **Upload & Validate** - Users upload ZIP files; system validates Bedrock manifest structure
🔒 **Malware Scanning** - Detects suspicious code patterns, dangerous file types
📦 **Auto-Packaging** - Creates .mcpack files ready for Xbox import
📊 **Metadata Tracking** - Stores creator info, version, UUIDs
🎮 **Xbox Import Guide** - Clear instructions for "My Packs" import
☁️ **Cloud Storage Support** - Works with OneDrive, Google Drive
📱 **Responsive Design** - Works on mobile, desktop, Xbox browsers

## Quick Start

### Local Development

```bash
# Clone and install
git clone https://github.com/JAKEMEBOY13/minecraft-bedrock-addon-host.git
cd minecraft-bedrock-addon-host
npm install

# Build and run
npm run build
npm start

# Visit http://localhost:3000
```

### Docker

```bash
docker build -t bedrock-addon-host .
docker run -p 3000:3000 bedrock-addon-host
```

## Deployment

- **Vercel**: Connect GitHub repo → Auto-deploy
- **Railway**: Connect GitHub repo → Auto-deploy
- **DigitalOcean**: VPS with Node.js + Nginx
- **Google Cloud Run**: Docker container deployment

## API Endpoints

- `POST /api/upload` - Upload and validate add-on
- `POST /api/validate` - Validate without storing
- `GET /api/addon/:id` - Get add-on metadata
- `GET /downloads/:filename` - Download packaged file

## Xbox Import Instructions

1. Download .mcpack file from website
2. Open Minecraft Bedrock on Xbox
3. Go to "Create" → "My Packs"
4. Select "Import" and locate the .mcpack file
5. Create new world and enable pack

## License

MIT - See LICENSE file for details

## Disclaimer

Not affiliated with Microsoft or Mojang Studios. Minecraft is a trademark of Microsoft Corporation.
