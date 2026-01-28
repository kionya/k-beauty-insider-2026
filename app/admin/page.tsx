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
    // 랭킹순 정렬
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

  // ★ 값 수정 핸들러 (통합)
  const handleUpdate = async (id: number, field: string, value: any) => {
    // 화면 즉시 반영
    setProcedures(procedures.map(item => item.id === id ? { ...item, [field]: value } : item));
    
    // DB 업데이트
    await supabase.from('procedures').update({ [field]: value }).eq('id', id);
  };

  // 병원 리스트 수정 (텍스트 -> 배열 변환)
  const handleClinicUpdate = async (id: number, text: string) => {
    // 콤마로 나눠서 배열로 저장
    const clinicArray = text.split(',').map(c => c.trim());
    handleUpdate(id, 'clinics', clinicArray);
  };

  const handleDeleteProcedure = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    setProcedures(procedures.filter(p => p.id !== id));
    await supabase.from('procedures').delete().eq('id', id);
  };
  
  const handleDeleteReservation = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
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
    <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center'}}>
        <div style={{padding:'40px', border:'1px solid #ddd', borderRadius:'10px', textAlign:'center'}}>
            <h2>Admin Login</h2>
            <input type="password" onChange={(e)=>setPassword(e.target.value)} style={{display:'block', margin:'10px auto', padding:'10px'}} />
            <button onClick={handleLogin} style={{padding:'10px 20px', background:'#102A43', color:'white', border:'none'}}>Login</button>
        </div>
    </div>
  );

  return (
    <div style={{padding:'40px 5%', width:'100%', minHeight:'100vh', background:'#f8f9fa'}}>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'30px'}}>
        <h1>🔧 Admin Dashboard</h1>
        <div style={{display:'flex', gap:'10px'}}>
             <label style={{background:'#2e7d32', color:'white', padding:'10px 20px', borderRadius:'30px', cursor:'pointer'}}>
                Excel Upload <input type="file" onChange={handleFileUpload} style={{display:'none'}} />
             </label>
            <Link href="/" style={{background:'white', padding:'10px 20px', borderRadius:'30px', border:'1px solid #ddd'}}>View Site</Link>
        </div>
      </div>

      {/* 예약 관리 */}
      <section style={{marginBottom:'40px', background:'white', padding:'30px', borderRadius:'16px'}}>
        <h2>📋 Reservations</h2>
        <table style={{width:'100%', marginTop:'10px'}}>
            <tbody>
                {reservations.map((res) => (
                    <tr key={res.id} style={{borderBottom:'1px solid #eee'}}>
                        <td style={{padding:'10px'}}>{res.customer_name}</td>
                        <td style={{padding:'10px'}}>{res.contact_info} ({res.messenger_type})</td>
                        <td style={{padding:'10px', color:'#00B4D8'}}>{res.procedure_name}</td>
                        <td style={{padding:'10px'}}>
                            <select value={res.status} onChange={(e) => handleStatusChange(res.id, e.target.value)}
                                style={{padding:'5px', background: getStatusColor(res.status).bg, color: getStatusColor(res.status).text, border:'none', borderRadius:'5px'}}>
                                <option value="Pending">Pending</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </td>
                        <td><button onClick={()=>handleDeleteReservation(res.id)}>🗑️</button></td>
                    </tr>
                ))}
            </tbody>
        </table>
      </section>

      {/* 시술 관리 (랭킹 수정 가능) */}
      <section style={{background:'white', padding:'30px', borderRadius:'16px'}}>
        <h2>💰 Procedures (Rank & Price)</h2>
        <table style={{width:'100%', marginTop:'10px'}}>
            <thead>
                <tr style={{background:'#eee', textAlign:'left'}}>
                    <th style={{padding:'10px', width:'60px'}}>Rank</th>
                    <th style={{padding:'10px'}}>Name</th>
                    <th style={{padding:'10px'}}>Avg. Price</th>
                    <th style={{padding:'10px'}}>Clinics (Name:Price)</th>
                    <th style={{padding:'10px'}}>Action</th>
                </tr>
            </thead>
            <tbody>
            {procedures.map((item) => (
                <tr key={item.id} style={{borderBottom:'1px solid #eee'}}>
                    {/* 1. 랭킹 수정 */}
                    <td style={{padding:'10px'}}>
                        <input type="number" defaultValue={item.rank} 
                        onBlur={(e) => handleUpdate(item.id, 'rank', e.target.value)}
                        style={{width:'50px', padding:'5px', border:'1px solid #ddd', fontWeight:'bold'}} />
                    </td>
                    <td style={{padding:'10px'}}>{item.name}</td>
                    {/* 2. 평균 가격 수정 */}
                    <td style={{padding:'10px'}}>
                        <input type="number" defaultValue={item.price_krw} 
                        onBlur={(e) => handleUpdate(item.id, 'price_krw', e.target.value)}
                        style={{width:'100px', padding:'5px', border:'1px solid #ddd'}} />
                    </td>
                    {/* 3. 병원 리스트 수정 (텍스트 입력) */}
                    <td style={{padding:'10px'}}>
                        <input type="text" defaultValue={item.clinics?.join(', ')} 
                        onBlur={(e) => handleClinicUpdate(item.id, e.target.value)}
                        placeholder="병원A:50000, 병원B:60000"
                        style={{width:'100%', padding:'5px', border:'1px solid #ddd'}} />
                    </td>
                    <td style={{padding:'10px'}}>
                        <button onClick={() => handleDeleteProcedure(item.id)} style={{color:'red'}}>Delete</button>
                    </td>
                </tr>
            ))}
            </tbody>
        </table>
      </section>
    </div>
  );
}