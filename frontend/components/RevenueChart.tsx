import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { Download, Filter } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction } from '../types';

interface RevenueChartProps {
  transactions: Transaction[];
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ transactions }) => {
  const [viewMode, setViewMode] = useState<'DAILY' | 'MONTHLY'>('MONTHLY');

  // --- Data Aggregation Logic ---
  const chartData = useMemo(() => {
    const dataMap: { [key: string]: { revenue: number, sortDate: number } } = {};

    transactions.forEach(tx => {
      const date = new Date(tx.date);
      if (isNaN(date.getTime())) return;

      let key = '';
      let sortDate = 0;

      if (viewMode === 'DAILY') {
        key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        sortDate = d.getTime();
      } else {
        key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const d = new Date(date);
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        sortDate = d.getTime();
      }

      if (!dataMap[key]) {
        dataMap[key] = { revenue: 0, sortDate };
      }
      dataMap[key].revenue += tx.amount;
    });

    return Object.keys(dataMap)
      .map(key => ({
        name: key,
        revenue: dataMap[key].revenue,
        sortDate: dataMap[key].sortDate
      }))
      .sort((a, b) => a.sortDate - b.sortDate);
  }, [transactions, viewMode]);

  const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(45, 212, 191); // Teal 400
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("Aspirant Library", 14, 25);
    doc.setFontSize(12);
    doc.text("Financial Report", 160, 25);

    const sortedTx = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const tableData = sortedTx.map(t => [
      t.date, t.studentName, t.seatNumber, t.type, `${t.planType} (${t.duration})`, `Rs. ${t.amount}`
    ]);

    autoTable(doc, {
      startY: 50,
      head: [['Date', 'Student', 'Seat', 'Type', 'Plan', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [45, 212, 191] },
      foot: [['', '', '', '', 'Total', `Rs. ${totalRevenue.toLocaleString()}`]],
    });

    doc.save(`Revenue_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-8">

      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-100">
        <div className="flex p-1 bg-white rounded-xl shadow-sm w-full md:w-auto">
          <button
            onClick={() => setViewMode('DAILY')}
            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'DAILY' ? 'bg-teal-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Daily
          </button>
          <button
            onClick={() => setViewMode('MONTHLY')}
            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'MONTHLY' ? 'bg-teal-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Monthly
          </button>
        </div>

        <button
          onClick={generatePDF}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl hover:bg-gray-50 hover:border-gray-300 font-bold transition-all text-sm shadow-sm"
        >
          <Download size={16} /> Download CSV / PDF
        </button>
      </div>

      {/* Chart */}
      <div className="h-[300px] md:h-[450px] w-full bg-white rounded-[2.5rem] p-4 md:p-6 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-gray-50">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'MONTHLY' ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0fdf4" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} dy={10} interval={window.innerWidth < 768 ? 1 : 0} angle={window.innerWidth < 768 ? -45 : 0} textAnchor={window.innerWidth < 768 ? 'end' : 'middle'} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} tickFormatter={(value) => `₹${value}`} width={40} />
              <Tooltip
                cursor={{ fill: '#F0FDFA' }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 20px -3px rgba(0, 0, 0, 0.1)', backgroundColor: '#fff' }}
              />
              <Bar dataKey="revenue" fill="#2dd4bf" radius={[8, 8, 0, 0]} barSize={window.innerWidth < 768 ? 20 : 40} />
            </BarChart>
          ) : (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0fdf4" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} dy={10} interval={window.innerWidth < 768 ? 2 : 0} angle={window.innerWidth < 768 ? -45 : 0} textAnchor={window.innerWidth < 768 ? 'end' : 'middle'} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} tickFormatter={(value) => `₹${value}`} width={40} />
              <Tooltip
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 20px -3px rgba(0, 0, 0, 0.1)' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* RECENT TRANSACTIONS TABLE */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 overflow-hidden">
        <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="w-2 h-6 bg-teal-500 rounded-full"></span> Recent Transactions
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Seat</th>
                <th className="px-4 py-3 hidden md:table-cell">Plan</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium text-gray-600 divide-y divide-gray-50">
              {[...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">{new Date(tx.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-bold text-gray-800">{tx.studentName}</td>
                  <td className="px-4 py-3">#{tx.seatNumber}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs">{tx.planType} ({tx.duration})</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tx.type === 'ADMISSION' ? 'bg-green-100 text-green-700' :
                        tx.type === 'RENEWAL' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                      }`}>{tx.type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tx.paymentMode === 'ONLINE' ? 'bg-blue-100 text-blue-700' :
                        tx.paymentMode === 'PENDING' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>{tx.paymentMode || 'CASH'}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-gray-900 font-bold">₹{tx.amount}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={7} className="text-center p-8 text-gray-400">No transactions recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};