'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import Link from 'next/link';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [data, setData] = useState<any[]>([]);

  // 1. 초기 데이터 로드
  const fetchProcedures = async () => {
    const { data, error } = await supabase.from('procedures').select('*').order('rank', { ascending: true });
    if (data) setData(data);
  };

  useEffect(() => {
    if (isAuthenticated) fetchProcedures();
  }, [isAuthenticated]);

  const handleLogin = () => {
    if (password === '1234') setIsAuthenticated(true);
    else alert('Wrong Password!');
  };

  // 2. 가격 수정 및 '진짜 DB' 저장
  const handleSavePrice = async (id: number, newPrice: string) => {
    const priceNumber = parseInt(newPrice);
    if (isNaN(priceNumber)) return;

    // 화면 업데이트 (반응속도 향상)
    setData(data.map(item => item.id === id ? { ...item, price_krw: priceNumber } : item));

    // DB 업데이트
    await supabase.from('procedures').update({ price_krw: priceNumber }).eq('id', id);
    alert('가격이 저장되었습니다!');
  };

  if (!isAuthenticated) {
    return (
      <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center'}}>
        <div style={{padding:'40px', border:'1px solid #ddd', borderRadius:'10px'}}>
          <h2>Admin Login</h2>
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password" style={{display:'block', margin:'10px 0', padding:'10px', width:'100%'}} />
          <button onClick={handleLogin} style={{padding:'10px 20px', width:'100%', background:'#102A43', color:'white', border:'none'}}>Login</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{padding:'40px', maxWidth:'1000px', margin:'0 auto'}}>
      <h1>🔧 DB Management</h1>
      <Link href="/" style={{marginBottom:'20px', display:'inline-block'}}>← Back to Home</Link>
      
      <table style={{width:'100%', borderCollapse:'collapse', marginTop:'20px'}}>
        <thead>
          <tr style={{background:'#eee', textAlign:'left'}}>
            <th style={{padding:'10px'}}>Rank</th>
            <th style={{padding:'10px'}}>Name</th>
            <th style={{padding:'10px'}}>Price (KRW)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id} style={{borderBottom:'1px solid #eee'}}>
              <td style={{padding:'10px'}}>{item.rank}</td>
              <td style={{padding:'10px'}}>{item.name}</td>
              <td style={{padding:'10px'}}>
                <input 
                  type="number" 
                  defaultValue={item.price_krw}
                  onBlur={(e) => handleSavePrice(item.id, e.target.value)}
                  style={{padding:'5px'}}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{marginTop:'20px', color:'green'}}>* 가격을 수정하고 입력창 밖을 클릭하면 DB에 자동 저장됩니다.</p>
    </div>
  );
}