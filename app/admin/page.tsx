'use client';

import { useState } from 'react';
import { initialProcedures, Procedure } from '../data';
import Link from 'next/link';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [data, setData] = useState<Procedure[]>(initialProcedures);
  const [editingId, setEditingId] = useState<number | null>(null);

  // 1. 로그인 체크 (간단한 비번: 1234)
  const handleLogin = () => {
    if (password === '1234') {
      setIsAuthenticated(true);
    } else {
      alert('Wrong Password!');
    }
  };

  // 2. 가격 저장 핸들러
  const handleSavePrice = (id: number, newPrice: string) => {
    const priceNumber = parseInt(newPrice);
    if (isNaN(priceNumber)) return;

    setData(data.map(item => 
      item.id === id ? { ...item, priceKrw: priceNumber } : item
    ));
    setEditingId(null); // 편집 모드 종료
  };

  // 3. 순위 변경 핸들러 (위로 올리기)
  const moveRankUp = (index: number) => {
    if (index === 0) return;
    const newData = [...data];
    // 순서 Swap
    [newData[index - 1], newData[index]] = [newData[index], newData[index - 1]];
    // Rank 번호도 재할당
    newData[index].rank = index + 1;
    newData[index - 1].rank = index;
    setData(newData);
  };

  // --- 로그인 전 화면 ---
  if (!isAuthenticated) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginBox}>
          <h2 style={{marginBottom: '20px'}}>Admin Access</h2>
          <input 
            type="password" 
            placeholder="Enter Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
          <button onClick={handleLogin} style={styles.button}>Login</button>
          <Link href="/" style={{display:'block', marginTop:'15px', color:'#666'}}>Go Home</Link>
        </div>
      </div>
    );
  }

  // --- 로그인 후 관리자 대시보드 ---
  return (
    <div style={styles.dashboard}>
      <header style={styles.header}>
        <h1>🔧 K-Beauty Admin</h1>
        <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
            <span style={{fontSize:'0.9rem', color:'#666'}}>Welcome, Boss!</span>
            <Link href="/" style={styles.linkBtn}>View Site</Link>
        </div>
      </header>

      <div style={styles.container}>
        <h2 style={{marginBottom: '20px'}}>Manage Prices & Rankings</h2>
        
        <table style={styles.table}>
          <thead>
            <tr style={{background: '#f1f3f5', textAlign: 'left'}}>
              <th style={{padding:'10px'}}>Rank</th>
              <th style={{padding:'10px'}}>Procedure Name</th>
              <th style={{padding:'10px'}}>Price (KRW)</th>
              <th style={{padding:'10px'}}>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={item.id} style={{borderBottom: '1px solid #eee'}}>
                <td style={{padding:'10px'}}>
                    <button onClick={() => moveRankUp(index)} disabled={index === 0}>▲</button>
                    <span style={{marginLeft:'10px'}}>{index + 1}</span>
                </td>
                <td style={{padding:'10px', fontWeight:'bold'}}>{item.name}</td>
                <td style={{padding:'10px'}}>
                  {editingId === item.id ? (
                    <input 
                      type="number" 
                      defaultValue={item.priceKrw}
                      onBlur={(e) => handleSavePrice(item.id, e.target.value)}
                      autoFocus
                      style={{padding: '5px'}}
                    />
                  ) : (
                    <span 
                        onClick={() => setEditingId(item.id)} 
                        style={{cursor: 'pointer', borderBottom: '1px dashed #ccc'}}
                        title="Click to Edit"
                    >
                      ₩{item.priceKrw.toLocaleString()} ✏️
                    </span>
                  )}
                </td>
                <td style={{padding:'10px'}}>
                    <button style={styles.deleteBtn}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div style={{marginTop: '30px', padding: '20px', background: '#e3f2fd', borderRadius: '8px'}}>
            <p><strong>💡 Note:</strong> 현재는 '데모 모드'이므로 새로고침하면 데이터가 초기화됩니다.</p>
            <p>데이터를 영구 저장하려면 데이터베이스(Supabase/Firebase) 연결이 필요합니다.</p>
        </div>
      </div>
    </div>
  );
}

// 간단한 인라인 스타일 (CSS 파일 대신 사용)
const styles: { [key: string]: React.CSSProperties } = {
  loginContainer: {
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#f8f9fa',
  },
  loginBox: {
    background: 'white',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    textAlign: 'center',
    width: '350px',
  },
  input: {
    width: '100%',
    padding: '12px',
    marginBottom: '15px',
    borderRadius: '8px',
    border: '1px solid #ddd',
  },
  button: {
    width: '100%',
    padding: '12px',
    background: '#102A43',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  dashboard: {
    minHeight: '100vh',
    background: '#fff',
    color: '#333',
  },
  header: {
    padding: '20px 40px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  container: {
    maxWidth: '1000px',
    margin: '40px auto',
    padding: '0 20px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    border: '1px solid #eee',
  },
  linkBtn: {
      padding: '8px 16px',
      border: '1px solid #ddd',
      borderRadius: '20px',
      fontSize: '0.85rem',
      textDecoration: 'none',
      color: '#333'
  },
  deleteBtn: {
      background: '#ffebed',
      color: '#d6336c',
      border: 'none',
      padding: '5px 10px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.8rem'
  }
};