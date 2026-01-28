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

  if (loading) return (
    <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'#FAFAF9'}}>
        <div style={{textAlign:'center', color:'#C5A059'}}>
            <i className="fa-solid fa-circle-notch fa-spin fa-2x"></i>
            <p style={{marginTop:'15px', fontFamily:'Playfair Display'}}>Loading Luxury...</p>
        </div>
    </div>
  );

  const trendingProcedures = procedures.filter(p => p.rank <= 4);

  return (
    <>
      <header>
        <div className="container nav-wrapper">
          <div className="logo logo-font">K-Beauty <span>Insider</span></div>
          <nav className="nav-menu" style={{display:'flex', alignItems:'center'}}>
            <a href="#prices">Price List</a>
            <a href="#ranking">Trend Report</a>
            {/* 고급스러운 관리자 버튼 아이콘 */}
            <a href="/admin" style={{marginLeft:'20px', color:'#ccc', fontSize:'1.1rem'}}>
                <i className="fa-solid fa-gear"></i>
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section: 고급스러운 네이비 배경 */}
      <section className="hero">
        <div className="container">
          <div style={{marginBottom:'20px', color:'#C5A059', letterSpacing:'2px', fontSize:'0.9rem', fontWeight:'bold'}}>PREMIUM AESTHETIC DATABASE</div>
          <h1>Discover the True Price <br/>of Gangnam Beauty.</h1>
          <p>Transparent pricing from the top 1% clinics in Korea.</p>
        </div>
      </section>

      {/* Trending Slider */}
      <section id="ranking" style={{padding:'80px 0'}}>
        <div className="container">
          <div style={{textAlign:'center'}}>
            <h2 className="section-title">Trending This Month</h2>
            <p style={{color:'#64748B', marginBottom:'40px', marginTop:'-30px'}}>Most requested procedures by global visitors</p>
          </div>
          
          <div className="slider-container">
            <button className="slider-btn prev" onClick={() => scrollSlider(-1)}><i className="fa-solid fa-chevron-left"></i></button>
            <div className="slider-track" id="trendSlider">
              {trendingProcedures.map((proc) => (
                <Link href={`/procedures/${proc.id}`} key={proc.id} style={{textDecoration:'none'}}>
                    <article className="procedure-card" style={{height:'100%', cursor:'pointer'}}>
                      <div className="card-header">
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                             <h3>{proc.name}</h3>
                             {proc.is_hot && <span className="badge-hot"><i className="fa-solid fa-crown" style={{marginRight:'3px'}}></i> HOT</span>}
                        </div>
                        {/* 은은한 배경 숫자 */}
                        <div className="rank-badge" style={{color:'rgba(197, 160, 89, 0.1)'}}>0{proc.rank}</div>
                      </div>
                      
                      <div style={{marginTop:'20px', flexGrow:1}}>
                        <div className="context-label">Description</div>
                        <div className="context-text">{proc.description}</div>
                      </div>
                      
                      <div className="card-footer">
                        <span style={{color:'#64748B', fontSize:'0.9rem'}}>Avg. Price</span>
                        <span style={{color:'#0F172A', fontSize:'1.1rem'}}>{getPrice(proc.price_krw)} ~</span>
                      </div>
                    </article>
                </Link>
              ))}
            </div>
            <button className="slider-btn next" onClick={() => scrollSlider(1)}><i className="fa-solid fa-chevron-right"></i></button>
          </div>
        </div>
      </section>

      {/* Price List Table */}
      <section id="prices" style={{padding:'0 0 100px 0'}}>
        <div className="container">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'end', marginBottom:'20px'}}>
            <div>
                <h2 className="section-title" style={{marginBottom:'10px', textAlign:'left'}}>Gangnam Price List</h2>
                <p style={{color:'#64748B'}}>Compare prices from verified partners.</p>
            </div>
            <div className="table-controls">
                <button className={`toggle-btn ${currency === 'KRW' ? 'active' : ''}`} onClick={() => setCurrency('KRW')}>KRW</button>
                <button className={`toggle-btn ${currency === 'USD' ? 'active' : ''}`} onClick={() => setCurrency('USD')}>USD</button>
            </div>
          </div>

          <div className="price-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{width:'80px'}}>Rank</th>
                  <th>Procedure Name</th>
                  <th>Average Price</th>
                  <th>Partner Clinics</th>
                </tr>
              </thead>
              <tbody>
                {procedures.map((proc) => (
                  <tr key={proc.id}>
                    <td>
                        {/* 랭킹 1,2,3위는 골드 컬러로 강조 */}
                        <span style={{
                            fontWeight:'bold', 
                            color: proc.rank <= 3 ? '#C5A059' : '#ccc',
                            fontFamily: 'Playfair Display',
                            fontSize: '1.2rem'
                        }}>
                            {proc.rank === 99 ? '-' : proc.rank}
                        </span>
                    </td>
                    <td>
                        <strong style={{fontSize:'1.05rem', color:'#0F172A'}}>{proc.name}</strong>
                        <div style={{fontSize:'0.8rem', color:'#999', marginTop:'4px'}}>{proc.category}</div>
                    </td>
                    <td style={{fontWeight:'600', color:'#0F172A'}}>{getPrice(proc.price_krw)}</td>
                    <td>
                      <div className="clinic-list">
                        {(proc.clinics || []).map((clinicStr, idx) => {
                          const clinicName = clinicStr.split(':')[0]; 
                          return (
                            <div key={idx} className="clinic-item">
                                <i className="fa-solid fa-star clinic-icon" style={{fontSize:'0.7rem'}}></i> {clinicName}
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
      
      <footer style={{background:'#0F172A', color:'white', padding:'40px 0', textAlign:'center', fontSize:'0.9rem'}}>
        <div className="container">
            <div className="logo logo-font" style={{color:'white', marginBottom:'10px'}}>K-Beauty <span>Insider</span></div>
            <p style={{opacity:0.6, marginBottom:'20px'}}>The most trusted source for medical aesthetic prices in Korea.</p>
            <p style={{opacity:0.4}}>&copy; 2025 K-Beauty Insider. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}