#!/bin/bash

echo "[BUILD] Starting frontend build with npm..."

cd /var/www/adminpanel || exit 1

# Load Node (via NVM)
export NVM_DIR="/home/ubuntu/.nvm"
source "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20

# Fix permissions
echo "[BUILD] Fixing permissions..."
sudo chown -R ubuntu:ubuntu .

# Install dependencies
echo "[BUILD] Running npm install..."
npm install

# Build the frontend
echo "[BUILD] Running npm build..."
npm run build

# Check if dist was created
if [ -d "dist" ]; then
  echo "[BUILD] Build succeeded. Contents of dist/:"
  ls -la dist
  sudo chown -R ubuntu:ubuntu dist
else
  echo "[BUILD] Build failed — dist/ folder not found."
  exit 1
fi

echo "[BUILD] 🏁 build.sh completed successfully."
