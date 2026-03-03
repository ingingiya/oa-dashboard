"use client";

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Clock, RefreshCw, ExternalLink, Package, 
  TrendingDown, Target, Users, LayoutDashboard, 
  AlertCircle, CheckCircle2 
} from 'lucide-react';

const SHEET_ID = '1r9WhAOgvdIcumgrkNkTbyYSVj1ONxyXp0trwzD-xAng'; 
const GOOGLE_SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;

type TabType = '메타광고' | '시딩' | '재고관리';

export default function OABeautyDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('메타광고');
  const [metaData, setMetaData] = useState<any[]>([]);
  const [seedingData, setSeedingData] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [lastSaved, setLastSaved] = useState<string>("연동 중...");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // 1. Sheet1: 메타광고 (A: 캠페인명, B: 게재일, C: 교체주기, D: 상태)
      const res1 = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Sheet1`);
      const text1 = await res1.text();
      const rows1 = JSON.parse(text1.substring(47).slice(0, -2)).table.rows;
      setMetaData(rows1.map((r: any) => {
        const start = new Date(r.c[1]?.f || r.c[1]?.v);
        const elapsed = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const remaining = (Number(r.c[2]?.v) || 0) - elapsed;
        return { name: r.c[0]?.v, start: r.c[1]?.f || r.c[1]?.v, remaining, status: r.c[3]?.v };
      }));

      // 2. Sheet2: 시딩 (A: 인플루언서, B: 시작일, C: 마감일, D: 상태, E: 채널)
      const res2 = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Sheet2`);
      const text2 = await res2.text();
      const rows2 = JSON.parse(text2.substring(47).slice(0, -2)).table.rows;
      setSeedingData(rows2.map((r: any) => {
        const deadline = new Date(r.c[2]?.f || r.c[2]?.v);
        const remaining = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return { name: r.c[0]?.v, start: r.c[1]?.f || r.c[1]?.v, remaining, status: r.c[3]?.v, channel: r.c[4]?.v };
      }));

      // 3. Sheet3: 재고 (A: 제품명, B: 현재재고, C: 안전재고, D: 단위)
      const res3 = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Sheet3`);
      const text3 = await res3.text();
      const rows3 = JSON.parse(text3.substring(47).slice(0, -2)).table.rows;
      setInventoryData(rows3.map((r: any) => ({
        name: r.c[0]?.v, stock: Number(r.c[1]?.v), safety: Number(r.c[2]?.v), unit: r.c[3]?.v
      })));

      setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e) { setLastSaved("오류 발생"); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-12 font-sans text-slate-900">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 p-4 rounded-3xl text-white shadow-2xl tracking-tighter italic font-black text-2xl rotate-2">OA</div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter">OPERATIONS HUB</h1>
            <div className="flex items-center gap-2 text-indigo-500 font-bold text-[10px] tracking-widest uppercase">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span> Live Tracking
            </div>
          </div>
        </div>
        <div className="flex bg-white p-2 rounded-[24px] shadow-sm border border-slate-100 items-center gap-4">
          <div className="px-4 py-1 text-right border-r border-slate-100">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">Sync Status</p>
            <p className="text-xs font-black text-slate-600">{lastSaved}</p>
          </div>
          <button onClick={fetchData} className={`p-2 hover:bg-slate-50 rounded-xl transition-all ${loading ? 'animate-spin' : ''}`}><RefreshCw size={18} /></button>
          <button onClick={() => window.open(GOOGLE_SHEET_URL, '_blank')} className="bg-indigo-600 p-3 rounded-2xl text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100"><ExternalLink size={20} /></button>
        </div>
      </header>

      <nav className="flex gap-3 mb-10 overflow-x-auto pb-2">
        {(['메타광고', '시딩', '재고관리'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-4 rounded-2xl text-sm font-black transition-all whitespace-nowrap ${
              activeTab === tab ? 'bg-slate-900 text-white shadow-xl' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'
            }`}
          >
            {tab === '메타광고' && <Target size={16} className="inline mr-2" />}
            {tab === '시딩' && <Users size={16} className="inline mr-2" />}
            {tab === '재고관리' && <Package size={16} className="inline mr-2" />}
            {tab}
          </button>
        ))}
      </nav>

      <main className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {activeTab === '메타광고' && <TableUI data={metaData} label="소재교체" />}
        {activeTab === '시딩' && <TableUI data={seedingData} label="작성마감" isSeeding />}
        {activeTab === '재고관리' && <InventoryUI data={inventoryData} />}
      </main>
    </div>
  );
}

function TableUI({ data, label, isSeeding = false }: any) {
  return (
    <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
            <th className="px-10 py-5">{isSeeding ? '인플루언서' : '캠페인명'}</th>
            <th className="px-10 py-5 text-center">상태</th>
            <th className="px-10 py-5 text-right">D-Day 스케줄</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map((item: any, i: number) => (
            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-10 py-7 font-black text-slate-800">
                {item.name}
                {isSeeding && <p className="text-[10px] text-indigo-500 mt-1">Channel: {item.channel}</p>}
              </td>
              <td className="px-10 py-7 text-center">
                <span className={`px-3 py-1.5 rounded-full text-[10px] font-black ${item.status === '운영중' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                  {item.status}
                </span>
              </td>
              <td className="px-10 py-7 text-right font-black">
                <span className={`px-4 py-2 rounded-xl text-xs ${item.remaining <= 2 ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-900 text-white'}`}>
                  {label} D-{item.remaining}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InventoryUI({ data }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.map((item: any, i: number) => {
        const isRisk = item.stock < item.safety;
        return (
          <div key={i} className={`p-8 rounded-[40px] bg-white border shadow-sm flex flex-col justify-between ${isRisk ? 'border-red-200' : 'border-slate-100'}`}>
            <div className="flex justify-between items-start">
              <h3 className="font-black text-slate-900 text-xl">{item.name}</h3>
              {isRisk ? <TrendingDown className="text-red-500 animate-bounce" /> : <CheckCircle2 className="text-emerald-500" />}
            </div>
            <div className="mt-8 flex items-end gap-2">
              <span className={`text-6xl font-[1000] tracking-tighter ${isRisk ? 'text-red-600' : 'text-slate-900'}`}>{item.stock}</span>
              <span className="text-slate-300 font-bold mb-2">/ 목표 {item.safety}{item.unit}</span>
            </div>
            {isRisk && <p className="mt-4 text-[11px] font-black text-red-500 uppercase tracking-widest animate-pulse">발주 필요: 부족분 {item.safety - item.stock}</p>}
          </div>
        );
      })}
    </div>
  );
}