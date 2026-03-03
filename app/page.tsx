"use client";

import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, ExternalLink, Package, Target, 
  AlertCircle, CheckCircle2, ChevronRight, Clock, TrendingDown, TrendingUp, Info 
} from 'lucide-react';

const SHEET_ID = '1r9WhAOgvdIcumgrkNkTbyYSVj1ONxyXp0trwzD-xAng'; 
const GOOGLE_SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;

export default function OABeautyDashboard() {
  const [activeTab, setActiveTab] = useState('메타광고 체크');
  const [metaGroups, setMetaGroups] = useState<any>({});
  const [seedingData, setSeedingData] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [budgetData, setBudgetData] = useState<any[]>([]); 
  const [lastSaved, setLastSaved] = useState("데이터 로딩 중...");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // 1. Sheet1: 메타광고 현황 (그룹화 로직)
      const res1 = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Sheet1`);
      const text1 = await res1.text();
      const rows1 = JSON.parse(text1.substring(47).slice(0, -2)).table.rows;
      const groups: any = {};
      rows1.forEach((r: any) => {
        const adSet = r.c[0]?.v || "미지정 세트";
        const campaign = r.c[1]?.v || "미지정 캠페인";
        const start = new Date(r.c[2]?.f || r.c[2]?.v);
        const elapsed = Math.floor((today.getTime() - start.getTime()) / 86400000);
        const remaining = (Number(r.c[3]?.v) || 0) - elapsed;
        const status = r.c[4]?.v;
        if (!groups[adSet]) groups[adSet] = [];
        groups[adSet].push({ campaign, remaining, status });
      });
      setMetaGroups(groups);

      // 2. Sheet2: 시딩 (정렬 로직)
      const res2 = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Sheet2`);
      const text2 = await res2.text();
      const rows2 = JSON.parse(text2.substring(47).slice(0, -2)).table.rows;
      setSeedingData(rows2.map((r: any) => ({
        name: r.c[0]?.v, remaining: Math.floor((new Date(r.c[2]?.f || r.c[2]?.v).getTime() - today.getTime()) / 86400000), status: r.c[3]?.v, channel: r.c[4]?.v
      })).sort((a: any, b: any) => a.remaining - b.remaining));

      // 3. Sheet3: 재고
      const res3 = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Sheet3`);
      const text3 = await res3.text();
      const rows3 = JSON.parse(text3.substring(47).slice(0, -2)).table.rows;
      setInventoryData(rows3.map((r: any) => ({ name: r.c[0]?.v, stock: Number(r.c[1]?.v), safety: Number(r.c[2]?.v) })));

      // 4. Sheet4: 메타광고 체크 (정밀 분석 로직)
      const res4 = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Sheet4`);
      const text4 = await res4.text();
      const rows4 = JSON.parse(text4.substring(47).slice(0, -2)).table.rows;
      // fetchData 함수 내부의 budgetData 매핑 부분을 이 로직으로 교체하세요.
