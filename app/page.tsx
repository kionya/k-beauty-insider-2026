'use client';

import { useState } from 'react';
import { initialProcedures } from './data'; // 데이터 가져오기

export default function Home() {
  const [currency, setCurrency] = useState<'KRW' | 'USD'>('KRW');
  const [procedures] = useState(initialProcedures); // 데이터 로드
  const [activeTab, setActiveTab] = useState('All Rewards');
  const [showMoreBenefits, setShowMoreBenefits] = useState(false);

  // 환율 상수
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

  // 랭킹 1~4위만 슬라이더에 표시
  const trendingProcedures = procedures.filter(p => p.rank <= 4).sort((a, b) => a.rank - b.rank);

  return (
    <>
      <header>
        <div className="container nav-wrapper">
          <div className="logo">K-Beauty <span>Insider</span></div>
          <nav className="nav-menu">
            <a href="#prices">Prices</a>
            <a href="#ranking">Trends</a>
            <a href="/admin" style={{ color: 'red', fontWeight: 'bold' }}>Admin</a> {/* 관리자 링크 살짝 추가 */}
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

      {/* 1. Loyalty */}
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

      {/* 2. Trending (Dynamic from Data) */}
      <section id="ranking" className="ranking-section">
        <div className="container">
          <h2 className="section-title">Trending This Month</h2>
          <div className="slider-container">
            <button className="slider-btn prev" onClick={() => scrollSlider(-1)}><i className="fa-solid fa-chevron-left"></i></button>
            
            <div className="slider-track" id="trendSlider">
              {trendingProcedures.map((proc) => (
                <article className="procedure-card" key={proc.id}>
                  <div className="card-header">
                    <h3>{proc.name} {proc.isHot && <span className="badge badge-hot">HOT</span>}</h3>
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
                    <span>{getPrice(proc.priceKrw)} ~</span>
                  </div>
                </article>
              ))}
            </div>
            
            <button className="slider-btn next" onClick={() => scrollSlider(1)}><i className="fa-solid fa-chevron-right"></i></button>
          </div>
        </div>
      </section>

      {/* 3. Price List (Dynamic from Data) */}
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
                    <td>{getPrice(proc.priceKrw)}</td>
                    <td>
                      <div className="clinic-list">
                        {proc.clinics.map((clinic, idx) => (
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
      
      {/* 4. Benefit Lounge (Static for now to save space) */}
       <section id="benefit-lounge" className="benefit-section">
        <div className="container">
            <h2 className="section-title">Benefit Lounge</h2>
            <p style={{textAlign:'center', color:'#666', marginBottom:'30px'}}>Complete 10 stamps to unlock.</p>
             <div className="benefit-grid">
                {/* Sample Static Reward */}
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