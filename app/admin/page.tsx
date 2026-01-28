'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import Link from 'next/link';
import * as XLSX from 'xlsx';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  const [procedures, setProcedures] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);

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

  // 값 수정 핸들러 (자동 저장)
  const handleUpdate = async (id: number, field: string, value: any) => {
    setProcedures(procedures.map(item => item.id === id ? { ...item, [field]: value } : item));
    await supabase.from('procedures').update({ [field]: value }).eq('id', id);
  };

  // 병원 리스트 수정
  const handleClinicUpdate = async (id: number, text: string) => {
    const clinicArray = text.split(',').map(c => c.trim());
    handleUpdate(id, 'clinics', clinicArray);
  };

  // 삭제 핸들러들
  const handleDeleteProcedure = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setProcedures(procedures.filter(p => p.id !== id));
    await supabase.from('procedures').delete().eq('id', id);
  };
  
  const handleDeleteReservation = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setReservations(reservations.filter(r => r.id !== id));
    await supabase.from('reservations').delete().eq('id', id);
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    setReservations(reservations.map(res => res.id === id ? { ...res, status: newStatus } : res));
    await supabase.from('reservations').update({ status: newStatus }).eq('id', id);
  };

  const handleFileUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt: any) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws);
      if (confirm(`${data.length}개 업로드 하시겠습니까?`)) {
        const formattedData = data.map((row: any) => ({
            name: row.name,
            rank: row.rank || 99,
            price_krw: row.price_krw,
            category: row.category || 'Etc',
            description: row.description || '',
            clinics: row.clinics ? row.clinics.split(',').map((c:string) => c.trim()) : [],
            is_hot: row.is_hot === 'TRUE' || row.is_hot === true
        }));
        const { error } = await supabase.from('procedures').insert(formattedData);
        if (!error) window.location.reload();
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

  if (!isAuthenticated) return (
    <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'#f0f2f5'}}>
        <div style={{padding:'40px', background:'white', border:'1px solid #ddd', borderRadius:'10px', textAlign:'center', boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}}>
            <h2 style={{marginBottom:'20px', color:'#102A43'}}>Admin Login</h2>
            <input type="password" onChange={(e)=>setPassword(e.target.value)} style={{display:'block', margin:'10px auto', padding:'12px', width:'250px', border:'1px solid #ddd', borderRadius:'6px'}} placeholder="Password" />
            <button onClick={handleLogin} style={{padding:'12px 20px', width:'250px', background:'#102A43', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}}>Login</button>
        </div>
    </div>
  );

  return (
    <div style={{padding:'40px 5%', width:'100%', minHeight:'100vh', background:'#f8f9fa'}}>
      
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
        <div>
            <h1 style={{color:'#102A43', marginBottom:'5px'}}>🔧 Admin Dashboard</h1>
            <p style={{color:'#666', fontSize:'0.9rem'}}>Real-time Database Management</p>
        </div>
        <div style={{display:'flex', gap:'10px'}}>
             {/* 엑셀 업로드 버튼 (디자인 복구) */}
             <label style={{
                background:'#2e7d32', color:'white', padding:'10px 20px', 
                borderRadius:'30px', fontWeight:'bold', cursor:'pointer', 
                display:'flex', alignItems:'center', gap:'5px', boxShadow:'0 2px 5px rgba(0,0,0,0.1)'
             }}>
                <i className="fa-solid fa-file-excel"></i> Excel Upload
                <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} style={{display:'none'}} />
             </label>

            <Link href="/" style={{textDecoration:'none', background:'white', padding:'10px 20px', borderRadius:'30px', border:'1px solid #ddd', fontWeight:'bold', color:'#102A43', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
                View Live Site <i className="fa-solid fa-arrow-up-right-from-square" style={{marginLeft:'5px'}}></i>
            </Link>
        </div>
      </div>

      {/* 예약 현황 섹션 */}
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
                        <th style={{padding:'15px', textAlign:'left'}}>Status</th>
                        <th style={{padding:'15px', textAlign:'left', borderRadius:'0 8px 8px 0'}}>Action</th>
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
                                {/* 예약 삭제 버튼 (디자인 복구) */}
                                <td style={{padding:'15px'}}>
                                    <button onClick={() => handleDeleteReservation(res.id)} style={{background:'none', border:'none', cursor:'pointer', color:'#aaa', fontSize:'1.1rem', transition:'color 0.2s'}}>
                                        <i className="fa-solid fa-trash-can"></i>
                                    </button>
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
                <th style={{padding:'15px', textAlign:'left'}}>Avg. Price (KRW)</th>
                <th style={{padding:'15px', textAlign:'left'}}>Clinics (Name:Price)</th>
                <th style={{padding:'15px', textAlign:'left', borderRadius:'0 8px 8px 0'}}>Action</th>
            </tr>
            </thead>
            <tbody>
            {procedures.map((item) => (
                <tr key={item.id} style={{borderBottom:'1px solid #f1f3f5'}}>
                    {/* 1. 랭킹 수정 */}
                    <td style={{padding:'15px'}}>
                        <input type="number" defaultValue={item.rank} 
                        onBlur={(e) => handleUpdate(item.id, 'rank', e.target.value)}
                        style={{width:'50px', padding:'8px', border:'1px solid #ddd', borderRadius:'6px', fontWeight:'bold', textAlign:'center'}} />
                    </td>
                    <td style={{padding:'15px', fontWeight:'bold', fontSize:'1rem', color:'#102A43'}}>{item.name}</td>
                    {/* 2. 평균 가격 수정 */}
                    <td style={{padding:'15px'}}>
                        <div style={{display:'flex', alignItems:'center'}}>
                            <span style={{marginRight:'5px', color:'#666'}}>₩</span>
                            <input type="number" defaultValue={item.price_krw} 
                            onBlur={(e) => handleUpdate(item.id, 'price_krw', e.target.value)}
                            style={{width:'100px', padding:'8px', border:'1px solid #ddd', borderRadius:'6px'}} />
                        </div>
                    </td>
                    {/* 3. 병원 리스트 수정 */}
                    <td style={{padding:'15px'}}>
                        <input type="text" defaultValue={item.clinics?.join(', ')} 
                        onBlur={(e) => handleClinicUpdate(item.id, e.target.value)}
                        placeholder="Ex: ClinicA:50000, ClinicB:60000"
                        style={{width:'100%', padding:'8px', border:'1px solid #ddd', borderRadius:'6px', fontSize:'0.9rem'}} />
                    </td>
                    {/* 4. 삭제 버튼 (디자인 복구) */}
                    <td style={{padding:'15px'}}>
                        <button 
                            onClick={() => handleDeleteProcedure(item.id)}
                            style={{
                                background:'#ffebed', color:'#d32f2f', border:'none', 
                                padding:'8px 12px', borderRadius:'8px', cursor:'pointer', fontWeight:'bold',
                                display:'flex', alignItems:'center', gap:'5px', fontSize:'0.85rem'
                            }}
                        >
                            <i className="fa-solid fa-trash"></i> Delete
                        </button>
                    </td>
                </tr>
            ))}
            </tbody>
        </table>
      </section>
    </div>
  );
}