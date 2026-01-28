'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import Link from 'next/link';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  const [procedures, setProcedures] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);

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

  // ★ 예약 상태 변경 함수 (추가됨)
  const handleStatusChange = async (id: number, newStatus: string) => {
    // 1. 화면 즉시 반영 (빠른 반응 속도)
    setReservations(reservations.map(res => 
      res.id === id ? { ...res, status: newStatus } : res
    ));

    // 2. 실제 DB 업데이트
    const { error } = await supabase
      .from('reservations')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      alert("상태 변경 실패!");
      console.error(error);
    }
  };

  // 상태별 뱃지 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return { bg: '#fff3e0', text: '#e65100' }; // 주황 (대기)
      case 'Confirmed': return { bg: '#e8f5e9', text: '#2e7d32' }; // 초록 (확정)
      case 'Completed': return { bg: '#e3f2fd', text: '#1565c0' }; // 파랑 (완료)
      case 'Cancelled': return { bg: '#f5f5f5', text: '#757575' }; // 회색 (취소)
      default: return { bg: '#eee', text: '#333' };
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'#f0f2f5'}}>
        <div style={{padding:'40px', background:'white', border:'1px solid #ddd', borderRadius:'10px', textAlign:'center', boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}}>
          <h2 style={{marginBottom:'20px', color:'#102A43'}}>Admin Login</h2>
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password" style={{display:'block', margin:'10px auto', padding:'12px', width:'250px', border:'1px solid #ddd', borderRadius:'6px'}} />
          <button onClick={handleLogin} style={{padding:'12px 20px', width:'250px', background:'#102A43', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}}>Login</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{padding:'40px 5%', width:'100%', minHeight:'100vh', background:'#f8f9fa'}}>
      
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
        <div>
            <h1 style={{color:'#102A43', marginBottom:'5px'}}>🔧 Admin Dashboard</h1>
            <p style={{color:'#666', fontSize:'0.9rem'}}>Real-time Database Management</p>
        </div>
        <Link href="/" style={{textDecoration:'none', background:'white', padding:'10px 20px', borderRadius:'30px', border:'1px solid #ddd', fontWeight:'bold', color:'#102A43', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
            View Live Site <i className="fa-solid fa-arrow-up-right-from-square" style={{marginLeft:'5px'}}></i>
        </Link>
      </div>

      {/* --- 섹션 1: 예약 접수 현황 (업데이트됨) --- */}
      <section style={{marginBottom:'40px', background:'white', padding:'30px', borderRadius:'16px', boxShadow:'0 2px 10px rgba(0,0,0,0.03)'}}>
        <h2 style={{borderBottom:'2px solid #00B4D8', display:'inline-block', marginBottom:'20px', color:'#102A43'}}>📋 Reservation Management</h2>
        
        <div style={{width:'100%'}}>
            <table style={{width:'100%', borderCollapse:'collapse'}}>
                <thead>
                    <tr style={{background:'#F0F4F8', color:'#486581'}}>
                        <th style={{padding:'15px', textAlign:'left', borderRadius:'8px 0 0 8px'}}>Date</th>
                        <th style={{padding:'15px', textAlign:'left'}}>Customer</th>
                        <th style={{padding:'15px', textAlign:'left'}}>Contact Info</th>
                        <th style={{padding:'15px', textAlign:'left'}}>Target Procedure</th>
                        <th style={{padding:'15px', textAlign:'left', borderRadius:'0 8px 8px 0'}}>Status (Action)</th>
                    </tr>
                </thead>
                <tbody>
                    {reservations.length === 0 ? (
                        <tr><td colSpan={5} style={{padding:'30px', textAlign:'center', color:'#888'}}>아직 접수된 예약이 없습니다.</td></tr>
                    ) : (
                        reservations.map((res) => {
                            const colors = getStatusColor(res.status);
                            return (
                                <tr key={res.id} style={{borderBottom:'1px solid #f1f3f5'}}>
                                    <td style={{padding:'15px', fontSize:'0.9rem', color:'#666'}}>{new Date(res.created_at).toLocaleDateString()}</td>
                                    <td style={{padding:'15px', fontWeight:'bold', fontSize:'1rem'}}>{res.customer_name}</td>
                                    <td style={{padding:'15px'}}>
                                        <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                            <span style={{fontSize:'0.75rem', background:'#e3f2fd', color:'#1565c0', padding:'3px 8px', borderRadius:'4px', fontWeight:'bold'}}>{res.messenger_type}</span>
                                            <span style={{fontSize:'1rem'}}>{res.contact_info}</span>
                                        </div>
                                    </td>
                                    <td style={{padding:'15px', color:'#00B4D8', fontWeight:'600'}}>{res.procedure_name}</td>
                                    <td style={{padding:'15px'}}>
                                        {/* ▼ 상태 변경 드롭다운 ▼ */}
                                        <select
                                            value={res.status}
                                            onChange={(e) => handleStatusChange(res.id, e.target.value)}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '20px',
                                                border: 'none',
                                                background: colors.bg,
                                                color: colors.text,
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                outline: 'none',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            <option value="Pending">🟠 Pending</option>
                                            <option value="Confirmed">🟢 Confirmed</option>
                                            <option value="Completed">🔵 Completed</option>
                                            <option value="Cancelled">⚪ Cancelled</option>
                                        </select>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
      </section>

      {/* --- 섹션 2: 가격 및 순위 관리 --- */}
      <section style={{background:'white', padding:'30px', borderRadius:'16px', boxShadow:'0 2px 10px rgba(0,0,0,0.03)'}}>
        <h2 style={{borderBottom:'2px solid #102A43', display:'inline-block', marginBottom:'20px', color:'#102A43'}}>💰 Price & Ranking Management</h2>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead>
            <tr style={{background:'#F0F4F8', color:'#486581'}}>
                <th style={{padding:'15px', textAlign:'left', width:'80px', borderRadius:'8px 0 0 8px'}}>Rank</th>
                <th style={{padding:'15px', textAlign:'left'}}>Procedure Name</th>
                <th style={{padding:'15px', textAlign:'left', borderRadius:'0 8px 8px 0'}}>Price (KRW)</th>
            </tr>
            </thead>
            <tbody>
            {procedures.map((item) => (
                <tr key={item.id} style={{borderBottom:'1px solid #f1f3f5'}}>
                <td style={{padding:'15px', fontWeight:'bold', color:'#102A43'}}>{item.rank}</td>
                <td style={{padding:'15px', fontSize:'1rem'}}>{item.name}</td>
                <td style={{padding:'15px'}}>
                    <div style={{display:'flex', alignItems:'center'}}>
                        <span style={{marginRight:'5px', color:'#666'}}>₩</span>
                        <input 
                        type="number" 
                        defaultValue={item.price_krw}
                        onBlur={(e) => handleSavePrice(item.id, e.target.value)}
                        style={{padding:'8px', width:'120px', border:'1px solid #ddd', borderRadius:'6px', fontSize:'1rem'}}
                        />
                    </div>
                </td>
                </tr>
            ))}
            </tbody>
        </table>
      </section>
    </div>
  );
}