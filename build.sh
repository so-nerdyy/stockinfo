#!/bin/sh
# Vercel build script to fix permission issues
cd frontend
npm install
node node_modules/vite/bin/vite.js build
