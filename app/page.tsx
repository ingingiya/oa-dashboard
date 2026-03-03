"use client";

import React, { useState, useEffect } from 'react';
import { RefreshCw, ExternalLink, Package, Target, Users, AlertCircle, CheckCircle2, TrendingDown } from 'lucide-react';

const SHEET_ID = '1r9WhAOgvdIcumgrkNkTbyYSVj1ONxyXp0trwzD-xAng'; 
const GOOGLE_SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;

export default function OABeautyDashboard() {
  const [activeTab, setActiveTab] = useState('메타광고');
  const [metaData, setMetaData] = useState<any[]>([]);
  const [seedingData, setSeedingData] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [lastSaved, setLastSaved] = useState("연동 중...");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    // [핵심] 오늘 날짜 강제 설정 (2026-03-03 기준)
    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    try {
      // 1. 메타광고 (Sheet1)
      const res1 = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Sheet1`);
      const text1 = await res1.text();
      const rows1 = JSON.parse(text1.substring(47).slice(0, -2)).table.rows;
      const parsedMeta = rows1.map((r: any) => {
        const start = new Date(r.c[2]?.f || r.c[2]?.v);
        const elapsed = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const remaining = (Number(r.c[3]?.v) || 0) - elapsed;
        return { adSet: r.c[0]?.v, campaign: r.c[1]?.v, remaining, status: r.c[4]?.v };
      }).sort((a: any, b: any) => a.remaining - b.remaining);
      setMetaData(parsedMeta);

      // 2. 시딩 (Sheet2) - 지각 계산 로직 강화
      const res2 = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Sheet2`);
      const text2 = await res2.text();
      const rows2 = JSON.parse(text2.substring(47).slice(0, -2)).table.rows;
      const parsedSeeding = rows2.map((r: any) => {
        const deadline = new Date(r.c[2]?.f || r.c[2]?.v);
        deadline.setHours(0, 0, 0, 0);
        // D-Day 계산: (마감일 - 오늘)
        const diffTime = deadline.getTime() - today.getTime();
        const remaining = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return { name: r.c[0]?.v, remaining, status: r.c[3]?.v, channel: r.c[4]?.v };
      }).sort((a: any, b: any) => a.remaining - b.remaining);
      setSeedingData(parsedSeeding);

      // 3. 재고 (Sheet3)
      const res3 = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Sheet3`);
      const text3 = await res3.text();
      const rows3 = JSON.parse(text3.substring(47).slice(0, -2)).table.rows;
      setInventoryData(rows3.map((r: any) => ({
        name: r.c[0]?.v, stock: Number(r.c[1]?.v), safety: Number(r.c[2]?.v), unit: r.c[3]?.v
      })));

      setLastSaved(new Date().toLocaleTimeString());
    } catch (e) { setLastSaved("오류 발생"); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // [중요] 상단 경고창 필터링: 마감일이 지났거나(음수), 2일 이내인 경우
  const urgentSeeding = seedingData.filter(item => item.remaining <= 2 && item.status === '진행중');
  const urgentMeta = metaData.filter(item => item.remaining <= 2 && item.status === '운영중');
  const inventoryRisk = inventoryData.filter(item => item.stock < item.safety);
  const hasUrgent = urgentSeeding.length > 0 || urgentMeta.length > 0 || inventoryRisk.length > 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-12 font-sans text-slate-900">
      {/* HEADER */}
      <header className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="bg-black text-white p-4 rounded-2xl font-black text-xl italic">OA</div>
          <h1 className="text-2xl font-black tracking-tighter uppercase">Operations Hub</h1>
        </div>
        <button onClick={fetchData} className="p-3 bg-white rounded-full shadow-sm border border-slate-200">
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      {/* 🚨 긴급 관리 대상 (CRITICAL ALERTS) */}
      {hasUrgent && (
        <section className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
          <h2 className="text-red-600 font-black mb-4 flex items-center gap-2 tracking-widest uppercase text-xs">🚨 Critical Alerts</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {urgentSeeding.map((item, i) => (
              <div key={i} className="bg-orange-600 text-white p-6 rounded-3xl shadow-lg shadow-orange-100">
                <p className="text-[10px] font-black opacity-70 uppercase tracking-widest">Seeding Overdue/Urgent</p>
                <div className="flex justify-between items-end mt-2">
                  <p className="font-black text-lg truncate w-32">{item.name}</p>
                  <p className="text-3xl font-[1000]">{item.remaining < 0 ? `LATE D+${Math.abs(item.remaining)}` : `D-${item.remaining}`}</p>
                </div>
              </div>
            ))}
            {inventoryRisk.map((item, i) => (
              <div key={i} className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg">
                <p className="text-[10px] font-black opacity-70 uppercase tracking-widest">Stock Risk</p>
                <div className="flex justify-between items-end mt-2">
                  <p className="font-black text-lg truncate">{item.name}</p>
                  <p className="text-3xl font-[1000] text-red-500">{item.stock}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TABS */}
      <nav className="flex gap-2 mb-8 bg-slate-100 p-1.5 rounded-2xl w-fit">
        {['메타광고', '시딩', '재고관리'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === tab ? 'bg-white text-black shadow-sm' : 'text-slate-400'}`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* MAIN LIST */}
      <main className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <tr>
              <th className="px-10 py-5">항목</th>
              <th className="px-10 py-5 text-center">상태</th>
              <th className="px-10 py-5 text-right">스케줄 / 현황</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {activeTab === '재고관리' ? (
              inventoryData.map((item, i) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="px-10 py-7 font-black text-slate-900">{item.name}</td>
                  <td className="px-10 py-7 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black ${item.stock < item.safety ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                      {item.stock < item.safety ? '재고부족' : '안전'}
                    </span>
                  </td>
                  <td className="px-10 py-7 text-right font-black text-2xl tracking-tighter">{item.stock} <span className="text-xs text-slate-300">/ {item.safety}</span></td>
                </tr>
              ))
            ) : (
              (activeTab === '시딩' ? seedingData : metaData).map((item, i) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="px-10 py-7 font-black text-slate-900">{item.name || item.adSet}</td>
                  <td className="px-10 py-7 text-center">
                    <span className="px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-black text-slate-500">{item.status}</span>
                  </td>
                  <td className="px-10 py-7 text-right">
                    <span className={`px-5 py-2 rounded-xl font-black text-xs ${item.remaining <= 2 ? 'bg-red-500 text-white' : 'bg-slate-900 text-white'}`}>
                      {item.remaining < 0 ? `LATE D+${Math.abs(item.remaining)}` : `D-${item.remaining}`}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </main>
    </div>
  );
}