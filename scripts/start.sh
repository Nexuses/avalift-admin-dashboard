#!/bin/bash

echo "[START] Copying built files to Apache root..."

SOURCE_DIR="/var/www/adminpanel/dist"
DEST_DIR="/var/www/dist"

if [ -d "$SOURCE_DIR" ] && [ "$(ls -A $SOURCE_DIR)" ]; then
  echo "[START] Found built dist folder, copying..."
  sudo mkdir -p "$DEST_DIR"
  sudo cp -r $SOURCE_DIR/* $DEST_DIR/
  
  # ✅ Copy .htaccess explicitly if needed
  if [ -f "/var/www/adminpanel/.htaccess" ]; then
    echo "[START] Copying .htaccess to Apache root..."
    sudo cp /var/www/adminpanel/.htaccess $DEST_DIR/
  fi

  sudo chown -R ubuntu:ubuntu $DEST_DIR
  echo "[START] Copy complete."
else
  echo "[ERROR]  No built files found in $SOURCE_DIR"
  ls -al "$SOURCE_DIR"
fi

echo "[START] Restarting Apache..."
sudo systemctl restart apache2

