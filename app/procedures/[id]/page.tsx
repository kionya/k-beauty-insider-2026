'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { useParams } from 'next/navigation';
import Link from 'next/link';

// 데이터 타입 정의
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

export default function ProcedureDetail() {
  const params = useParams();
  const id = params.id;
  
  const [proc, setProc] = useState<Procedure | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    messenger: 'KakaoTalk'
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      const { data } = await supabase.from('procedures').select('*').eq('id', id).single();
      if (data) setProc(data);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const submitReservation = async () => {
    if (!formData.name || !formData.contact) {
      alert("Please fill in all fields.");
      return;
    }

    const { error } = await supabase.from('reservations').insert({
        customer_name: formData.name,
        contact_info: formData.contact,
        messenger_type: formData.messenger,
        procedure_name: proc?.name
    });

    if (error) {
      alert("Error submitting request. Please try again.");
      console.error(error);
    } else {
      alert("Request received! We will contact you shortly.");
      setIsModalOpen(false);
      setFormData({ name: '', contact: '', messenger: 'KakaoTalk' });
    }
  };

  if (loading) return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center'}}>Loading...</div>;
  if (!proc) return <div style={{textAlign:'center', padding:'50px'}}>Procedure not found.</div>;

  return (
    <>
      <header style={{padding:'20px', borderBottom:'1px solid #eee', background:'white'}}>
        <div className="container" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
           <Link href="/" style={{fontWeight:'bold', color:'#1a1a1a', display:'flex', alignItems:'center', gap:'5px'}}>
             <i className="fa-solid fa-arrow-left"></i> Back
           </Link>
           <div style={{fontFamily:'Playfair Display', fontWeight:'bold', fontSize:'1.2rem'}}>K-Beauty <span style={{color:'#D4AF37', fontStyle:'italic'}}>Insider</span></div>
        </div>
      </header>

      <div className="container" style={{padding:'60px 20px', maxWidth:'800px', paddingBottom:'120px'}}>
        {/* 상단 정보 */}
        <span className="badge" style={{background:'#f5f5f5', color:'#666', padding:'5px 10px', borderRadius:'4px', fontSize:'0.8rem', textTransform:'uppercase', letterSpacing:'1px', fontWeight:'bold'}}>
            {proc.category}
        </span>
        
        <h1 style={{fontSize:'2.5rem', fontFamily:'Playfair Display', margin:'15px 0 10px', color:'#1a1a1a'}}>
            {proc.name}
        </h1>
        <p style={{fontSize:'1.1rem', color:'#666', lineHeight:'1.6', marginBottom:'40px'}}>{proc.description}</p>

        {/* 가격 정보 카드 */}
        <div style={{background:'#FAFAF9', padding:'30px', borderRadius:'12px', border:'1px solid #eee', marginBottom:'40px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <span style={{fontWeight:'bold', color:'#1a1a1a', fontFamily:'Playfair Display', fontSize:'1.1rem'}}>Gangnam Average</span>
            <span style={{fontSize:'1.8rem', fontWeight:'bold', color:'#D4AF37', fontFamily:'Playfair Display'}}>₩{proc.price_krw.toLocaleString()}</span>
        </div>

        {/* 병원별 가격 리스트 */}
        <div style={{marginBottom:'50px'}}>
            <h3 style={{fontSize:'1.5rem', marginBottom:'20px', fontFamily:'Playfair Display'}}>Partner Clinics Pricing</h3>
            <div style={{display:'grid', gap:'15px'}}>
                {proc.clinics?.map((clinicStr, idx) => {
                    const [name, price] = clinicStr.split(':');
                    const displayPrice = price ? `₩${parseInt(price).toLocaleString()}` : 'Contact for Price';
                    const hasPrice = !!price;

                    return (
                        <div key={idx} style={{
                            padding:'20px', border:'1px solid #eee', borderRadius:'12px', 
                            display:'flex', alignItems:'center', justifyContent:'space-between',
                            background:'white', boxShadow:'0 2px 5px rgba(0,0,0,0.02)'
                        }}>
                            <div style={{fontWeight:'bold', color:'#1a1a1a', display:'flex', alignItems:'center', gap:'10px'}}>
                                <i className="fa-solid fa-hospital" style={{color:'#D4AF37'}}></i>
                                {name}
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(true)} 
                                style={{
                                    padding:'8px 15px', 
                                    background: hasPrice ? '#f9f9f9' : 'white', 
                                    color: hasPrice ? '#1a1a1a' : '#888', 
                                    border: '1px solid #ddd', 
                                    borderRadius:'20px', fontSize:'0.9rem', cursor:'pointer', fontWeight:'bold'
                                }}
                            >
                                {displayPrice}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* ★ NEW: 하단 고정 버튼 문구 변경 */}
        <div style={{position:'fixed', bottom:'30px', left:'50%', transform:'translateX(-50%)', width:'90%', maxWidth:'400px', zIndex:50}}>
            <button 
                onClick={() => setIsModalOpen(true)}
                style={{
                    width:'100%', padding:'18px', 
                    background:'#1a1a1a', color:'white', 
                    border:'none', borderRadius:'50px', 
                    fontSize:'1.1rem', fontWeight:'bold', 
                    boxShadow:'0 10px 25px rgba(0,0,0,0.2)',
                    cursor:'pointer', textTransform:'uppercase', letterSpacing:'1px'
                }}
            >
                Request Free Consultation
            </button>
        </div>
      </div>

      {/* 예약 모달 */}
      {isModalOpen && (
        <div style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <div style={{background: 'white', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '400px', position: 'relative', boxShadow:'0 20px 50px rgba(0,0,0,0.2)'}}>
                <button onClick={() => setIsModalOpen(false)} style={{position:'absolute', top:'15px', right:'20px', border:'none', background:'none', fontSize:'1.5rem', cursor:'pointer', color:'#888'}}>✕</button>
                
                <h3 style={{textAlign:'center', marginBottom:'10px', fontFamily:'Playfair Display', fontSize:'1.5rem'}}>Request Consultation</h3>
                <p style={{textAlign:'center', marginBottom:'25px', color:'#666', fontSize:'0.9rem'}}>Leave your contact info.<br/>We will reach out via your preferred messenger.</p>

                <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                    <div>
                        <label style={{display:'block', marginBottom:'5px', fontWeight:'bold', fontSize:'0.8rem'}}>Full Name</label>
                        <input 
                            type="text" placeholder="Your Name" 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            style={{width:'100%', padding:'12px', border:'1px solid #ddd', borderRadius:'8px', fontSize:'1rem'}}
                        />
                    </div>

                    <div>
                        <label style={{display:'block', marginBottom:'5px', fontWeight:'bold', fontSize:'0.8rem'}}>Messenger App</label>
                        <select 
                            value={formData.messenger}
                            onChange={(e) => setFormData({...formData, messenger: e.target.value})}
                            style={{width:'100%', padding:'12px', border:'1px solid #ddd', borderRadius:'8px', fontSize:'1rem', background:'white'}}
                        >
                            <option value="KakaoTalk">KakaoTalk ID</option>
                            <option value="WhatsApp">WhatsApp Number</option>
                            <option value="Line">LINE ID</option>
                            <option value="WeChat">WeChat ID</option>
                            <option value="Phone">Phone Number (SMS)</option>
                        </select>
                    </div>

                    <div>
                        <label style={{display:'block', marginBottom:'5px', fontWeight:'bold', fontSize:'0.8rem'}}>ID / Number</label>
                        <input 
                            type="text" placeholder="Enter your ID or Number" 
                            value={formData.contact}
                            onChange={(e) => setFormData({...formData, contact: e.target.value})}
                            style={{width:'100%', padding:'12px', border:'1px solid #ddd', borderRadius:'8px', fontSize:'1rem'}}
                        />
                    </div>
                    
                    <button 
                        onClick={submitReservation}
                        style={{
                            marginTop:'10px', padding:'15px', 
                            background:'#D4AF37', color:'white', 
                            border:'none', borderRadius:'8px', 
                            fontWeight:'bold', fontSize:'1rem', cursor:'pointer',
                            textTransform:'uppercase', letterSpacing:'1px'
                        }}
                    >
                        Submit Request
                    </button>
                </div>
            </div>
        </div>
      )}
    </>
  );
}