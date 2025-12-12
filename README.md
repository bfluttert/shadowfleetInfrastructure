# Shadow Fleet Monitor 🚢⚓

**Maritime Critical Infrastructure Monitor & Shadow Fleet Tracker**

A real-time intelligence platform that overlays live vessel traffic (AIS) onto a map of Europe's critical sea infrastructure (Submarine Cables, Pipelines, Wind Farms). The core objective is to identify and alert on suspicious behavior by the "Russian Shadow Fleet," such as loitering near critical assets, erratic maneuvers, or AIS anomalies.

## 🚀 Key Features

*   **Real-time Vessel Tracking**: visualizes live AIS positions on an interactive map.
*   **Shadow Fleet Watchlist**: Automatically filters and highlights vessels from known sanctions lists (EU, GUR, etc.).
*   **Infrastructure Overlay**: Maps critical submarine cables, gas pipelines, and offshore wind farms.
*   **Proximity Alerts**: Detects when watchlist vessels enter sensitive buffer zones around critical infrastructure.
*   **Loitering Detection**: (Planned) Identifies suspicious behaviors like low speed or erratic headings in non-anchorage zones.

## 🛠 Architecture

The system utilizes a Modern GIS Stack:

*   **Frontend**: [React](https://react.dev/) + [Vite](https://vitejs.dev/) with [Leaflet](https://leafletjs.com/) for high-performance mapping.
*   **Backend / Database**: [Supabase](https://supabase.com/) (PostgreSQL + PostGIS) for geospatial queries and data persistence.
*   **Real-time Stream**: Node.js Proxy (`server.js`) connecting to [AISStream.io](https://aisstream.io/) via WebSocket.
*   **Ingestion Workers**: Node.js scripts to fetch and populate infrastructure data and historical vessel positions.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js** (v18 or higher)
*   **npm** or **yarn**
*   **Supabase Account** (for the database and PostGIS extension)
*   **AISStream.io API Key** (Free tier is sufficient for testing)

## ⚙️ Installation & Setup

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/yourusername/shadowfleetInfrastructure.git
    cd shadowfleetInfrastructure
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    # This installs both server/script dependencies and client dependencies
    ```

3.  **Environment Configuration**
    Create a `.env` file in the root directory based on the following template:

    ```env
    # Supabase Configuration
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_URL=your_supabase_project_url
    SUPABASE_SERVICE_KEY=your_supabase_service_role_key

    # AISStream.io Configuration
    AIS_KEY=your_aisstream_api_key
    ```
    > **Note**: `VITE_*` keys are exposed to the frontend. `SUPABASE_SERVICE_KEY` and `AIS_KEY` are for server-side scripts only.

4.  **Database Setup**
    *   Create a new project in Supabase.
    *   Enable the **PostGIS** extension in the Supabase Dashboard (`Database` -> `Extensions`).
    *   Run the SQL scripts located in the `database/` directory in the Supabase SQL Editor:
        1.  `database/schema.sql` (Creates tables: `infrastructure_layers`, `watch_list`, `ais_positions`, `alerts`)
        2.  `database/policies.sql` (Sets up RLS policies)
        3.  (Optional) `database/computed_fields.sql`

## 🏃‍♂️ Usage

### 1. Start the Real-time Proxy Server
This server connects to the AIS WebSocket and emits events to the frontend.

```bash
node server.js
```
*Runs on port 3001.*

### 2. Start the Frontend Application
In a new terminal window:

```bash
npm run dev
```
*Accessible at http://localhost:5173 (usually).*

### 3. Data Ingestion (Optional)
To populate the database with static infrastructure data or historical AIS data:

*   **Import Cables/Infrastructure**:
    ```bash
    npm run import:cables
    ```
*   **Ingest Watchlist**:
    ```bash
    npm run ingest:watchlist
    ```
*   **Archive AIS Data** (Long-running process to save stream to DB):
    ```bash
    npm run stream:ais
    ```

## 📂 Project Structure

*   `/client`: React frontend application source code.
*   `/scripts`: Node.js utility scripts for data ingestion and debugging.
*   `/database`: SQL migration files for Supabase.
*   `/data`: Raw data files (GeoJSONs, CSVs) for infrastructure and watchlists.
*   `server.js`: Main entry point for the real-time WebSocket proxy.
*   `Design.md`: Detailed technical specification and architectural plan.

## 📡 Data Sources

*   **AIS Data**: [AISStream.io](https://aisstream.io/)
*   **Static Infrastructure**: [EMODnet Human Activities](https://www.emodnet-humanactivities.eu/)
*   **Sanctions Watchlist**: Publicly available lists (EU Sanctions, KSE Institute).

## 📄 License

[MIT](LICENSE)
