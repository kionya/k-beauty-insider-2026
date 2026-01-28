'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import Link from 'next/link';
import * as XLSX from 'xlsx'; // 엑셀 라이브러리 추가

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  const [procedures, setProcedures] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);

  // 데이터 로드
  const fetchAllData = async () => {
    const { data: procData } = await supabase.from('procedures').select('*').order('rank', { ascending: true });
    if (procData) setProcedures(procData);

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

  const handleStatusChange = async (id: number, newStatus: string) => {
    setReservations(reservations.map(res => res.id === id ? { ...res, status: newStatus } : res));
    await supabase.from('reservations').update({ status: newStatus }).eq('id', id);
  };

  // ★ 엑셀 업로드 핸들러 (NEW)
  const handleFileUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt: any) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      if (confirm(`${data.length}개의 시술 데이터를 DB에 추가하시겠습니까?`)) {
        // 데이터 변환 (엑셀 -> DB 포맷)
        const formattedData = data.map((row: any) => ({
            name: row.name,
            rank: row.rank || 99,
            price_krw: row.price_krw,
            category: row.category || 'Etc',
            description: row.description || '',
            // 엑셀에서는 콤마로 구분 (예: 병원A, 병원B) -> 배열로 변환
            clinics: row.clinics ? row.clinics.split(',').map((c:string) => c.trim()) : [],
            is_hot: row.is_hot === 'TRUE' || row.is_hot === true
        }));

        const { error } = await supabase.from('procedures').insert(formattedData);

        if (error) {
            alert("업로드 실패! 엑셀 형식을 확인해주세요.");
            console.error(error);
        } else {
            alert("업로드 성공! 새로고침합니다.");
            window.location.reload();
        }
      }
    };
    reader.readAsBinaryString(file);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return { bg: '#fff3e0', text: '#e65100' };
      case 'Confirmed': return { bg: '#e8f5e9', text: '#2e7d32' };
      case 'Completed': return { bg: '#e3f2fd', text: '#1565c0' };
      case 'Cancelled': return { bg: '#f5f5f5', text: '#757575' };
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
        <div style={{display:'flex', gap:'10px'}}>
             {/* 엑셀 업로드 버튼 디자인 */}
             <label style={{
                background:'#2e7d32', color:'white', padding:'10px 20px', 
                borderRadius:'30px', fontWeight:'bold', cursor:'pointer', 
                display:'flex', alignItems:'center', gap:'5px'
             }}>
                <i className="fa-solid fa-file-excel"></i> Excel Upload
                <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} style={{display:'none'}} />
             </label>

            <Link href="/" style={{textDecoration:'none', background:'white', padding:'10px 20px', borderRadius:'30px', border:'1px solid #ddd', fontWeight:'bold', color:'#102A43', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
                View Live Site <i className="fa-solid fa-arrow-up-right-from-square" style={{marginLeft:'5px'}}></i>
            </Link>
        </div>
      </div>

      {/* 예약 현황 섹션 (이전과 동일) */}
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
                    {reservations.map((res) => {
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
                                    <select
                                        value={res.status}
                                        onChange={(e) => handleStatusChange(res.id, e.target.value)}
                                        style={{
                                            padding: '8px 12px', borderRadius: '20px', border: 'none',
                                            background: colors.bg, color: colors.text,
                                            fontWeight: 'bold', cursor: 'pointer', outline: 'none'
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
                    })}
                </tbody>
            </table>
        </div>
      </section>

      {/* 시술 관리 섹션 */}
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