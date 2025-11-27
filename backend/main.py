from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import math
from models import DateRange, AnalyzeRequest, AnalyzeResponse
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Local development
        "http://localhost:3000",  # Alternative local port
        "https://stockinfo-final.vercel.app",  # Production frontend
        "https://*.vercel.app",   # All Vercel deployments
        "https://*.onrender.com", # Render static sites
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

uploaded_df = None
last_analyzed_df = None

def clean_dict(obj):
    if isinstance(obj, dict):
        return {k: clean_dict(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_dict(item) for item in obj]
    elif np.issubdtype(type(obj), np.floating) and (np.isnan(obj) or np.isinf(obj)):
        return 0
    else:
        return obj

@app.post("/upload_csv", response_model=DateRange)
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    content = await file.read()
    try:
        df = pd.read_csv(io.StringIO(content.decode('utf-8')))
        df.rename(columns={
            'Date ': 'Date',
            'OPEN ': 'Open',
            'HIGH ': 'High',
            'LOW ': 'Low',
            'close ': 'Close',
            'PREV. CLOSE ': 'PrevClose'
        }, inplace=True)
        df['Date'] = pd.to_datetime(df['Date'], format='%d-%b-%Y')
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing CSV: {str(e)}")

    required_columns = ['Date', 'Open', 'High', 'Low', 'Close', 'PrevClose']
    if not all(col in df.columns for col in required_columns):
        raise HTTPException(status_code=400, detail="CSV must contain Date, Open, High, Low, Close, PrevClose columns")

    # Sort chronologically
    df = df.sort_values('Date')

    # Store globally
    global uploaded_df
    uploaded_df = df

    # Get min and max dates
    min_date = df['Date'].min().strftime('%Y-%m-%d')
    max_date = df['Date'].max().strftime('%Y-%m-%d')

    return DateRange(min_date=min_date, max_date=max_date)

@app.post("/analyze")
async def analyze_data(request: AnalyzeRequest):
    global uploaded_df
    if uploaded_df is None:
        raise HTTPException(status_code=400, detail="No data uploaded yet")

    # Filter by date range
    start_date = pd.to_datetime(request.startDate)
    end_date = pd.to_datetime(request.endDate)
    filtered_df = uploaded_df[(uploaded_df['Date'] >= start_date) & (uploaded_df['Date'] <= end_date)].copy()

    if filtered_df.empty:
        raise HTTPException(status_code=400, detail="No data in the specified date range")

    # Compute daily percentages
    filtered_df['prev_close'] = filtered_df['PrevClose']
    filtered_df['overnight_pct'] = ((filtered_df['Open'] - filtered_df['prev_close']) / filtered_df['prev_close'] * 100).fillna(0)
    filtered_df['intraday_pct'] = ((filtered_df['Close'] - filtered_df['Open']) / filtered_df['Open'] * 100)
    filtered_df['carry_pct'] = ((filtered_df['Close'] - filtered_df['prev_close']) / filtered_df['prev_close'] * 100).fillna(0)

    daily_percentages = [
        {
            "date": row['Date'].strftime('%Y-%m-%d'),
            "overnight_pct": row['overnight_pct'] if pd.notna(row['overnight_pct']) else None,
            "intraday_pct": row['intraday_pct'],
            "carry_pct": row['carry_pct'] if pd.notna(row['carry_pct']) else None
        }
        for _, row in filtered_df.iterrows()
    ]

    # Cumulative compounded performance
    overnight_cum = [100]
    intraday_cum = [100]
    carry_cum = [100]
    for i in range(1, len(filtered_df)):
        row = filtered_df.iloc[i]
        if pd.notna(row['overnight_pct']):
            overnight_cum.append(overnight_cum[-1] * (1 + row['overnight_pct'] / 100))
        else:
            overnight_cum.append(overnight_cum[-1])
        intraday_cum.append(intraday_cum[-1] * (1 + row['intraday_pct'] / 100))
        if pd.notna(row['carry_pct']):
            carry_cum.append(carry_cum[-1] * (1 + row['carry_pct'] / 100))
        else:
            carry_cum.append(carry_cum[-1])

    # Clean cumulative lists
    overnight_cum = pd.Series(overnight_cum).replace([np.inf, -np.inf], 0).fillna(0).tolist()
    intraday_cum = pd.Series(intraday_cum).replace([np.inf, -np.inf], 0).fillna(0).tolist()
    carry_cum = pd.Series(carry_cum).replace([np.inf, -np.inf], 0).fillna(0).tolist()

    cumulative_performance = {
        "overnight": overnight_cum,
        "intraday": intraday_cum,
        "carry": carry_cum
    }

    # Day-of-week stats
    filtered_df['day_of_week'] = filtered_df['Date'].dt.day_name()
    dow_stats = {}
    for day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']:
        day_data = filtered_df[filtered_df['day_of_week'] == day]
        dow_stats[day] = {
            "overnight": day_data['overnight_pct'].mean() if not day_data.empty else 0,
            "intraday": day_data['intraday_pct'].mean() if not day_data.empty else 0,
            "carry": day_data['carry_pct'].mean() if not day_data.empty else 0
        }

    # Month stats
    filtered_df['month'] = filtered_df['Date'].dt.month_name()
    month_stats = {}
    for month in ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']:
        month_data = filtered_df[filtered_df['month'] == month]
        month_stats[month] = {
            "overnight": month_data['overnight_pct'].mean() if not month_data.empty else 0,
            "intraday": month_data['intraday_pct'].mean() if not month_data.empty else 0,
            "carry": month_data['carry_pct'].mean() if not month_data.empty else 0
        }

    # Year stats
    filtered_df['year'] = filtered_df['Date'].dt.year.astype(str)
    year_stats = {}
    for year, group in filtered_df.groupby('year'):
        overnight_cum_year = 100
        intraday_cum_year = 100
        carry_cum_year = 100
        for _, row in group.iterrows():
            if pd.notna(row['overnight_pct']):
                overnight_cum_year *= (1 + row['overnight_pct'] / 100)
            intraday_cum_year *= (1 + row['intraday_pct'] / 100)
            if pd.notna(row['carry_pct']):
                carry_cum_year *= (1 + row['carry_pct'] / 100)
        year_stats[year] = {
            "overnight": overnight_cum_year - 100,  # total cumulative %
            "intraday": intraday_cum_year - 100,
            "carry": carry_cum_year - 100
        }

    # Replace NaN values with 0 in stats
    dow_stats = clean_dict(dow_stats)
    month_stats = clean_dict(month_stats)
    year_stats = clean_dict(year_stats)

    # Replace NaN values with 0 to prevent JSON serialization issues
    filtered_df = filtered_df.fillna(0)
    filtered_df = filtered_df.replace([np.inf, -np.inf], 0)
    
    # Store the analyzed data for export
    global last_analyzed_df
    last_analyzed_df = filtered_df

    response_dict = {
        "daily_percentages": daily_percentages,
        "cumulative_performance": cumulative_performance,
        "day_of_week_stats": dow_stats,
        "month_stats": month_stats,
        "year_stats": {"years": year_stats}
    }

    return clean_dict(response_dict)

@app.get("/export")
async def export_csv():
    global last_analyzed_df
    if last_analyzed_df is None:
        raise HTTPException(status_code=400, detail="No data analyzed yet")

    # Select relevant columns
    export_df = last_analyzed_df[['Date', 'Open', 'High', 'Low', 'Close', 'overnight_pct', 'intraday_pct', 'carry_pct']].copy()

    # Format date
    export_df['Date'] = export_df['Date'].dt.strftime('%Y-%m-%d')

    # Generate CSV
    csv_buffer = io.StringIO()
    export_df.to_csv(csv_buffer, index=False)
    csv_buffer.seek(0)

    # Return as file response
    return FileResponse(io.BytesIO(csv_buffer.getvalue().encode('utf-8')), media_type='text/csv', filename='daily_statistics.csv')