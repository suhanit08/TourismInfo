# Travelora

A self-contained React + Vite travel website designed to run directly in VS Code.

## Features
- Home, Explore, Categories, Trip Planner, Favorites, Login
- Destination detail pages with working URL routing
- 12 destination records in a local JS dataset
- Search and category filtering
- Local destination artwork with no external image dependency
- Working Travelora AI chat UI with database-aware recommendations and itinerary/route responses
- Responsive design

## Run
1. Install Node.js LTS.
2. Open this folder in VS Code.
3. Open Terminal.
4. Run `npm install`
5. Run `npm run dev`
6. Open the localhost URL shown by Vite.

The AI assistant is implemented as a local rule-based prototype so the project works without an API key. For a production AI model, connect the `answer()` function in `src/main.jsx` to your preferred backend/API.

## Deploy to GitHub Pages
The `TourismInfo` repository deploys automatically to GitHub Pages when changes are pushed to `main`. In the repository settings, set **Pages** > **Build and deployment** > **Source** to **GitHub Actions**. The workflow builds the Vite app with the repository path and deploys it; client-side routes also work when opened directly.
