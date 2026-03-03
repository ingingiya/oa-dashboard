"use client";

import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, ExternalLink, Package, Target, 
  AlertCircle, CheckCircle2, ChevronRight, Clock 
} from 'lucide-react';

const SHEET_ID = '1r9WhAOgvdIcumgrkNkTbyYSVj1ONxyXp0trwzD-xAng'; 
const GOOGLE_SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;

export default function OABeautyDashboard() {
  const [activeTab, setActiveTab] = useState('메타광고');
  const [metaGroups, setMetaGroups] = useState<any>({});
  const [seedingData, setSeedingData] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [lastSaved, setLastSaved] = useState("데이터 로딩 중...");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // 1. Sheet1: 메타광고 (그룹화 및 계산)
      const res1 = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Sheet1`);
      const text1 = await res1.text();
      const rows1 = JSON.parse(text1.substring(47).slice(0, -2)).table.rows;
      
      const groups: any = {};
      rows1.forEach((r: any) => {
        const adSet = r.c[0]?.v;
        const campaign = r.c[1]?.v;
        const start = new Date(r.c[2]?.f || r.c[2]?.v);
        const elapsed = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const remaining = (Number(r.c[3]?.v) || 0) - elapsed;
        const status = r.c[4]?.v;

        if (!groups[adSet]) groups[adSet] = [];
        groups[adSet].push({ campaign, remaining, status });
      });
      setMetaGroups(groups);

      // 2. Sheet2: 시딩
      const res2 = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Sheet2`);
      const text2 = await res2.text();
      const rows2 = JSON.parse(text2.substring(47).slice(0, -2)).table.rows;
      setSeedingData(rows2.map((r: any) => {
        const deadline = new Date(r.c[2]?.f || r.c[2]?.v);
        deadline.setHours(0, 0, 0, 0);
        const remaining = Math.floor((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return { name: r.c[0]?.v, remaining, status: r.c[3]?.v, channel: r.c[4]?.v };
      }).sort((a: any, b: any) => a.remaining - b.remaining));

      // 3. Sheet3: 재고
      const res3 = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Sheet3`);
      const text3 = await res3.text();
      const rows3 = JSON.parse(text3.substring(47).slice(0, -2)).table.rows;
      setInventoryData(rows3.map((r: any) => ({
        name: r.c[0]?.v, stock: Number(r.c[1]?.v), safety: Number(r.c[2]?.v)
      })));

      // [복구] 마지막 업데이트 시간 표시
      setLastSaved(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) { setLastSaved("연동 오류"); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // [복구] 긴급 상황 데이터 추출 (경고창용)
  const urgentMeta: any[] = [];
  Object.keys(metaGroups).forEach(key => {
    metaGroups[key].forEach((item: any) => {
      if (item.remaining <= 2 && item.status === '운영중') urgentMeta.push({ ...item, adSet: key });
    });
  });
  const urgentSeeding = seedingData.filter(item => item.remaining <= 2 && item.status === '진행중');
  const inventoryRisk = inventoryData.filter(item => item.stock < item.safety);
  const hasUrgent = urgentMeta.length > 0 || urgentSeeding.length > 0 || inventoryRisk.length > 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-12 font-sans text-slate-900">
      {/* HEADER: 최종 업데이트 시간 복구 */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-black text-white p-4 rounded-2xl font-black text-xl italic shadow-xl rotate-2">OA</div>
          <div>
            <h1 className="text-2xl font-[1000] tracking-tighter uppercase">Operations Hub</h1>
            <div className="flex items-center gap-2 text-indigo-600 mt-1">
              <Clock size={12} />
              <p className="text-[10px] font-bold uppercase tracking-widest">Last Updated: {lastSaved}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="p-3 bg-white rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-all">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => window.open(GOOGLE_SHEET_URL, '_blank')} className="p-3 bg-black text-white rounded-xl shadow-lg hover:bg-slate-800 transition-all">
            <ExternalLink size={20} />
          </button>
        </div>
      </header>

      {/* [복구] 긴급 상황실 (CRITICAL ALERTS) */}
      {hasUrgent && (
        <section className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-2 mb-4 px-2">
            <AlertCircle className="text-red-600" size={18} />
            <h2 className="text-xs font-black text-red-600 uppercase tracking-[0.2em]">Critical Alerts</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {urgentSeeding.map((item, i) => (
              <div key={`u-s-${i}`} className="bg-orange-600 text-white p-6 rounded-3xl shadow-lg">
                <p className="text-[9px] font-black opacity-70 uppercase tracking-widest">Seeding Overdue</p>
                <div className="flex justify-between items-end mt-1">
                  <p className="font-bold text-base truncate w-32">{item.name}</p>
                  <p className="text-2xl font-black">{item.remaining < 0 ? `LATE D+${Math.abs(item.remaining)}` : `D-${item.remaining}`}</p>
                </div>
              </div>
            ))}
            {urgentMeta.map((item, i) => (
              <div key={`u-m-${i}`} className="bg-red-600 text-white p-6 rounded-3xl shadow-lg">
                <p className="text-[9px] font-black opacity-70 uppercase tracking-widest">Ad Fatigue</p>
                <div className="flex justify-between items-end mt-1">
                  <p className="font-bold text-base truncate w-32">{item.campaign}</p>
                  <p className="text-2xl font-black">D-{item.remaining}</p>
                </div>
              </div>
            ))}
            {inventoryRisk.map((item, i) => (
              <div key={`u-i-${i}`} className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg">
                <p className="text-[9px] font-black opacity-70 uppercase tracking-widest">Stock Risk</p>
                <div className="flex justify-between items-end mt-1">
                  <p className="font-bold text-base truncate w-32">{item.name}</p>
                  <p className="text-2xl font-black text-red-400">{item.stock}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TABS */}
      <nav className="flex gap-2 mb-8 bg-slate-100 p-1.5 rounded-2xl w-fit">
        {['메타광고', '시딩', '재고관리'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === tab ? 'bg-white text-black shadow-sm' : 'text-slate-400'}`}>{tab}</button>
        ))}
      </nav>

      {/* MAIN CONTENT */}
      <main className="space-y-4">
        {activeTab === '메타광고' && Object.keys(metaGroups).map((adSetName) => (
          <div key={adSetName} className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 px-10 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target size={18} className="text-indigo-600" />
                <h3 className="font-black text-slate-900 uppercase tracking-tight text-lg">{adSetName}</h3>
              </div>
              <span className="text-[10px] bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full font-black">AD SET</span>
            </div>
            <div className="divide-y divide-slate-50">
              {metaGroups[adSetName].map((item: any, idx: number) => (
                <div key={idx} className="px-10 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/50">
                  <div className="flex items-center gap-4">
                    <ChevronRight size={16} className="text-slate-200" />
                    <p className="font-bold text-slate-700 text-base">{item.campaign}</p>
                  </div>
                  <div className={`px-5 py-2 rounded-xl font-black text-xs ${item.remaining <= 2 ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-900 text-white'}`}>
                    {item.remaining < 0 ? `지각 D+${Math.abs(item.remaining)}` : `교체 D-${item.remaining}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {activeTab === '시딩' && (
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
             <table className="w-full text-left">
               <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-widest"><tr className="px-10"><th className="px-10 py-5">인플루언서 / 채널</th><th className="px-10 py-5 text-right">마감 스케줄</th></tr></thead>
               <tbody className="divide-y divide-slate-50">
                 {seedingData.map((item, i) => (
                   <tr key={i} className="hover:bg-slate-50/50">
                     <td className="px-10 py-7 font-black text-slate-900">{item.name} <span className="text-[10px] text-indigo-500 ml-2 uppercase font-black tracking-tighter">[{item.channel}]</span></td>
                     <td className="px-10 py-7 text-right">
                       <span className={`px-5 py-2 rounded-xl font-black text-xs ${item.remaining <= 2 ? 'bg-red-500 text-white' : 'bg-slate-900 text-white'}`}>
                        {item.remaining < 0 ? `LATE D+${Math.abs(item.remaining)}` : `D-${item.remaining}`}
                       </span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        )}

        {activeTab === '재고관리' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {inventoryData.map((item, i) => (
              <div key={i} className={`p-8 rounded-[40px] bg-white border shadow-sm ${item.stock < item.safety ? 'border-red-200' : 'border-slate-100'}`}>
                <h3 className="font-black text-slate-900 text-xl mb-6 tracking-tighter">{item.name}</h3>
                <div className="flex items-end gap-2">
                  <span className={`text-6xl font-[1000] tracking-tighter ${item.stock < item.safety ? 'text-red-600' : 'text-slate-900'}`}>{item.stock}</span>
                  <span className="text-slate-300 font-bold mb-2">/ {item.safety}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}