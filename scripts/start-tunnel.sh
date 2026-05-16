#!/bin/bash
set -u
mkdir -p /home/caio/tanjolp/logs
while true; do
  /usr/local/bin/cloudflared tunnel --config /home/caio/.cloudflared/config.yml run tanjo-studio >> /home/caio/tanjolp/logs/tunnel.log 2>&1
  echo "[$(date -Iseconds)] Tunnel exited (code $?), restarting in 5s..." >> /home/caio/tanjolp/logs/tunnel.log
  sleep 5
done
