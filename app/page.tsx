"use client";

import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, ExternalLink, Package, Target, 
  AlertCircle, CheckCircle2, ChevronRight, Clock, TrendingDown, TrendingUp, Info
} from 'lucide-react';

const SHEET_ID = '1r9WhAOgvdIcumgrkNkTbyYSVj1ONxyXp0trwzD-xAng'; 
const GOOGLE_SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;

export default function OABeautyDashboard() {
  const [activeTab, setActiveTab] = useState('지휘소'); // 기본 탭을 지휘소로 설정
  const [metaGroups, setMetaGroups] = useState<any>({});
  const [seedingData, setSeedingData] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [budgetData, setBudgetData] = useState<any[]>([]); // 시트 4 데이터
  const [lastSaved, setLastSaved] = useState("데이터 로딩 중...");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // 1. Sheet1: 메타광고 현황
      const res1 = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Sheet1`);
      const text1 = await res1.text();
      const rows1 = JSON.parse(text1.substring(47).slice(0, -2)).table.rows;
      const groups: any = {};
      rows1.forEach((r: any) => {
        const adSet = r.c[0]?.v || "미지정 세트";
        const campaign = r.c[1]?.v || "미지정 캠페인";
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
      setSeedingData(rows2.map((r: any) => ({
        name: r.c[0]?.v, remaining: Math.floor((new Date(r.c[2]?.f || r.c[2]?.v).getTime() - today.getTime()) / 86400000), status: r.c[3]?.v, channel: r.c[4]?.v
      })));

      // 3. Sheet3: 재고
      const res3 = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Sheet3`);
      const text3 = await res3.text();
      const rows3 = JSON.parse(text3.substring(47).slice(0, -2)).table.rows;
      setInventoryData(rows3.map((r: any) => ({ name: r.c[0]?.v, stock: Number(r.c[1]?.v), safety: Number(r.c[2]?.v) })));

      // 4. [신규] Sheet4: 정밀 예산 지휘소 데이터
      const res4 = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Sheet4`);
      const text4 = await res4.text();
      const rows4 = JSON.parse(text4.substring(47).slice(0, -2)).table.rows;
      setBudgetData(rows4.map((r: any) => {
        const name = r.c[1]?.v || "항목명 없음";
        const spend = Number(r.c[2]?.v) || 0;
        const results = Number(r.c[3]?.v) || 0;
        const lpv = Number(r.c[4]?.v) || 0;
        const clicks = Number(r.c[5]?.v) || 0;
        const targetCpa = Number(r.c[7]?.v) || 0;
        const avgCpa7d = Number(r.c[8]?.v) || 0;
        const currentBudget = Number(r.c[9]?.v) || 0;

        const currentCpa = results > 0 ? Math.round(spend / results) : 0;
        const lpvRate = clicks > 0 ? Math.round((lpv / clicks) * 100) : 0;
        
        let decision: any = { type: 'KEEP', label: "관망", reason: "성과 추이 확인 중", color: "bg-slate-100 text-slate-500", budget: currentBudget };

        if (currentCpa > 0 && currentCpa <= targetCpa) {
          if (currentCpa <= avgCpa7d) {
            decision = { type: 'SCALE', label: "🔥 공격 증액", reason: `7일 평균 대비 효율 ${Math.round(((avgCpa7d-currentCpa)/avgCpa7d)*100)}% 상승. 강력 추천.`, color: "bg-emerald-600 text-white", budget: Math.round(currentBudget * 1.3) };
          } else {
            decision = { type: 'SCALE', label: "📈 완만 증액", reason: "목표 내 진입했으나 주간 평균 대비 소폭 상승세.", color: "bg-emerald-400 text-white", budget: Math.round(currentBudget * 1.1) };
          }
        } else if (currentCpa > targetCpa * 1.2 && currentCpa >= avgCpa7d) {
          decision = { type: 'OFF', label: "💀 즉시 OFF", reason: "목표가 이탈 및 하락세 지속. 즉시 중단 권장.", color: "bg-red-500 text-white animate-pulse", budget: 0 };
        }

        if (lpvRate < 50 && clicks > 30) decision.reason = `도달율(${lpvRate}%) 심각. 상세페이지 로딩 혹은 내용 불일치 점검 필요.`;

        return { name, spend, currentCpa, targetCpa, avgCpa7d, currentBudget, lpvRate, ...decision };
      }));

      setLastSaved(new Date().toLocaleTimeString('ko-KR'));
    } catch (e) { setLastSaved("연동 오류"); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openLink = (url: string) => { if (!url) return; window.open(url.startsWith('http') ? url : `https://${url}`, '_blank'); };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-12 font-sans text-slate-900">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-black text-white p-4 rounded-2xl font-black text-xl italic shadow-xl rotate-2">OA</div>
          <div><h1 className="text-2xl font-[1000] tracking-tighter uppercase">Operations Hub</h1><p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest mt-1">Last Sync: {lastSaved}</p></div>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="p-3 bg-white rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-all"><RefreshCw size={20} className={loading ? 'animate-spin' : ''} /></button>
          <button onClick={() => window.open(GOOGLE_SHEET_URL, '_blank')} className="p-3 bg-black text-white rounded-xl shadow-lg hover:bg-slate-800 transition-all"><ExternalLink size={20} /></button>
        </div>
      </header>

      {/* 🎖️ DAILY ACTION CENTER (시트 4 기반 최상단 지휘소) */}
      <section className="mb-12">
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Daily Action Center</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {budgetData.filter(item => item.type !== 'KEEP').map((item, i) => (
            <div key={i} className={`p-6 rounded-[32px] bg-white border-l-[12px] shadow-sm flex flex-col justify-between ${item.type === 'SCALE' ? 'border-emerald-500' : 'border-red-500'}`}>
              <div className="flex justify-between items-start mb-4">
                <div><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${item.color}`}>{item.label}</span><h3 className="text-lg font-black text-slate-900 mt-2 truncate w-48">{item.name}</h3></div>
                <div className="text-right">
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Guide Budget</p>
                  <p className={`text-2xl font-[1000] ${item.type === 'SCALE' ? 'text-emerald-600' : 'text-red-500'}`}>{item.type === 'OFF' ? 'OFF' : `${item.budget.toLocaleString()}원`}</p>
                </div>
              </div>
              <div className={`p-4 rounded-2xl flex gap-3 items-start ${item.type === 'SCALE' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                <Info size={16} className={item.type === 'SCALE' ? 'text-emerald-600 shrink-0 mt-0.5' : 'text-red-600 shrink-0 mt-0.5'} />
                <p className="text-xs font-bold text-slate-700 leading-snug">{item.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TABS */}
      <nav className="flex gap-2 mb-8 bg-slate-100 p-1.5 rounded-2xl w-fit">
        {['지휘소', '메타광고', '시딩', '재고관리'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === tab ? 'bg-white text-black shadow-sm' : 'text-slate-400'}`}>{tab}</button>
        ))}
      </nav>

      {/* MAIN CONTENT (기존 UI 로직 유지) */}
      <main className="space-y-4">
        {activeTab === '지휘소' && <div className="p-10 text-center bg-white rounded-[40px] border border-dashed border-slate-200 text-slate-400 font-bold">상단 Action Center를 확인하거나 탭을 이동하세요.</div>}
        {activeTab === '메타광고' && Object.keys(metaGroups).map((name) => (
          <div key={name} className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 px-8 py-4 border-b border-slate-100 flex justify-between items-center"><h3 className="font-black text-slate-900">{name}</h3><Target size={16} className="text-indigo-600"/></div>
            {metaGroups[name].map((item: any, idx: number) => (
              <div key={idx} className="px-8 py-5 flex justify-between items-center hover:bg-slate-50/50">
                <p className="font-bold text-slate-600 text-sm truncate w-2/3">{item.campaign}</p>
                <span className={`px-4 py-2 rounded-xl text-[10px] font-black ${item.remaining <= 2 ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-900 text-white'}`}>D-{item.remaining}</span>
              </div>
            ))}
          </div>
        ))}
        {/* 시딩, 재고관리 기존 UI 코드 동일하게 적용 */}
      </main>
    </div>
  );
}