// 4. Sheet4: 메타광고 체크 (정밀 가이드 로직)
// 4. Sheet4: 메타광고 체크 (트래픽/전환 지능형 분석)
setBudgetData(rows4.map((r: any) => {
  const name = r.c[1]?.v || "";
  const spend = Number(r.c[2]?.v) || 0;
  const results = Number(r.c[3]?.v) || 0;
  const lpv = Number(r.c[4]?.v) || 0;
  const target = Number(r.c[7]?.v) || 0; // 시트의 목표값
  const avg7d = Number(r.c[8]?.v) || 0; // 시트의 7일 평균값
  const currentBudget = Number(r.c[9]?.v) || 0;

  // 캠페인 성격 자동 판별 (이름 기준)
  const isTraffic = name.includes("트래픽") || name.includes("LPV");
  const currentCost = isTraffic 
    ? (lpv > 0 ? Math.round(spend / lpv) : 0) 
    : (results > 0 ? Math.round(spend / results) : 0);
  
  let decision: any = { type: 'KEEP', label: "유지", reason: "정상 범위", color: "bg-slate-100 text-slate-400", budget: currentBudget };

  // AI 판단 매트릭스
  if (currentCost > 0 && currentCost <= target) {
    if (avg7d > 0 && currentCost <= avg7d) {
      // 주간 평균보다 잘하고 목표 달성 시 -> 공격 증액
      decision = { 
        type: 'SCALE', label: "🔥 공격 증액", 
        reason: `${isTraffic ? '유입비용' : '구매비용'}이 주간 평균(${avg7d}원)보다 낮아 효율 극대화 중입니다.`, 
        color: "bg-emerald-600 text-white shadow-emerald-100", budget: Math.round(currentBudget * 1.3) 
      };
    } else {
      // 목표는 달성했으나 주간 평균보다는 높을 때 -> 완만 증액
      decision = { 
        type: 'SCALE', label: "📈 완만 증액", 
        reason: "목표 범위 내에 있으나 주간 평균 대비 소폭 하락세입니다. 10% 증액 권장.", 
        color: "bg-emerald-400 text-white", budget: Math.round(currentBudget * 1.1) 
      };
    }
  } else if (currentCost > target * 1.2 || (spend > target && currentCost === 0)) {
    // 목표가 대폭 이탈했거나 돈만 쓰고 결과가 없을 때 -> OFF
    decision = { 
      type: 'OFF', label: "💀 즉시 OFF", 
      reason: `목표(${target}원)를 크게 벗어났습니다. ${isTraffic ? '유입' : '전환'} 단가가 너무 비쌉니다.`, 
      color: "bg-red-500 text-white animate-pulse", budget: 0 
    };
  }

  return { name, spend, currentCost, target, avg7d, isTraffic, ...decision };
}));
      setLastSaved(new Date().toLocaleTimeString('ko-KR'));
    } catch (e) { setLastSaved("연동 오류"); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openLink = (url: string) => { if (!url) return; window.open(url.startsWith('http') ? url : `https://${url}`, '_blank'); };

  // 긴급 알림 데이터 추출
  const urgentMeta: any[] = [];
  Object.keys(metaGroups).forEach(key => metaGroups[key].forEach((item: any) => { if (item.remaining <= 2 && item.status === '운영중') urgentMeta.push({ ...item, adSet: key }); }));
  const urgentSeeding = seedingData.filter(item => item.remaining <= 2 && item.status === '진행중');
  const inventoryRisk = inventoryData.filter(item => item.stock < item.safety);
  const hasUrgent = urgentMeta.length > 0 || urgentSeeding.length > 0 || inventoryRisk.length > 0;

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

      {/* 🎖️ 메타광고 체크 (최상단 데일리 액션 가이드) */}
      {activeTab === '메타광고 체크' && (
  <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
    <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">실시간 성과 상세 분석</p>
    </div>
    <div className="divide-y divide-slate-50">
      {budgetData.map((item, i) => (
        <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[8px] px-1.5 py-0.5 rounded font-black ${item.isTraffic ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                {item.isTraffic ? 'TRAFFIC' : 'CONVERSION'}
              </span>
              <p className="font-bold text-slate-700 text-sm truncate" title={item.name}>{item.name}</p>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">지출: {item.spend.toLocaleString()}원</p>
          </div>
          
          <div className="flex items-center gap-10 text-right">
            <div>
              <p className="text-[9px] text-slate-400 font-black uppercase mb-0.5">Current Cost</p>
              <p className={`text-sm font-black ${item.currentCost <= item.target ? 'text-emerald-600' : 'text-red-500'}`}>
                {item.currentCost === 0 ? '전환 없음' : `${item.currentCost.toLocaleString()}원`}
              </p>
            </div>
            <div className="w-28 flex flex-col items-end">
              <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase mb-1 ${item.color}`}>{item.label}</span>
              <p className="text-[9px] text-slate-400 italic leading-tight text-right w-full">{item.reason}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
    

      {/* CRITICAL ALERTS (기존 스타일 보존) */}
      {hasUrgent && (
        <section className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-2 mb-4 px-2 text-red-600"><AlertCircle size={18} /><h2 className="text-xs font-black uppercase tracking-[0.2em]">Critical Alerts</h2></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {urgentSeeding.map((item, i) => (
              <div key={`u-s-${i}`} className="bg-orange-600 text-white p-6 rounded-3xl shadow-lg cursor-pointer hover:bg-orange-700 transition-colors" onClick={() => openLink(item.channel)}>
                <p className="text-[9px] font-black opacity-70 uppercase tracking-widest flex items-center gap-1">Seeding Overdue <ExternalLink size={8}/></p>
                <div className="flex justify-between items-end mt-1"><p className="font-bold text-base truncate w-32">{item.name}</p><p className="text-2xl font-black">{item.remaining < 0 ? `LATE D+${Math.abs(item.remaining)}` : `D-${item.remaining}`}</p></div>
              </div>
            ))}
            {urgentMeta.map((item, i) => (
              <div key={`u-m-${i}`} className="bg-red-600 text-white p-6 rounded-3xl shadow-lg"><p className="text-[9px] font-black opacity-70 uppercase tracking-widest">Ad Fatigue</p><div className="flex justify-between items-end mt-1"><p className="font-bold text-base truncate w-32">{item.campaign}</p><p className="text-2xl font-black">D-{item.remaining}</p></div></div>
            ))}
            {inventoryRisk.map((item, i) => (
              <div key={`u-i-${i}`} className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg"><p className="text-[9px] font-black opacity-70 uppercase tracking-widest">Stock Risk</p><div className="flex justify-between items-end mt-1"><p className="font-bold text-base truncate w-32">{item.name}</p><p className="text-2xl font-black text-red-400">{item.stock}</p></div></div>
            ))}
          </div>
        </section>
      )}

      {/* TABS */}
      <nav className="flex gap-2 mb-8 bg-slate-100 p-1.5 rounded-2xl w-fit">
        {['메타광고 체크', '메타광고 현황', '시딩', '재고관리'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === tab ? 'bg-white text-black shadow-sm' : 'text-slate-400'}`}>{tab}</button>
        ))}
      </nav>

      {/* MAIN CONTENT */}
      <main className="space-y-4">
        {activeTab === '메타광고 체크' && (
            <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm p-10 text-center">
                <p className="text-slate-400 font-bold italic">상단 "메타광고 체크" 지휘소 섹션에서 오늘의 액션 가이드를 확인하세요.</p>
            </div>
        )}

        {activeTab === '메타광고 현황' && Object.keys(metaGroups).map((adSetName) => (
          <div key={adSetName} className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 px-10 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0"><Target size={18} className="text-indigo-600 flex-shrink-0" /><h3 className="font-black text-slate-900 uppercase tracking-tight text-lg truncate">{adSetName}</h3></div>
              <span className="text-[10px] bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full font-black flex-shrink-0">AD SET</span>
            </div>
            <div className="divide-y divide-slate-50">
              {metaGroups[adSetName].map((item: any, idx: number) => (
                <div key={idx} className="px-10 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4 min-w-0 w-full"><ChevronRight size={16} className="text-slate-200 flex-shrink-0" /><p className="font-bold text-slate-700 text-base truncate">{item.campaign}</p></div>
                  <div className={`px-5 py-2 rounded-xl font-black text-xs whitespace-nowrap flex-shrink-0 ${item.remaining <= 2 ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-900 text-white'}`}>{item.remaining < 0 ? `지각 D+${Math.abs(item.remaining)}` : `교체 D-${item.remaining}`}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {activeTab === '시딩' && (
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
             <table className="w-full text-left table-fixed">
               <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-100">
                 <tr><th className="px-10 py-5 w-2/3">인플루언서 / 채널</th><th className="px-10 py-5 text-right w-1/3">마감 스케줄</th></tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {seedingData.map((item, i) => (
                   <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                     <td className="px-10 py-7 font-black text-slate-900 truncate">
                        <span>{item.name}</span>
                        {item.channel && ( <button onClick={() => openLink(item.channel)} className="ml-3 px-2 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-[1000] rounded-md hover:bg-indigo-600 hover:text-white transition-all inline-flex items-center gap-1">LINK <ExternalLink size={8} /></button> )}
                     </td>
                     <td className="px-10 py-7 text-right"><span className={`px-5 py-2 rounded-xl font-black text-xs whitespace-nowrap ${item.remaining <= 2 ? 'bg-red-500 text-white' : 'bg-slate-900 text-white'}`}>{item.remaining < 0 ? `LATE D+${Math.abs(item.remaining)}` : `D-${item.remaining}`}</span></td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        )}

        {activeTab === '재고관리' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inventoryData.map((item, i) => {
              const isRisk = item.stock < item.safety;
              return (
                <div key={i} className={`p-8 rounded-[40px] bg-white border shadow-sm transition-all hover:shadow-md ${isRisk ? 'border-red-200 ring-4 ring-red-50' : 'border-slate-100 hover:border-indigo-100'}`}>
                  <h3 
  className="font-black text-slate-900 text-xl mb-6 tracking-tighter truncate leading-tight cursor-help" 
  title={item.name} // 이 부분이 마우스 호버 시 전체 이름을 띄워주는 핵심입니다.
>
  {item.name}
</h3>
                  <div className="flex items-end justify-between">
                    <div className="flex items-end gap-2">
                      <span className={`text-6xl font-[1000] tracking-tighter ${isRisk ? 'text-red-600' : 'text-slate-900'}`}>{item.stock}</span>
                      <span className="text-slate-300 font-bold mb-2">/ {item.safety}</span>
                    </div>
                    <div className="mb-2">{isRisk ? (<div className="bg-red-100 p-2 rounded-xl text-red-600 animate-pulse"><AlertCircle size={20} /></div>) : (<div className="bg-emerald-100 p-2 rounded-xl text-emerald-600"><CheckCircle2 size={20} /></div>)}</div>
                  </div>
                  <div className="mt-6 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${isRisk ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min((item.stock / item.safety) * 100, 100)}%` }}></div>
                  </div>
                  {isRisk && (<p className="mt-4 text-[10px] font-black text-red-500 uppercase tracking-widest animate-pulse flex items-center gap-1"><TrendingDown size={14} /> 부족: {item.safety - item.stock}개 발주 필요</p>)}
                </div>
                
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}