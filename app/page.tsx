'use client';

import { useState, useEffect } from 'react';
import { supabase } from './supabase'; // 진짜 DB 도구 가져오기
import Link from 'next/link';

// 데이터 타입 정의
type Procedure = {
  id: number;
  name: string;
  rank: number;
  price_krw: number; // DB 컬럼명에 맞춤 (snake_case)
  description: string;
  category: string;
  clinics: string[];
  is_hot: boolean;
};

export default function Home() {
  const [currency, setCurrency] = useState<'KRW' | 'USD'>('KRW');
  const [procedures, setProcedures] = useState<Procedure[]>([]); // 빈 배열로 시작
  const [loading, setLoading] = useState(true);
  
  // 모바일 더보기 상태
  const [activeTab, setActiveTab] = useState('All Rewards');
  const [showMoreBenefits, setShowMoreBenefits] = useState(false);

  // ★ 진짜 DB에서 데이터 가져오기!
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('procedures')
        .select('*')
        .order('rank', { ascending: true }); // 순위대로 정렬

      if (error) console.error('Error:', error);
      else setProcedures(data || []);
      
      setLoading(false);
    };

    fetchData();
  }, []);

  const EXCHANGE_RATE = 1400;

  const getPrice = (krwPrice: number) => {
    if (currency === 'KRW') return `₩${krwPrice.toLocaleString()}`;
    const usdPrice = Math.round(krwPrice / EXCHANGE_RATE);
    return `$${usdPrice}`;
  };

  const scrollSlider = (direction: number) => {
    const slider = document.getElementById('trendSlider');
    if (slider) {
      slider.scrollBy({ left: direction * 340, behavior: 'smooth' });
    }
  };

  const openYeayakSsok = (procedure: string) => {
    if (confirm(`Booking '${procedure}' with 1 Free Coupon?`)) {
      alert("Redirecting to booking system...");
    }
  };

  if (loading) return <div style={{padding:'50px', textAlign:'center'}}>Loading Prices...</div>;

  // 1~4위 랭킹 데이터 필터링
  const trendingProcedures = procedures.filter(p => p.rank <= 4);

  return (
    <>
      <header>
        <div className="container nav-wrapper">
          <div className="logo">K-Beauty <span>Insider</span></div>
          <nav className="nav-menu">
            <a href="#prices">Prices</a>
            <a href="#ranking">Trends</a>
            <a href="/admin" style={{ color: 'red', fontWeight: 'bold' }}>Admin</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <h1>Compare Prices. Earn Rewards.</h1>
          <p>Gangnam's real price database.</p>
          <div className="search-box">
            <input type="text" placeholder="Search procedure..." />
            <button>Check Price</button>
          </div>
        </div>
      </section>

      {/* Loyalty (Static) */}
      <section id="loyalty" className="loyalty-section">
        <div className="container">
          <div className="stamp-card">
            <div className="stamp-header">
              <h3><i className="fa-solid fa-star"></i> My Beauty Stamp Card</h3>
              <p><strong>7 / 10</strong> collected.</p>
            </div>
            <div className="stamp-grid">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="stamp-circle filled"><i className="fa-solid fa-check"></i></div>
              ))}
              <div className="stamp-circle">8</div>
              <div className="stamp-circle">9</div>
              <div className="stamp-circle final"><i className="fa-solid fa-gift"></i></div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Trending Slider (Link 추가된 버전) */}
      <section id="ranking" className="ranking-section">
        <div className="container">
          <h2 className="section-title">Trending This Month</h2>
          <div className="slider-container">
            <button className="slider-btn prev" onClick={() => scrollSlider(-1)}><i className="fa-solid fa-chevron-left"></i></button>
            
            <div className="slider-track" id="trendSlider">
              {trendingProcedures.map((proc) => (
                /* ▼▼▼ 여기서부터 Link 태그가 감싸도록 수정됨 ▼▼▼ */
                <Link href={`/procedures/${proc.id}`} key={proc.id} style={{textDecoration:'none'}}>
                    <article className="procedure-card" style={{height:'100%', cursor:'pointer'}}>
                      <div className="card-header">
                        <h3>{proc.name} {proc.is_hot && <span className="badge badge-hot">HOT</span>}</h3>
                        <div className="rank-badge">{proc.rank}</div>
                      </div>
                      <div className="context-table">
                        <div className="context-row">
                          <div className="context-label">DESC</div>
                          <div className="context-text">{proc.description}</div>
                        </div>
                      </div>
                      <div className="card-footer">
                        <span>Avg. Price</span>
                        <span>{getPrice(proc.price_krw)} ~</span>
                      </div>
                    </article>
                </Link>
                /* ▲▲▲ 여기까지 ▲▲▲ */
              ))}
            </div>
            
            <button className="slider-btn next" onClick={() => scrollSlider(1)}><i className="fa-solid fa-chevron-right"></i></button>
          </div>
        </div>
      </section>

      {/* Price List */}
      <section id="prices" className="comparison-section">
        <div className="container">
          <h2 className="section-title">Gangnam Price List</h2>
          <div className="table-controls">
            <div className="toggle-group">
              <button className={`toggle-btn ${currency === 'KRW' ? 'active' : ''}`} onClick={() => setCurrency('KRW')}>KRW</button>
              <button className={`toggle-btn ${currency === 'USD' ? 'active' : ''}`} onClick={() => setCurrency('USD')}>USD</button>
            </div>
          </div>
          <div className="price-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Procedure</th>
                  <th>Price {currency === 'KRW' ? '(KRW)' : '($)'}</th>
                  <th>Clinics</th>
                </tr>
              </thead>
              <tbody>
                {procedures.map((proc) => (
                  <tr key={proc.id}>
                    <td>{proc.rank === 99 ? '-' : proc.rank}</td>
                    <td><strong>{proc.name}</strong></td>
                    <td>{getPrice(proc.price_krw)}</td>
                    <td>
                      <div className="clinic-list">
                        {(proc.clinics || []).map((clinic, idx) => (
                          <div key={idx} className="clinic-item">
                            <i className="fa-solid fa-hospital clinic-icon"></i> {clinic}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Benefit Lounge (Static) */}
      <section id="benefit-lounge" className="benefit-section">
        <div className="container">
            <h2 className="section-title">Benefit Lounge</h2>
             <div className="benefit-grid">
                <article className="benefit-card">
                    <div className="benefit-header">
                        <span>Free Reward</span>
                        <span className="coupon-val">₩390,000</span>
                    </div>
                    <div className="benefit-body">
                        <h3>Titanium Lifting</h3>
                        <button className="book-btn" onClick={() => openYeayakSsok('Titanium')}>Redeem</button>
                    </div>
                </article>
             </div>
        </div>
       </section>
      
      <footer>
        <div className="container">
          <p className="disclaimer">&copy; 2025 K-Beauty Insider. Admin Access Only.</p>
        </div>
      </footer>
    </>
  );
}