#!/bin/bash
set -u
cd /home/caio/tanjolp
mkdir -p logs
set -a
. /home/caio/tanjolp/.env
set +a
while true; do
  /home/caio/.nvm/versions/node/v22.22.2/bin/node dist/index.js >> logs/app.log 2>&1
  echo "[$(date -Iseconds)] App exited (code $?), restarting in 5s..." >> logs/app.log
  sleep 5
done
