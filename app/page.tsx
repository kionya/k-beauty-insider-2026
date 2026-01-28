'use client';

import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Link from 'next/link';

// 데이터 타입
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

// 가짜 쿠폰 데이터 (나중에 DB 연결 가능)
const COUPONS = [
  { id: 1, title: '₩50,000 OFF', desc: 'First Visit Voucher', code: 'WELCOME50' },
  { id: 2, title: 'Free Taxi', desc: 'Airport Pickup Service', code: 'RIDEFREE' },
  { id: 3, title: 'Skin Care +', desc: 'Free Sheet Mask Pack', code: 'GLOWSKIN' },
];

// 가짜 병원 데이터 (나중에 DB 연결 가능)
const PARTNERS = [
  { name: 'MUSE Clinic', category: 'Skin Care' },
  { name: 'ID Hospital', category: 'Plastic Surgery' },
  { name: 'PPEUM Clinic', category: 'Aesthetic' },
  { name: 'DA Plastic', category: 'Surgery' },
  { name: 'BANOBAGI', category: 'Global' },
  { name: 'LIENJANG', category: 'Dermatology' },
  { name: 'TOXNFILL', category: 'Petit' },
  { name: 'V.IBE', category: 'Trendy' },
];

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
    if (slider) slider.scrollBy({ left: direction * 350, behavior: 'smooth' });
  };

  const handleDownloadCoupon = (code: string) => {
    alert(`Coupon Saved! Show code [${code}] at the clinic.`);
  };

  if (loading) return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center'}}>Loading Premium Content...</div>;

  const trendingProcedures = procedures.filter(p => p.rank <= 5);

  return (
    <>
      <header>
        <div className="container nav-wrapper">
          <div className="logo serif">K-Beauty <span style={{fontStyle:'italic', color:'#D4AF37'}}>Insider</span></div>
          <nav className="nav-menu">
            <a href="#benefits">Benefits</a>
            <a href="#ranking">Trends</a>
            <a href="#prices">Prices</a>
            <a href="#partners">Partners</a>
            {/* 관리자 버튼 (숨김 처리된 톱니바퀴) */}
            <a href="/admin" style={{marginLeft:'20px', color:'#ccc'}}><i className="fa-solid fa-gear"></i></a>
          </nav>
        </div>
      </header>

      {/* 1. Hero Section (잡지 표지 스타일) */}
      <section className="hero">
        <div className="container">
          <span className="hero-category">Premium Medical Concierge</span>
          <h1 className="serif">The Gold Standard of<br/>K-Beauty Pricing.</h1>
          <p>Exclusive access to Gangnam's top 1% clinics.<br/>Transparent prices, verified by locals.</p>
          <a href="#prices" className="btn-primary">View Price List</a>
        </div>
      </section>

      {/* 2. Benefit Coupons (복구됨! ⭐) */}
      <section id="benefits" style={{background:'#F9F1D8'}}>
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title serif">Member Benefits</h2>
              <p className="section-subtitle">Exclusive perks for Insider members.</p>
            </div>
          </div>
          <div className="coupon-grid">
            {COUPONS.map((coupon) => (
              <div className="coupon-card" key={coupon.id}>
                <div className="coupon-left">
                   <h3 className="serif">{coupon.title}</h3>
                   <p>{coupon.desc}</p>
                </div>
                <div className="coupon-right">
                   <button onClick={() => handleDownloadCoupon(coupon.code)}>GET</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Trending Slider */}
      <section id="ranking">
        <div className="container">
          <div className="section-header">
             <div>
               <h2 className="section-title serif">Trending Now</h2>
               <p className="section-subtitle">Most requested procedures this month.</p>
             </div>
             <div style={{display:'flex', gap:'10px'}}>
               <button onClick={() => scrollSlider(-1)} style={{padding:'10px', border:'1px solid #ddd', background:'white'}}><i className="fa-solid fa-arrow-left"></i></button>
               <button onClick={() => scrollSlider(1)} style={{padding:'10px', border:'1px solid #ddd', background:'white'}}><i className="fa-solid fa-arrow-right"></i></button>
             </div>
          </div>
          
          <div className="slider-container">
            <div className="slider-track" id="trendSlider">
              {trendingProcedures.map((proc) => (
                <Link href={`/procedures/${proc.id}`} key={proc.id} style={{textDecoration:'none'}}>
                    <article className="procedure-card">
                      <div className="card-rank">{proc.rank < 10 ? `0${proc.rank}` : proc.rank}</div>
                      <div className="card-content">
                        <h3 style={{fontSize:'1.4rem', marginBottom:'10px'}}>{proc.name}</h3>
                        <p style={{color:'#888', fontSize:'0.9rem', marginBottom:'20px', minHeight:'40px'}}>{proc.description}</p>
                        <div style={{borderTop:'1px solid #eee', paddingTop:'15px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                           <span style={{fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'1px'}}>Avg. Price</span>
                           <span className="serif" style={{fontSize:'1.2rem', color:'#D4AF37'}}>{getPrice(proc.price_krw)}</span>
                        </div>
                      </div>
                    </article>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Partner Clinic List (복구됨! ⭐) */}
      <section id="partners">
        <div className="container">
          <div style={{textAlign:'center', marginBottom:'40px'}}>
             <h2 className="section-title serif">Trusted Partners</h2>
             <p className="section-subtitle">Verified clinics with transparent pricing.</p>
          </div>
          <div className="partner-grid">
             {PARTNERS.map((partner, idx) => (
                <div className="partner-item" key={idx}>
                   {/* 로고 대신 아이콘 사용 (나중에 이미지로 교체 가능) */}
                   <i className="fa-solid fa-hospital partner-logo"></i>
                   <div className="partner-name">{partner.name}</div>
                   <div style={{fontSize:'0.8rem', color:'#aaa', marginTop:'5px'}}>{partner.category}</div>
                </div>
             ))}
          </div>
        </div>
      </section>

      {/* 5. Price List Table */}
      <section id="prices" style={{background:'#fafafa'}}>
        <div className="container">
          <div className="section-header">
             <h2 className="section-title serif">Official Price List</h2>
             <div style={{display:'flex', gap:'5px'}}>
                <button onClick={() => setCurrency('KRW')} style={{fontWeight: currency==='KRW'?'bold':'normal', padding:'5px 10px', borderBottom: currency==='KRW'?'2px solid black':'none'}}>KRW</button>
                <button onClick={() => setCurrency('USD')} style={{fontWeight: currency==='USD'?'bold':'normal', padding:'5px 10px', borderBottom: currency==='USD'?'2px solid black':'none'}}>USD</button>
             </div>
          </div>

          <div className="price-table-wrapper" style={{background:'white', border:'1px solid #eee'}}>
            <table>
              <thead>
                <tr>
                  <th style={{width:'80px'}}>Rank</th>
                  <th>Procedure</th>
                  <th>Global Avg.</th>
                  <th>Gangnam Price</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {procedures.map((proc) => (
                  <tr key={proc.id}>
                    <td style={{fontWeight:'bold', color:'#ddd', fontSize:'1.2rem'}}>{proc.rank}</td>
                    <td>
                        <strong style={{fontSize:'1.1rem'}}>{proc.name}</strong>
                        <div style={{fontSize:'0.8rem', color:'#999'}}>{proc.category}</div>
                    </td>
                    <td style={{color:'#aaa', textDecoration:'line-through'}}>{getPrice(proc.price_krw * 1.5)}</td>
                    <td className="price-tag" style={{color:'#D4AF37'}}>{getPrice(proc.price_krw)}</td>
                    <td>
                      <Link href={`/procedures/${proc.id}`}>
                         <button style={{border:'1px solid #ddd', background:'white', padding:'8px 15px', borderRadius:'0'}}>DETAILS</button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      
      <footer style={{background:'#1a1a1a', color:'white', padding:'60px 0', textAlign:'center'}}>
        <div className="container">
            <div className="serif" style={{fontSize:'1.5rem', marginBottom:'20px'}}>K-Beauty <span style={{fontStyle:'italic', color:'#D4AF37'}}>Insider</span></div>
            <p style={{color:'#555', fontSize:'0.9rem'}}>&copy; 2026 K-Beauty Insider. Gangnam, Seoul.</p>
        </div>
      </footer>
    </>
  );
}