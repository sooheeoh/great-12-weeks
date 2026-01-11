#!/bin/bash
cd "$(dirname "$0")"
echo "Starting Great 12 Weeks..."
echo "Opening browser..."
open http://localhost:5173
npm run dev
