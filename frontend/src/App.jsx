import React, { useState, useRef } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar
} from 'recharts';

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploaded, setUploaded] = useState(false);
  const [dateRange, setDateRange] = useState({ min: '', max: '' });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [analysisData, setAnalysisData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const fileInputRef = useRef(null);

  const handleFileUpload = async (file) => {
    if (!file) return;
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:8000/upload_csv', formData)
      setDateRange({ min: response.data.min_date, max: response.data.max_date });
      setStartDate(response.data.min_date);
      setEndDate(response.data.max_date);
      setUploaded(true);
    } catch (err) {
      setError('Failed to upload CSV. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      handleFileUpload(file);
    } else {
      setError('Please upload a valid CSV file.');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv') {
      handleFileUpload(file);
    } else {
      setError('Please upload a valid CSV file.');
    }
  };

  const handleAnalyze = async () => {
    if (!startDate || !endDate) {
      setError('Please select start and end dates.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('http://localhost:8000/analyze', {
        startDate: startDate,
        endDate: endDate
      });
      setAnalysisData(response.data);
    } catch (err) {
      setError('Failed to analyze data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get('http://localhost:8000/export', {
        params: { start_date: startDate, end_date: endDate },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'analysis_data.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to export data. Please try again.');
      console.error(err);
    }
  };

  const paginatedData = analysisData?.daily_percentages ? analysisData.daily_percentages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ) : [];

  const totalPages = analysisData?.daily_percentages ? Math.ceil(analysisData.daily_percentages.length / itemsPerPage) : 0;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-center mb-6">Overnight vs Intraday Analysis</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {!uploaded ? (
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
          >
            <p className="text-gray-600 mb-2">Drag and drop a CSV file here, or click to select</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".csv"
              className="hidden"
            />
            {loading && <p className="text-blue-600 mt-2">Uploading...</p>}
          </div>
        ) : (
          <div>
            <div className="mb-6 flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  min={dateRange.min}
                  max={dateRange.max}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  min={dateRange.min}
                  max={dateRange.max}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Analyzing...' : 'Analyze'}
              </button>
              {analysisData && (
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Export CSV
                </button>
              )}
            </div>

            {analysisData && (
              <div className="space-y-8">
                {/* Daywise Overnight vs Intraday Chart */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Daywise Overnight vs Intraday</h2>
                  <BarChart width={800} height={400} data={analysisData.daily_percentages}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="overnight_pct" fill="#3b82f6" name="Overnight %" />
                    <Bar dataKey="intraday_pct" fill="#ef4444" name="Intraday %" />
                  </BarChart>
                </div>

                {/* Cumulative Performance Chart */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Cumulative Performance</h2>
                  <LineChart
                    width={800}
                    height={400}
                    data={analysisData.daily_percentages.map((day, idx) => ({
                      date: day.date,
                      overnight_cum: analysisData.cumulative_performance.overnight[idx],
                      intraday_cum: analysisData.cumulative_performance.intraday[idx],
                      carry_cum: analysisData.cumulative_performance.carry[idx]
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="overnight_cum" stroke="#3b82f6" name="Overnight Cumulative" />
                    <Line type="monotone" dataKey="intraday_cum" stroke="#ef4444" name="Intraday Cumulative" />
                    <Line type="monotone" dataKey="carry_cum" stroke="#10b981" name="Carry Cumulative" />
                  </LineChart>
                </div>

                {/* Yearwise Performance Table */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Yearwise Performance</h2>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2">Year</th>
                        <th className="border border-gray-300 p-2">Overnight %</th>
                        <th className="border border-gray-300 p-2">Intraday %</th>
                        <th className="border border-gray-300 p-2">Carry %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(analysisData.year_stats.years).map(([year, stats]) => (
                        <tr key={year} className="text-center">
                          <td className="border border-gray-300 p-2">{year}</td>
                          <td className="border border-gray-300 p-2">{stats.overnight.toFixed(2)}%</td>
                          <td className="border border-gray-300 p-2">{stats.intraday.toFixed(2)}%</td>
                          <td className="border border-gray-300 p-2">{stats.carry.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Monthwise Performance Table */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Monthwise Performance</h2>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2">Month</th>
                        <th className="border border-gray-300 p-2">Avg Overnight %</th>
                        <th className="border border-gray-300 p-2">Avg Intraday %</th>
                        <th className="border border-gray-300 p-2">Avg Carry %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(analysisData.month_stats).map(([month, stats]) => (
                        <tr key={month} className="text-center">
                          <td className="border border-gray-300 p-2">{month}</td>
                          <td className="border border-gray-300 p-2">{stats.overnight.toFixed(2)}%</td>
                          <td className="border border-gray-300 p-2">{stats.intraday.toFixed(2)}%</td>
                          <td className="border border-gray-300 p-2">{stats.carry.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Daywise Performance Table (Day of Week) */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Daywise Performance (Day of Week)</h2>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2">Day</th>
                        <th className="border border-gray-300 p-2">Avg Overnight %</th>
                        <th className="border border-gray-300 p-2">Avg Intraday %</th>
                        <th className="border border-gray-300 p-2">Avg Carry %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(analysisData.day_of_week_stats).map(([day, stats]) => (
                        <tr key={day} className="text-center">
                          <td className="border border-gray-300 p-2">{day}</td>
                          <td className="border border-gray-300 p-2">{stats.overnight.toFixed(2)}%</td>
                          <td className="border border-gray-300 p-2">{stats.intraday.toFixed(2)}%</td>
                          <td className="border border-gray-300 p-2">{stats.carry.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Datewise Performance Table (Paginated) */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Datewise Performance</h2>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2">Date</th>
                        <th className="border border-gray-300 p-2">Overnight %</th>
                        <th className="border border-gray-300 p-2">Intraday %</th>
                        <th className="border border-gray-300 p-2">Carry %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((day, index) => (
                        <tr key={index} className="text-center">
                          <td className="border border-gray-300 p-2">{day.date}</td>
                          <td className="border border-gray-300 p-2">{day.overnight_pct !== null ? day.overnight_pct.toFixed(2) + '%' : 'N/A'}</td>
                          <td className="border border-gray-300 p-2">{day.intraday_pct.toFixed(2)}%</td>
                          <td className="border border-gray-300 p-2">{day.carry_pct !== null ? day.carry_pct.toFixed(2) + '%' : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-between items-center mt-4">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;