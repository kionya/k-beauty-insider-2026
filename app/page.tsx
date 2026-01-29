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

const MAX_STAMPS = 10;

export default function Home() {
  const [currency, setCurrency] = useState<'KRW' | 'USD'>('USD');
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Auth & Stamps
  const [user, setUser] = useState<any>(null);
  const [currentStamps, setCurrentStamps] = useState(0);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // DB에서 내 스탬프 개수 가져오기
  const fetchMyStamps = async (userId: string) => {
    const { count, error } = await supabase
      .from('stamps')
      .select('*', { count: 'exact', head: true }) // 데이터는 안 가져오고 개수만 셈 (빠름)
      .eq('user_id', userId);
    
    if (!error && count !== null) setCurrentStamps(count);
  };

  useEffect(() => {
    const init = async () => {
      // 1. 시술 데이터
      const { data } = await supabase.from('procedures').select('*').order('rank', { ascending: true });
      if (data) setProcedures(data);

      // 2. 로그인 세션 체크
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      if (session?.user) fetchMyStamps(session.user.id);
      
      setLoading(false);
    };
    init();

    // 3. Auth 상태 변경 감지
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) fetchMyStamps(session.user.id);
      else setCurrentStamps(0);
    });

    return () => { authListener.subscription.unsubscribe(); };
  }, []);

  const handleAuth = async () => {
    if (!email || !password) return alert("Enter email/password");
    if (authMode === 'SIGNUP') {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message);
      else { alert("Signup successful!"); setIsLoginModalOpen(false); }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
      else setIsLoginModalOpen(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    alert("Logged out");
  };

  const EXCHANGE_RATE = 1400;
  const getPrice = (krwPrice: number) => currency === 'KRW' ? `₩${krwPrice.toLocaleString()}` : `$${Math.round(krwPrice / EXCHANGE_RATE)}`;

  const scrollSlider = (direction: number) => {
    const slider = document.getElementById('trendSlider');
    if (slider) slider.scrollBy({ left: direction * 350, behavior: 'smooth' });
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = procedures.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(procedures.length / itemsPerPage);

  const handleNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const handlePrevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  if (loading) return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center'}}>Loading...</div>;
  const trendingProcedures = procedures.filter(p => p.rank <= 5);

  return (
    <>
      <header>
        <div className="container nav-wrapper">
          <div className="logo serif">K-Beauty <span style={{fontStyle:'italic', color:'#D4AF37'}}>Insider</span></div>
          <nav className="nav-menu">
            {user && <a href="#benefits">My Benefits</a>}
            <a href="#ranking">Trends</a>
            <a href="#prices">Prices</a>
            <a href="#partners" style={{color:'#D4AF37', fontWeight:'bold'}}>Free Pass</a>
            
            {user ? (
               <button onClick={handleLogout} style={{marginLeft:'20px', background:'none', fontWeight:'bold', cursor:'pointer', color:'#1a1a1a'}}>LOGOUT</button>
            ) : (
               <button onClick={() => setIsLoginModalOpen(true)} style={{marginLeft:'20px', background:'#1a1a1a', color:'white', padding:'8px 20px', borderRadius:'20px', fontSize:'0.8rem'}}>LOGIN</button>
            )}
            <a href="/admin" style={{marginLeft:'15px', color:'#ccc'}}><i className="fa-solid fa-gear"></i></a>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="container">
          <span className="hero-category">Premium Medical Concierge</span>
          <h1 className="serif">Discover the True Price <br/>of Gangnam Beauty.</h1>
          <p>Transparent pricing from the top 1% clinics in Korea.</p>
          <a href="#prices" className="btn-primary">View Price List</a>
        </div>
      </section>

      <section id="benefits" style={{background:'#FAFAF9', borderBottom:'1px solid #ddd'}}>
        <div className="container">
            <h2 className="section-title serif" style={{textAlign:'center', marginBottom:'10px'}}>Loyalty Program</h2>
            <p className="section-subtitle" style={{textAlign:'center', marginBottom:'40px'}}>Collect 10 stamps to get a free procedure.</p>
            
            <div style={{background:'white', padding:'40px', borderRadius:'16px', boxShadow:'0 10px 30px rgba(0,0,0,0.05)', border:'1px solid #D4AF37', maxWidth:'800px', margin:'0 auto', position: 'relative', overflow: 'hidden'}}>
                {!user && (
                    <div style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', background:'rgba(255,255,255,0.8)', backdropFilter:'blur(5px)', zIndex:10, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}>
                        <h3 className="serif" style={{marginBottom:'15px', color:'#1a1a1a'}}>Members Only Benefit</h3>
                        <button onClick={() => setIsLoginModalOpen(true)} style={{padding:'12px 30px', background:'#D4AF37', color:'white', fontSize:'1rem', borderRadius:'30px', fontWeight:'bold', boxShadow:'0 5px 15px rgba(212, 175, 55, 0.4)'}}>Login to Check Stamps</button>
                    </div>
                )}
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
                    <div>
                        <h3 className="serif" style={{fontSize:'1.5rem', color:'#1a1a1a', display:'flex', alignItems:'center', gap:'8px'}}>
                            My Stamps 
                            <span title="Collect 10 stamps to redeem!" style={{cursor:'help', fontSize:'1rem', color:'#D4AF37', opacity:0.7}}><i className="fa-solid fa-circle-question"></i></span>
                        </h3>
                        <p style={{color:'#888'}}>Visit any partner clinic to earn stamps.</p>
                    </div>
                    <div style={{fontSize:'1.2rem', fontWeight:'bold', color:'#D4AF37'}}>{currentStamps} / {MAX_STAMPS}</div>
                </div>

                <div style={{display:'flex', justifyContent:'space-between', gap:'10px', marginBottom:'30px', flexWrap:'wrap'}}>
                    {Array.from({ length: MAX_STAMPS }).map((_, idx) => (
                        <div key={idx} style={{width:'50px', height:'50px', borderRadius:'50%', border: idx < currentStamps ? 'none' : '2px dashed #ddd', background: idx < currentStamps ? '#D4AF37' : 'transparent', color: idx < currentStamps ? 'white' : '#ddd', display:'flex', justifyContent:'center', alignItems:'center', fontSize:'1.2rem', fontWeight:'bold'}}>
                            {idx < currentStamps ? <i className="fa-solid fa-check"></i> : idx + 1}
                        </div>
                    ))}
                </div>

                <div style={{textAlign:'center'}}>
                    {currentStamps >= MAX_STAMPS ? (
                        <button style={{padding:'15px 40px', background:'#1a1a1a', color:'white', fontSize:'1.1rem', fontWeight:'bold', borderRadius:'30px', cursor:'pointer'}}>Select Free Procedure</button>
                    ) : (
                        <div style={{background:'#f5f5f5', padding:'15px', borderRadius:'8px', color:'#666', fontSize:'0.9rem'}}>{MAX_STAMPS - currentStamps} more visits needed for a free reward.</div>
                    )}
                </div>
            </div>
        </div>
      </section>

      {/* Trending Now */}
      <section id="ranking">
        <div className="container">
          <div className="section-header">
             <div><h2 className="section-title serif">Trending Now</h2><p className="section-subtitle">Most requested procedures this month.</p></div>
             <div style={{display:'flex', gap:'10px'}}>
               <button onClick={() => scrollSlider(-1)} style={{padding:'10px', border:'1px solid #ddd', background:'white'}}><i className="fa-solid fa-arrow-left"></i></button>
               <button onClick={() => scrollSlider(1)} style={{padding:'10px', border:'1px solid #ddd', background:'white'}}><i className="fa-solid fa-arrow-right"></i></button>
             </div>
          </div>
          <div className="slider-container">
            <div className="slider-track" id="trendSlider">
              {trendingProcedures.map((proc) => (
                <Link href={`/procedures/${proc.id}`} key={proc.id} style={{textDecoration:'none'}}>
                    <article className="procedure-card" style={{minWidth:'320px', background:'white', border:'1px solid #eee', borderRadius:'12px', padding:'25px', boxShadow:'0 5px 20px rgba(0,0,0,0.05)', display:'flex', flexDirection:'column', justifyContent:'space-between', height:'100%'}}>
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

      {/* Price List */}
      <section id="prices" style={{background:'#fafafa'}}>
        <div className="container">
          <div className="section-header">
             <h2 className="section-title serif">Official Price List</h2>
             <div style={{display:'flex', gap:'5px'}}>
                <button onClick={() => setCurrency('USD')} style={{fontWeight: currency==='USD'?'bold':'normal', padding:'5px 10px', borderBottom: currency==='USD'?'2px solid black':'none'}}>USD</button>
                <button onClick={() => setCurrency('KRW')} style={{fontWeight: currency==='KRW'?'bold':'normal', padding:'5px 10px', borderBottom: currency==='KRW'?'2px solid black':'none'}}>KRW</button>
             </div>
          </div>
          <div className="price-table-container">
            <table>
              <thead>
                <tr style={{background:'#f9f9f9'}}>
                  <th style={{width:'80px'}}>Rank</th><th>Procedure</th><th>Top Clinics</th><th>Gangnam Price</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((proc) => {
                  const displayedClinics = proc.clinics ? proc.clinics.slice(0, 2) : [];
                  const extraCount = proc.clinics ? proc.clinics.length - 2 : 0;
                  return (
                    <tr key={proc.id}>
                      <td style={{fontWeight:'bold', color:'#ccc', fontSize:'1.2rem'}}>{proc.rank}</td>
                      <td><strong style={{fontSize:'1.1rem'}}>{proc.name}</strong><div style={{fontSize:'0.8rem', color:'#999'}}>{proc.category}</div></td>
                      <td>
                          {displayedClinics.length > 0 ? (
                            <div style={{display:'flex', flexDirection:'column', gap:'3px'}}>
                                {displayedClinics.map((c, i) => (<div key={i} style={{fontSize:'0.9rem', color:'#555', display:'flex', alignItems:'center'}}><i className="fa-solid fa-hospital" style={{fontSize:'0.7rem', color:'#D4AF37', marginRight:'6px'}}></i>{c.split(':')[0]}</div>))}
                                {extraCount > 0 && <div style={{fontSize:'0.75rem', color:'#aaa', marginLeft:'15px'}}>+ {extraCount} more</div>}
                            </div>
                          ) : (<span style={{color:'#ddd', fontSize:'0.9rem'}}>-</span>)}
                      </td>
                      <td className="price-tag" style={{color:'#D4AF37'}}>{getPrice(proc.price_krw)}</td>
                      <td><Link href={`/procedures/${proc.id}`}><button style={{border:'1px solid #ddd', background:'white', padding:'8px 15px', borderRadius:'20px', fontWeight:'bold', fontSize:'0.8rem'}}>DETAILS</button></Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{padding:'20px', display:'flex', justifyContent:'center', alignItems:'center', gap:'20px', borderTop:'1px solid #eee'}}>
                <button onClick={handlePrevPage} disabled={currentPage === 1} style={{padding:'10px 15px', background: currentPage === 1 ? '#f5f5f5' : 'white', border:'1px solid #ddd', borderRadius:'8px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? '#ccc' : '#333'}}><i className="fa-solid fa-chevron-left"></i> Prev</button>
                <span style={{fontFamily:'Playfair Display', fontWeight:'bold', color:'#1a1a1a'}}>Page {currentPage} of {totalPages}</span>
                <button onClick={handleNextPage} disabled={currentPage === totalPages} style={{padding:'10px 15px', background: currentPage === totalPages ? '#f5f5f5' : 'white', border:'1px solid #ddd', borderRadius:'8px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: currentPage === totalPages ? '#ccc' : '#333'}}>Next <i className="fa-solid fa-chevron-right"></i></button>
            </div>
          </div>
        </div>
      </section>

      {/* Free Pass Clinics */}
      <section id="partners">
        <div className="container">
          <div style={{textAlign:'center', marginBottom:'40px'}}><h2 className="section-title serif" style={{color:'#D4AF37'}}>Free Pass Clinics</h2><p className="section-subtitle"><strong>Exclusive Benefit:</strong> You can redeem your free procedure at these partner clinics.</p></div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))', gap:'20px'}}>
             {PARTNERS.map((partner, idx) => (
                <div key={idx} style={{background:'white', border:'1px solid #eee', padding:'30px', borderRadius:'12px', textAlign:'center', transition:'all 0.3s', boxShadow:'0 5px 15px rgba(0,0,0,0.03)', position: 'relative', overflow: 'hidden'}} className="hover-card">
                   <div style={{position:'absolute', top:'15px', right:'15px', background:'#D4AF37', color:'white', fontSize:'0.7rem', padding:'3px 8px', borderRadius:'4px', fontWeight:'bold'}}>FREE PASS</div>
                   <div style={{width:'60px', height:'60px', background:'#f9f9f9', borderRadius:'50%', display:'flex', justifyContent:'center', alignItems:'center', margin:'0 auto 20px', color:'#D4AF37'}}><i className="fa-solid fa-hospital fa-2x"></i></div>
                   <h3 style={{fontSize:'1.1rem', fontWeight:'bold', marginBottom:'5px'}}>{partner.name}</h3>
                   <div style={{fontSize:'0.85rem', color:'#888', marginBottom:'15px'}}>{partner.category}</div>
                   <div style={{fontSize:'0.8rem', color:'#aaa', borderTop:'1px solid #eee', paddingTop:'15px'}}><i className="fa-solid fa-location-dot" style={{marginRight:'5px'}}></i> {partner.location}</div>
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

      {/* Login Modal */}
      {isLoginModalOpen && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.6)', zIndex:2000, display:'flex', justifyContent:'center', alignItems:'center'}}>
            <div style={{background:'white', padding:'40px', borderRadius:'16px', width:'400px', boxShadow:'0 20px 50px rgba(0,0,0,0.3)', position:'relative'}}>
                <button onClick={()=>setIsLoginModalOpen(false)} style={{position:'absolute', top:'15px', right:'20px', background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer'}}>✕</button>
                <h2 className="serif" style={{textAlign:'center', marginBottom:'20px', color:'#1a1a1a'}}>{authMode === 'LOGIN' ? 'Welcome Back' : 'Join Membership'}</h2>
                <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                    <input type="email" placeholder="Email Address" value={email} onChange={(e)=>setEmail(e.target.value)} style={{padding:'15px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'1rem'}} />
                    <input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} style={{padding:'15px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'1rem'}} />
                    <button onClick={handleAuth} style={{padding:'15px', background:'#D4AF37', color:'white', border:'none', borderRadius:'8px', fontWeight:'bold', fontSize:'1rem', marginTop:'10px', cursor:'pointer'}}>
                        {authMode === 'LOGIN' ? 'LOGIN' : 'SIGN UP'}
                    </button>
                </div>
                <div style={{textAlign:'center', marginTop:'20px', fontSize:'0.9rem'}}>
                    {authMode === 'LOGIN' ? "Don't have an account? " : "Already have an account? "}
                    <button onClick={() => setAuthMode(authMode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')} style={{background:'none', border:'none', color:'#1a1a1a', fontWeight:'bold', textDecoration:'underline', cursor:'pointer'}}>
                        {authMode === 'LOGIN' ? 'Sign Up' : 'Login'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </>
  );
}