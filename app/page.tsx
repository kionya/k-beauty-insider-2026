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

const MY_STAMPS = 7;
const MAX_STAMPS = 10;

const PARTNERS = [
  { name: 'MUSE Clinic', category: 'Skin Care', location: 'Gangnam Station' },
  { name: 'ID Hospital', category: 'Plastic Surgery', location: 'Sinsa' },
  { name: 'PPEUM Clinic', category: 'Aesthetic', location: 'Sinnonhyeon' },
  { name: 'DA Plastic', category: 'Surgery', location: 'Gangnam' },
  { name: 'BANOBAGI', category: 'Global', location: 'Yeoksam' },
  { name: 'LIENJANG', category: 'Dermatology', location: 'Gangnam' },
  { name: 'TOXNFILL', category: 'Petit', location: 'Gangnam Station' },
  { name: 'V.IBE', category: 'Trendy', location: 'Apgujeong' },
];

export default function Home() {
  const [currency, setCurrency] = useState<'KRW' | 'USD'>('USD');
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentStamps, setCurrentStamps] = useState(MY_STAMPS);

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

  if (loading) return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center'}}>Loading...</div>;

  const trendingProcedures = procedures.filter(p => p.rank <= 5);

  return (
    <>
      <header>
        <div className="container nav-wrapper">
          <div className="logo serif">K-Beauty <span style={{fontStyle:'italic', color:'#D4AF37'}}>Insider</span></div>
          <nav className="nav-menu">
            <a href="#benefits">Loyalty</a>
            <a href="#ranking">Trends</a>
            <a href="#prices">Prices</a>
            <a href="#partners" style={{color:'#D4AF37', fontWeight:'bold'}}>Free Pass</a>
            <a href="/admin" style={{marginLeft:'20px', color:'#ccc'}}><i className="fa-solid fa-gear"></i></a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <span className="hero-category">Premium Medical Concierge</span>
          <h1 className="serif">Discover the True Price <br/>of Gangnam Beauty.</h1>
          <p>Transparent pricing from the top 1% clinics in Korea.</p>
          <a href="#prices" className="btn-primary">View Price List</a>
        </div>
      </section>

      {/* 1. Loyalty Program */}
      <section id="benefits" style={{background:'#FAFAF9', borderBottom:'1px solid #ddd'}}>
        <div className="container">
            <h2 className="section-title serif" style={{textAlign:'center', marginBottom:'10px'}}>Loyalty Program</h2>
            <p className="section-subtitle" style={{textAlign:'center', marginBottom:'40px'}}>Collect 10 stamps to get a free procedure.</p>
            
            <div style={{
                background:'white', padding:'40px', borderRadius:'16px', 
                boxShadow:'0 10px 30px rgba(0,0,0,0.05)', border:'1px solid #D4AF37', maxWidth:'800px', margin:'0 auto'
            }}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
                    <div>
                        <h3 className="serif" style={{fontSize:'1.5rem', color:'#1a1a1a'}}>My Stamps</h3>
                        <p style={{color:'#888'}}>Visit any partner clinic to earn stamps.</p>
                    </div>
                    <div style={{fontSize:'1.2rem', fontWeight:'bold', color:'#D4AF37'}}>
                        {currentStamps} / {MAX_STAMPS}
                    </div>
                </div>

                <div style={{display:'flex', justifyContent:'space-between', gap:'10px', marginBottom:'30px', flexWrap:'wrap'}}>
                    {Array.from({ length: MAX_STAMPS }).map((_, idx) => (
                        <div key={idx} style={{
                            width:'50px', height:'50px', borderRadius:'50%', 
                            border: idx < currentStamps ? 'none' : '2px dashed #ddd',
                            background: idx < currentStamps ? '#D4AF37' : 'transparent',
                            color: idx < currentStamps ? 'white' : '#ddd',
                            display:'flex', justifyContent:'center', alignItems:'center',
                            fontSize:'1.2rem', fontWeight:'bold'
                        }}>
                            {idx < currentStamps ? <i className="fa-solid fa-check"></i> : idx + 1}
                        </div>
                    ))}
                </div>

                <div style={{textAlign:'center'}}>
                    {currentStamps >= MAX_STAMPS ? (
                        <button style={{
                            padding:'15px 40px', background:'#1a1a1a', color:'white', 
                            fontSize:'1.1rem', fontWeight:'bold', borderRadius:'30px', cursor:'pointer'
                        }}>
                            Select Free Procedure
                        </button>
                    ) : (
                        <div style={{background:'#f5f5f5', padding:'15px', borderRadius:'8px', color:'#666', fontSize:'0.9rem'}}>
                            {MAX_STAMPS - currentStamps} more visits needed for a free reward.
                        </div>
                    )}
                </div>
            </div>
        </div>
      </section>

      {/* 2. Trending Now */}
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
                    <article className="procedure-card" style={{
                        minWidth:'320px', background:'white', border:'1px solid #eee', 
                        borderRadius:'12px', padding:'25px', boxShadow:'0 5px 20px rgba(0,0,0,0.05)',
                        display:'flex', flexDirection:'column', justifyContent:'space-between', height:'100%'
                    }}>
                      <div>
                          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
                             <div style={{fontSize:'0.8rem', fontWeight:'bold', color:'#D4AF37', textTransform:'uppercase'}}>Rank 0{proc.rank}</div>
                             {proc.is_hot && <span style={{background:'#D4AF37', color:'white', fontSize:'0.7rem', padding:'2px 8px', borderRadius:'10px', fontWeight:'bold'}}>HOT</span>}
                          </div>
                          <h3 style={{fontSize:'1.4rem', marginBottom:'10px', color:'#1a1a1a'}}>{proc.name}</h3>
                          <p style={{color:'#666', fontSize:'0.9rem', lineHeight:'1.5'}}>{proc.description}</p>
                      </div>
                      
                      <div style={{borderTop:'1px solid #eee', paddingTop:'15px', marginTop:'20px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                           <span style={{fontSize:'0.85rem', color:'#999'}}>Avg. Price</span>
                           <span className="serif" style={{fontSize:'1.2rem', color:'#1a1a1a', fontWeight:'bold'}}>{getPrice(proc.price_krw)}</span>
                      </div>
                    </article>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Official Price List (수정됨: 병원 2개 노출) */}
      <section id="prices" style={{background:'#fafafa'}}>
        <div className="container">
          <div className="section-header">
             <h2 className="section-title serif">Official Price List</h2>
             <div style={{display:'flex', gap:'5px'}}>
                <button onClick={() => setCurrency('USD')} style={{fontWeight: currency==='USD'?'bold':'normal', padding:'5px 10px', borderBottom: currency==='USD'?'2px solid black':'none'}}>USD</button>
                <button onClick={() => setCurrency('KRW')} style={{fontWeight: currency==='KRW'?'bold':'normal', padding:'5px 10px', borderBottom: currency==='KRW'?'2px solid black':'none'}}>KRW</button>
             </div>
          </div>

          <div className="price-table-wrapper" style={{background:'white', border:'1px solid #eee', borderRadius:'12px', overflow:'hidden', boxShadow:'0 5px 20px rgba(0,0,0,0.03)'}}>
            <table>
              <thead>
                <tr style={{background:'#f9f9f9'}}>
                  <th style={{width:'80px'}}>Rank</th>
                  <th>Procedure</th>
                  <th>Top Clinics</th> {/* 컬럼 변경됨 */}
                  <th>Gangnam Price</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {procedures.map((proc) => {
                  // ★ 병원 이름 2개만 추출
                  const displayedClinics = proc.clinics ? proc.clinics.slice(0, 2) : [];
                  const extraCount = proc.clinics ? proc.clinics.length - 2 : 0;

                  return (
                    <tr key={proc.id}>
                      <td style={{fontWeight:'bold', color:'#ccc', fontSize:'1.2rem'}}>{proc.rank}</td>
                      <td>
                          <strong style={{fontSize:'1.1rem'}}>{proc.name}</strong>
                          <div style={{fontSize:'0.8rem', color:'#999'}}>{proc.category}</div>
                      </td>
                      {/* ★ 병원 리스트 노출 (최대 2개) */}
                      <td>
                          {displayedClinics.length > 0 ? (
                            <div style={{display:'flex', flexDirection:'column', gap:'3px'}}>
                                {displayedClinics.map((c, i) => (
                                    <div key={i} style={{fontSize:'0.9rem', color:'#555', display:'flex', alignItems:'center'}}>
                                        <i className="fa-solid fa-hospital" style={{fontSize:'0.7rem', color:'#D4AF37', marginRight:'6px'}}></i>
                                        {c.split(':')[0]}
                                    </div>
                                ))}
                                {extraCount > 0 && <div style={{fontSize:'0.75rem', color:'#aaa', marginLeft:'15px'}}>+ {extraCount} more</div>}
                            </div>
                          ) : (
                            <span style={{color:'#ddd', fontSize:'0.9rem'}}>-</span>
                          )}
                      </td>
                      <td className="price-tag" style={{color:'#D4AF37'}}>{getPrice(proc.price_krw)}</td>
                      <td>
                        <Link href={`/procedures/${proc.id}`}>
                           <button style={{border:'1px solid #ddd', background:'white', padding:'8px 15px', borderRadius:'20px', fontWeight:'bold', fontSize:'0.8rem'}}>DETAILS</button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 4. Free Pass Clinics (Partners) */}
      <section id="partners">
        <div className="container">
          <div style={{textAlign:'center', marginBottom:'40px'}}>
             <h2 className="section-title serif" style={{color:'#D4AF37'}}>Free Pass Clinics</h2>
             <p className="section-subtitle">
                <strong>Exclusive Benefit:</strong> You can redeem your free procedure at these partner clinics.
             </p>
          </div>
          
          <div style={{
              display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))', 
              gap:'20px'
          }}>
             {PARTNERS.map((partner, idx) => (
                <div key={idx} style={{
                    background:'white', border:'1px solid #eee', padding:'30px', 
                    borderRadius:'12px', textAlign:'center', transition:'all 0.3s',
                    boxShadow:'0 5px 15px rgba(0,0,0,0.03)',
                    position: 'relative', overflow: 'hidden'
                }} className="hover-card">
                   <div style={{position:'absolute', top:'15px', right:'15px', background:'#D4AF37', color:'white', fontSize:'0.7rem', padding:'3px 8px', borderRadius:'4px', fontWeight:'bold'}}>
                       FREE PASS
                   </div>
                   <div style={{width:'60px', height:'60px', background:'#f9f9f9', borderRadius:'50%', display:'flex', justifyContent:'center', alignItems:'center', margin:'0 auto 20px', color:'#D4AF37'}}>
                        <i className="fa-solid fa-hospital fa-2x"></i>
                   </div>
                   <h3 style={{fontSize:'1.1rem', fontWeight:'bold', marginBottom:'5px'}}>{partner.name}</h3>
                   <div style={{fontSize:'0.85rem', color:'#888', marginBottom:'15px'}}>{partner.category}</div>
                   <div style={{fontSize:'0.8rem', color:'#aaa', borderTop:'1px solid #eee', paddingTop:'15px'}}>
                        <i className="fa-solid fa-location-dot" style={{marginRight:'5px'}}></i> {partner.location}
                   </div>
                </div>
             ))}
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