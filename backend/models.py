from pydantic import BaseModel
from datetime import datetime
from typing import List, Dict, Optional

class CandlestickData(BaseModel):
    date: datetime
    open: float
    high: float
    low: float
    close: float

class DateRange(BaseModel):
    min_date: str
    max_date: str

class AnalyzeRequest(BaseModel):
    startDate: str
    endDate: str

class DailyPercentage(BaseModel):
    date: str
    overnight_pct: Optional[float]
    intraday_pct: float
    carry_pct: Optional[float]

class CumulativePerformance(BaseModel):
    overnight: List[float]
    intraday: List[float]
    carry: List[float]

class DayOfWeekStats(BaseModel):
    Monday: Dict[str, float]
    Tuesday: Dict[str, float]
    Wednesday: Dict[str, float]
    Thursday: Dict[str, float]
    Friday: Dict[str, float]

class MonthStats(BaseModel):
    January: Dict[str, float]
    February: Dict[str, float]
    March: Dict[str, float]
    April: Dict[str, float]
    May: Dict[str, float]
    June: Dict[str, float]
    July: Dict[str, float]
    August: Dict[str, float]
    September: Dict[str, float]
    October: Dict[str, float]
    November: Dict[str, float]
    December: Dict[str, float]

class YearStats(BaseModel):
    years: Dict[str, Dict[str, float]]

class AnalyzeResponse(BaseModel):
    daily_percentages: List[DailyPercentage]
    cumulative_performance: CumulativePerformance
    day_of_week_stats: DayOfWeekStats
    month_stats: MonthStats
    year_stats: YearStats