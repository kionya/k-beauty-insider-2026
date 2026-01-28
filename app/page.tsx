'use client';

import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Link from 'next/link';

type Procedure = {
  id: number;
  name: string;
  rank: number;
  price_krw: number;
  description: string;
  category: string;
  clinics: string[];
  is_hot: boolean;
};

export default function Home() {
  const [currency, setCurrency] = useState<'KRW' | 'USD'>('KRW');
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('procedures').select('*').order('rank', { ascending: true });
      if (data) setProcedures(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const EXCHANGE_RATE = 1400;
  const getPrice = (krwPrice: number) => currency === 'KRW' ? `₩${krwPrice.toLocaleString()}` : `$${Math.round(krwPrice / EXCHANGE_RATE)}`;

  const scrollSlider = (direction: number) => {
    const slider = document.getElementById('trendSlider');
    if (slider) slider.scrollBy({ left: direction * 340, behavior: 'smooth' });
  };

  if (loading) return <div style={{padding:'50px', textAlign:'center'}}>Loading...</div>;
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

      <section className="hero">
        <div className="container">
          <h1>Compare Prices. Earn Rewards.</h1>
          <p>Gangnam's real price database.</p>
        </div>
      </section>

      {/* Trending Slider */}
      <section id="ranking" className="ranking-section">
        <div className="container">
          <h2 className="section-title">Trending This Month</h2>
          <div className="slider-container">
            <button className="slider-btn prev" onClick={() => scrollSlider(-1)}><i className="fa-solid fa-chevron-left"></i></button>
            <div className="slider-track" id="trendSlider">
              {trendingProcedures.map((proc) => (
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
            <button className={`toggle-btn ${currency === 'KRW' ? 'active' : ''}`} onClick={() => setCurrency('KRW')}>KRW</button>
            <button className={`toggle-btn ${currency === 'USD' ? 'active' : ''}`} onClick={() => setCurrency('USD')}>USD</button>
          </div>
          <div className="price-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Procedure</th>
                  <th>Avg. Price</th>
                  <th>Partner Clinics</th>
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
                        {(proc.clinics || []).map((clinicStr, idx) => {
                          // ★ "병원명:가격" 에서 "병원명"만 잘라서 보여주기
                          const clinicName = clinicStr.split(':')[0]; 
                          return (
                            <div key={idx} className="clinic-item">
                                <i className="fa-solid fa-hospital clinic-icon"></i> {clinicName}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      
      <footer>
        <div className="container"><p className="disclaimer">&copy; 2025 K-Beauty Insider.</p></div>
      </footer>
    </>
  );
}