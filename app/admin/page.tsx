'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import Link from 'next/link';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  const [procedures, setProcedures] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]); // 예약 목록 상태

  // 데이터 로드
  const fetchAllData = async () => {
    // 1. 시술 가격 정보
    const { data: procData } = await supabase.from('procedures').select('*').order('rank', { ascending: true });
    if (procData) setProcedures(procData);

    // 2. 예약 신청 내역 (최신순)
    const { data: resData } = await supabase.from('reservations').select('*').order('created_at', { ascending: false });
    if (resData) setReservations(resData);
  };

  useEffect(() => {
    if (isAuthenticated) fetchAllData();
  }, [isAuthenticated]);

  const handleLogin = () => {
    if (password === '1234') setIsAuthenticated(true);
    else alert('Wrong Password!');
  };

  const handleSavePrice = async (id: number, newPrice: string) => {
    const priceNumber = parseInt(newPrice);
    if (isNaN(priceNumber)) return;
    setProcedures(procedures.map(item => item.id === id ? { ...item, price_krw: priceNumber } : item));
    await supabase.from('procedures').update({ price_krw: priceNumber }).eq('id', id);
  };

  if (!isAuthenticated) {
    return (
      <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center'}}>
        <div style={{padding:'40px', border:'1px solid #ddd', borderRadius:'10px', textAlign:'center'}}>
          <h2>Admin Login</h2>
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password" style={{display:'block', margin:'10px 0', padding:'10px', width:'200px'}} />
          <button onClick={handleLogin} style={{padding:'10px 20px', width:'100%', background:'#102A43', color:'white', border:'none', cursor:'pointer'}}>Login</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{padding:'40px', maxWidth:'1000px', margin:'0 auto'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
        <h1>🔧 Admin Dashboard</h1>
        <Link href="/" style={{textDecoration:'none', background:'#eee', padding:'8px 15px', borderRadius:'20px'}}>Go Home</Link>
      </div>

      {/* --- 섹션 1: 예약 접수 현황 (NEW) --- */}
      <section style={{marginBottom:'60px'}}>
        <h2 style={{borderBottom:'2px solid #00B4D8', display:'inline-block', marginBottom:'20px'}}>📋 New Leads (Reservations)</h2>
        <div style={{overflowX:'auto', border:'1px solid #eee', borderRadius:'10px'}}>
            <table style={{width:'100%', borderCollapse:'collapse'}}>
                <thead>
                    <tr style={{background:'#F0F4F8'}}>
                        <th style={{padding:'12px', textAlign:'left'}}>Date</th>
                        <th style={{padding:'12px', textAlign:'left'}}>Customer</th>
                        <th style={{padding:'12px', textAlign:'left'}}>Contact</th>
                        <th style={{padding:'12px', textAlign:'left'}}>Target Procedure</th>
                        <th style={{padding:'12px', textAlign:'left'}}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {reservations.length === 0 ? (
                        <tr><td colSpan={5} style={{padding:'20px', textAlign:'center'}}>아직 접수된 예약이 없습니다.</td></tr>
                    ) : (
                        reservations.map((res) => (
                            <tr key={res.id} style={{borderBottom:'1px solid #eee'}}>
                                <td style={{padding:'12px', fontSize:'0.9rem'}}>{new Date(res.created_at).toLocaleDateString()}</td>
                                <td style={{padding:'12px', fontWeight:'bold'}}>{res.customer_name}</td>
                                <td style={{padding:'12px'}}>
                                    <span style={{fontSize:'0.8rem', background:'#eee', padding:'2px 6px', borderRadius:'4px', marginRight:'5px'}}>{res.messenger_type}</span>
                                    {res.contact_info}
                                </td>
                                <td style={{padding:'12px', color:'#00B4D8'}}>{res.procedure_name}</td>
                                <td style={{padding:'12px'}}>
                                    <span style={{color: res.status === 'Pending' ? 'red' : 'green', fontWeight:'bold'}}>{res.status}</span>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </section>

      {/* --- 섹션 2: 가격 및 순위 관리 --- */}
      <section>
        <h2 style={{borderBottom:'2px solid #102A43', display:'inline-block', marginBottom:'20px'}}>💰 Price & Ranking Management</h2>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead>
            <tr style={{background:'#eee', textAlign:'left'}}>
                <th style={{padding:'10px'}}>Rank</th>
                <th style={{padding:'10px'}}>Name</th>
                <th style={{padding:'10px'}}>Price (KRW)</th>
            </tr>
            </thead>
            <tbody>
            {procedures.map((item) => (
                <tr key={item.id} style={{borderBottom:'1px solid #eee'}}>
                <td style={{padding:'10px'}}>{item.rank}</td>
                <td style={{padding:'10px'}}>{item.name}</td>
                <td style={{padding:'10px'}}>
                    <input 
                    type="number" 
                    defaultValue={item.price_krw}
                    onBlur={(e) => handleSavePrice(item.id, e.target.value)}
                    style={{padding:'5px', width:'100px'}}
                    />
                </td>
                </tr>
            ))}
            </tbody>
        </table>
      </section>
    </div>
  );
}