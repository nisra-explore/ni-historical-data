# NISRA Data Explorer

This repository contains the source code and assets for the **NISRA Data Explorer** web application.  
The app provides an interactive interface for browsing, visualising, and downloading official statistics.

---

## 📁 Project Structure

```text
.
├── .github/
│   └── workflows/
│       └── update.yml            # Scheduled refresh for portal metadata
├── .vscode/
│   └── settings.json             # Editor settings for the project
├── assets/
│   ├── css/
│   │   └── styles.css            # Global styling and layout rules
│   └── img/
│       ├── icon/                 # Favicon and touch icons
│       └── logo/                 # Brand and social media logos
├── public/
│   ├── data/
│   │   ├── associated-tables.csv # Supporting table metadata
│   │   └── data-portal-tables.json # Main table catalog used by the app
│   └── map/
│       ├── AA.geo.json
│       ├── AA2024.geo.json
│       ├── COB.geo.json
│       ├── LGD2014.geo.json
│       ├── NUTS3.geo.json
│       ├── SA2011.geo.json
│       ├── style-omt.json
│       └── ...                   # Additional GeoJSON geography files
├── src/
│   ├── about.js                  # Script for the about page
│   ├── config/
│   │   └── config.js             # App configuration and geography defaults
│   ├── index.js                  # Main app bootstrap and wiring
│   ├── r/
│   │   └── all-tables-from-portal.R # Refreshes table metadata from NISRA portal
│   └── utils/
│       ├── addOtherMenus.js      # Additional menu population logic
│       ├── buildCharts.js        # Chart assembly and rendering
│       ├── buildTables.js        # Table construction for selected data
│       ├── chart-download.js     # Export chart images/data
│       ├── clearElements.js      # DOM cleanup helpers
│       ├── cookies.js           # Cookie-based state persistence
│       ├── createMenus.js        # Build dropdown menus from JSON data
│       ├── dataPortalPreview.js  # Preview metadata and table selection helpers
│       ├── download-button.js    # Download button logic
│       ├── elements.js           # Shared DOM references
│       ├── fillMenus.js          # Populate menu options
│       ├── firstKey.js           # Helper for first-key access
│       ├── getColour.js          # Map/chart colour scales
│       ├── initSideBarPersistence.js # Persist sidebar state
│       ├── loadShapes.js         # Fetch and cache GeoJSON layers
│       ├── loadTables.js         # Fetch and cache JSON tables with TTL logic
│       ├── mapSelections.js      # Handle map/table selection state
│       ├── plotMap.js            # Main map/chart rendering logic
│       ├── quantile.js           # Quintile-related utility
│       ├── refreshRoute.js       # URL/hash route refresh logic
│       ├── renamePage.js         # Update page titles/metadata
│       ├── sharePage.js          # Shareable link generation
│       ├── skipToMainContent.js  # Accessibility skip-link helper
│       ├── sortObject.js         # Recursive object sorting
│       ├── titleCase.js          # Label formatting utility
│       ├── wireSearch.js         # Global search wiring
│       ├── wrapLabel.js          # Axis label wrapping helper
│       └── yAxisLabelPlugin.js   # Chart.js axis label plugin
├── .gitignore                    # Git ignore rules
├── about.html                    # About page markup
├── data-explorer.Rproj           # RStudio project file
├── index.html                    # Main application shell
├── README.md                     # Project documentation
└── .Rhistory                     # Local R session history
```

---

## 🔑 Key Concepts

- **`index.html`** is the main application page, and **`about.html`** provides the separate about page; both load their corresponding JS modules.
- **`src/index.js`** is the main coordinator: imports modules from `utils/`, wires events, and bootstraps the app.
- **`utils/`** contains small single-purpose modules. Each utility handles a well-defined task (menus, search, maps, charts).
- **`public/data/`** and **`public/map/`** are data sources fetched at runtime by the browser.  
  - `data-portal-tables.json` is regenerated regularly by the R script.
  - `map/*.geo.json` provides geography shapes for Leaflet maps.
- **`assets/`** contains branding resources (CSS, images, icons). These don’t change dynamically.
- **`src/r/all-tables-from-portal.R`** is run by GitHub Actions to refresh `data-portal-tables.json`.

---

## ⚙️ Workflow

1. **Development**
   - Edit `index.html`, `about.html`, `src/` JS modules, or `assets/css/styles.css`.
   - Static data (e.g. JSON, GeoJSON) lives under `public/`.

2. **Data refresh**
   - The R script `src/r/all-tables-from-portal.R` pulls the latest table metadata.
   - A GitHub Actions workflow runs this script on schedule and commits updates.

3. **Deployment**
   - Serve the root directory (`index.html`) through a static site host (e.g. GitHub Pages, Netlify).
   - Ensure `public/` and `assets/` are both accessible.

---

## 🧭 Conventions

- **CSS**: Custom styles live in `assets/css/styles.css`.
- **Images**:  
  - `assets/img/logo/` → logos and social icons  
  - `assets/img/icon/` → favicons and app icons  
- **Modules**: Use ES modules (`export` / `import`) for reusability.
- **Data**: Place static/fetched data under `public/`.

---

## 🚀 Getting Started

### Prerequisites
- [Visual Studio Code](https://code.visualstudio.com/) installed
- [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) for VS Code

### Run locally
1. Open **VS Code**. In the **Welcome** tab, click **Clone Git Repository**.  
   - Paste in the repository URL (e.g. `https://github.com/nisra-explore/data-explorer`).  
   - Choose a local folder where you want the project saved.  
   - Once the clone finishes, VS Code will ask if you want to open the project — click **Open**.

2. In VS Code, make sure you can see `index.html` in the Explorer sidebar.  
   (All files such as `assets/`, `public/`, and `src/` should also be visible there.)

3. Start the local development server by clicking the **Go Live** button in the bottom-right corner of the VS Code window.  
   - This launches the **Live Server** extension.  
   - A browser window will open (usually at `http://127.0.0.1:5500/`) with the Data Explorer running locally.

4. Any changes you make to HTML, CSS, or JavaScript files will automatically reload in the browser.

---

### Notes
- `public/data/data-portal-tables.json` is required for menus and search to work. If you’re running without the GitHub Action refresh, make sure this file exists.
- Leaflet maps rely on the GeoJSON files in `public/map/`.

---

