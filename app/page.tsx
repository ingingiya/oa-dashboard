"use client";

import React, { useState, useEffect } from 'react';
import { RefreshCw, ExternalLink, Package, Target, Users, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';

const SHEET_ID = '1r9WhAOgvdIcumgrkNkTbyYSVj1ONxyXp0trwzD-xAng'; 
const GOOGLE_SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;

export default function OABeautyDashboard() {
  const [activeTab, setActiveTab] = useState('메타광고');
  const [metaGroups, setMetaGroups] = useState<any>({}); // 그룹화된 데이터 저장
  const [seedingData, setSeedingData] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [lastSaved, setLastSaved] = useState("연동 중...");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // 1. 메타광고 (Sheet1) - 그룹화 로직 추가
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

      // 2. 시딩 (Sheet2)
      const res2 = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Sheet2`);
      const text2 = await res2.text();
      const rows2 = JSON.parse(text2.substring(47).slice(0, -2)).table.rows;
      setSeedingData(rows2.map((r: any) => {
        const deadline = new Date(r.c[2]?.f || r.c[2]?.v);
        const remaining = Math.floor((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return { name: r.c[0]?.v, remaining, status: r.c[3]?.v, channel: r.c[4]?.v };
      }).sort((a: any, b: any) => a.remaining - b.remaining));

      // 3. 재고 (Sheet3)
      const res3 = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Sheet3`);
      const text3 = await res3.text();
      const rows3 = JSON.parse(text3.substring(47).slice(0, -2)).table.rows;
      setInventoryData(rows3.map((r: any) => ({
        name: r.c[0]?.v, stock: Number(r.c[1]?.v), safety: Number(r.c[2]?.v)
      })));

      setLastSaved(new Date().toLocaleTimeString());
    } catch (e) { setLastSaved("오류 발생"); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-12 font-sans text-slate-900">
      <header className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="bg-black text-white p-4 rounded-2xl font-black text-xl italic shadow-xl rotate-2">OA</div>
          <h1 className="text-2xl font-black tracking-tighter uppercase">Operations Hub</h1>
        </div>
        <button onClick={fetchData} className="p-3 bg-white rounded-full shadow-sm border border-slate-200 hover:rotate-180 transition-all duration-500">
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      <nav className="flex gap-2 mb-8 bg-slate-100 p-1.5 rounded-2xl w-fit">
        {['메타광고', '시딩', '재고관리'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === tab ? 'bg-white text-black shadow-sm' : 'text-slate-400'}`}>{tab}</button>
        ))}
      </nav>

      <main className="space-y-4">
        {activeTab === '메타광고' && Object.keys(metaGroups).map((adSetName) => (
          <div key={adSetName} className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 px-10 py-5 border-b border-slate-100 flex items-center gap-3">
              <Target size={18} className="text-indigo-600" />
              <h3 className="font-black text-slate-900 uppercase tracking-tight text-lg">{adSetName}</h3>
              <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold">AD SET</span>
            </div>
            <div className="divide-y divide-slate-50">
              {metaGroups[adSetName].map((item: any, idx: number) => (
                <div key={idx} className="px-10 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <ChevronRight size={16} className="text-slate-300" />
                    <div>
                      <p className="font-bold text-slate-800 text-base">{item.campaign}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.status}</p>
                    </div>
                  </div>
                  <div className={`px-5 py-2 rounded-2xl font-black text-xs ${item.remaining <= 2 ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-100' : 'bg-slate-900 text-white'}`}>
                    소재교체 {item.remaining < 0 ? `LATE D+${Math.abs(item.remaining)}` : `D-${item.remaining}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {activeTab === '시딩' && (
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
             <table className="w-full text-left font-bold">
               <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-widest"><tr className="px-10"><th className="px-10 py-5">인플루언서</th><th className="px-10 py-5 text-right">상태 / 마감</th></tr></thead>
               <tbody className="divide-y divide-slate-50">
                 {seedingData.map((item, i) => (
                   <tr key={i} className="hover:bg-slate-50/50">
                     <td className="px-10 py-7 font-black text-slate-900">{item.name} <span className="text-[10px] text-indigo-500 ml-2 uppercase font-black">{item.channel}</span></td>
                     <td className="px-10 py-7 text-right">
                       <span className={`px-4 py-2 rounded-xl font-black text-xs ${item.remaining <= 2 ? 'bg-red-500 text-white' : 'bg-slate-900 text-white'}`}>
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
              <div key={i} className={`p-8 rounded-[40px] bg-white border shadow-sm ${item.stock < item.safety ? 'border-red-200 bg-red-50/20' : 'border-slate-100'}`}>
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