#!/bin/bash

PORTS=(3000 3001 3002 3003 3004 3005 3010 3011)

for port in "${PORTS[@]}"; do
  pids=$(lsof -ti:$port 2>/dev/null)
  if [ -n "$pids" ]; then
    echo "Killing port $port (PID: $pids)"
    kill -9 $pids
  else
    echo "Port $port is free"
  fi
done

echo "Done."
