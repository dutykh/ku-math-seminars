# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a website project for displaying the weekly programme of Math seminars at Khalifa University (KU). The project is built using Astro 5 with TypeScript for optimal performance and SEO.

## Author Information

- Author: Dr. Deny Dutykh (Khalifa University of Science and Technology, Abu Dhabi, UAE)
- License: GNU General Public License v3.0

## Current Status

This is an Astro 5 project with minimal template setup. Ready for development of the math seminars website.

## Technical Stack

- **Framework**: Astro 5 (Static Site Generator with islands architecture)
- **Language**: TypeScript (strict mode)
- **Package Manager**: pnpm
- **Deployment**: VPS (bare-bone Unix server)
- **Build Output**: Static files for web server deployment

## Development Commands

- `pnpm install` - Install dependencies
- `pnpm dev` - Start development server (http://localhost:4321)
- `pnpm build` - Build for production (outputs to `/dist/`)
- `pnpm preview` - Preview production build locally
- `pnpm check` - Run Astro diagnostics
- `astro add <integration>` - Add Astro integrations (React, Tailwind, etc.)

## Project Structure

Current Astro project structure:
- `/src/pages/` - Astro pages (routes), currently contains `index.astro`
- `/src/components/` - Reusable Astro/React/Vue components (to be created)
- `/src/layouts/` - Page layouts (to be created)
- `/public/` - Static assets (favicon.svg included)
- `/dist/` - Built site output (after `pnpm build`)
- `astro.config.mjs` - Astro configuration
- `tsconfig.json` - TypeScript configuration

For math seminar schedules, consider adding:
- `/src/content/` - Content collections for seminars data
- `/src/data/` - JSON/YAML files for seminar information
- `/src/styles/` - Global CSS styles

## Development Notes

- This project is licensed under GPL v3.0 - ensure all contributions comply
- Environment variables should be kept in .env files (already gitignored)
- Build artifacts (dist/, .astro/, node_modules) are properly gitignored
- Author attribution should be maintained in file headers as per GPL requirements
- Built for VPS deployment - static files can be served by any web server (Apache, Nginx)
- Astro generates optimized static HTML/CSS/JS for excellent performance

## Deployment

For VPS deployment:
1. Run `pnpm build` to generate static files in `/dist/`
2. Upload `/dist/` contents to web server directory
3. Configure web server to serve static files
4. No server-side runtime required (pure static site)