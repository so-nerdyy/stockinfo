# Overnight vs Intraday Candlestick Analyzer

A web application for analyzing overnight versus intraday performance in financial candlestick data. Upload a CSV file containing OHLC (Open, High, Low, Close) data, select a date range, and view detailed analysis including cumulative performance charts, statistical breakdowns by day of week, month, and year, and export the results.

## Tech Stack

- **Backend**: Python, FastAPI, Pandas, Uvicorn
- **Frontend**: React, Vite, Axios (HTTP requests), Recharts (charts), Tailwind CSS (styling)

## Prerequisites

- Python 3.8 or higher
- Node.js (version 16 or higher)
- npm (comes with Node.js)

## Installation and Setup

1. Clone or download the project repository.
2. Navigate to the project root directory (`svg-candlestick-analyzer`).

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

### Frontend Setup

```bash
cd ../frontend
npm install
```

## Running the Application

To run the full application locally, you need to start both the backend and frontend servers. Open two terminal windows:

**Terminal 1 (Backend):**
```bash
cd backend
uvicorn main:app --reload
```
The backend will run on `http://localhost:8000`.

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5173`.

Open your browser and navigate to the frontend URL to use the application.

## Usage

1. **Upload CSV File**: Drag and drop a CSV file onto the upload area, or click to select a file from your device. The CSV must contain candlestick data with the required columns.

2. **Select Date Range**: After uploading, use the date inputs to select the start and end dates for analysis.

3. **Analyze Data**: Click the "Analyze" button to process the data within the selected date range.

4. **View Results**:
   - **Cumulative Performance Chart**: A line chart showing compounded returns for overnight, intraday, and carry performance over time.
   - **Day-of-Week Averages**: Bar chart displaying average performance by day of the week.
   - **Monthly Averages**: Bar chart showing average performance by month.
   - **Yearly Totals**: Bar chart with total cumulative performance by year.
   - **Daily Data Table**: Paginated table with daily percentages and OHLC values.

5. **Export Results**: Click the "Export CSV" button to download the analyzed data as a CSV file.

## API Endpoints

- **POST /upload_csv**: Uploads a CSV file and returns the minimum and maximum dates available in the data.
  - Request: Multipart form data with 'file' field containing the CSV.
  - Response: JSON with `min_date` and `max_date` (YYYY-MM-DD format).

- **POST /analyze**: Analyzes the uploaded data for a specified date range.
  - Request: JSON with `startDate` and `endDate` (YYYY-MM-DD format).
  - Response: JSON containing daily percentages, cumulative performance, and statistical breakdowns.

- **GET /export**: Downloads the last analyzed data as a CSV file.
  - Response: CSV file with columns for Date, Open, High, Low, Close, and calculated percentages.

## Notes on CSV Format and Calculations

### CSV Format Requirements
- The CSV file must contain the following columns: `Date`, `Open`, `High`, `Low`, `Close`.
- The `Date` column should be in a parseable datetime format (e.g., YYYY-MM-DD or ISO format).
- Data should be sorted chronologically by date.
- All OHLC values should be numeric (floats or integers).

### Calculations
- **Overnight Percentage**: `((Open - Previous Close) / Previous Close) * 100`. Calculated for each day except the first.
- **Intraday Percentage**: `((Close - Open) / Open) * 100`. Calculated for each day.
- **Carry Percentage**: `((Close - Previous Close) / Previous Close) * 100`. Calculated for each day except the first.
- **Cumulative Performance**: Compounded returns starting from 100, updated daily for each category.
- **Statistics**: Averages for overnight, intraday, and carry percentages grouped by day of week, month, and year. Yearly stats show total cumulative performance.