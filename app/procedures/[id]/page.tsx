'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { useParams } from 'next/navigation';
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

export default function ProcedureDetail() {
  const params = useParams();
  const id = params.id;
  
  const [proc, setProc] = useState<Procedure | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', contact: '', messenger: 'KakaoTalk' });

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
    if (!formData.name || !formData.contact) return alert("입력해주세요.");
    const { error } = await supabase.from('reservations').insert({
        customer_name: formData.name, contact_info: formData.contact, 
        messenger_type: formData.messenger, procedure_name: proc?.name
    });
    if (!error) { alert("접수되었습니다!"); setIsModalOpen(false); setFormData({name:'', contact:'', messenger:'KakaoTalk'}); }
  };

  if (loading) return <div>Loading...</div>;
  if (!proc) return <div>Not found</div>;

  return (
    <>
      <header style={{padding:'20px', borderBottom:'1px solid #eee'}}>
        <div className="container" style={{display:'flex', justifyContent:'space-between'}}>
           <Link href="/" style={{fontWeight:'bold', color:'#102A43'}}>← Back</Link>
           <div style={{fontWeight:'bold'}}>K-Beauty Insider</div>
        </div>
      </header>

      <div className="container" style={{padding:'60px 20px', maxWidth:'800px', paddingBottom:'100px'}}>
        <span className="badge badge-purple">{proc.category}</span>
        <h1 style={{fontSize:'2.5rem', fontFamily:'Playfair Display', margin:'10px 0'}}>{proc.name}</h1>
        <p style={{fontSize:'1.2rem', color:'#486581', marginBottom:'40px'}}>{proc.description}</p>

        {/* 평균 가격 */}
        <div style={{background:'#F8FAFC', padding:'30px', borderRadius:'16px', border:'1px solid #D9E2EC', marginBottom:'40px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <span style={{fontWeight:'bold'}}>Average Price</span>
                <span style={{fontSize:'1.8rem', fontWeight:'bold', color:'#00B4D8'}}>₩{proc.price_krw.toLocaleString()}</span>
            </div>
        </div>

        {/* ★ 병원별 가격 리스트 (업그레이드) */}
        <div style={{marginBottom:'50px'}}>
            <h3 style={{fontSize:'1.5rem', marginBottom:'20px'}}>Top Rated Clinics</h3>
            <div style={{display:'grid', gap:'15px'}}>
                {proc.clinics?.map((clinicStr, idx) => {
                    // "병원명:가격" 분리 로직
                    const [name, price] = clinicStr.split(':');
                    const displayPrice = price ? `₩${parseInt(price).toLocaleString()}` : 'View Info';

                    return (
                        <div key={idx} style={{padding:'20px', border:'1px solid #eee', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                            <div style={{fontWeight:'bold', color:'#102A43'}}>
                                <i className="fa-solid fa-hospital" style={{color:'#00B4D8', marginRight:'10px'}}></i>
                                {name}
                            </div>
                            <button onClick={() => setIsModalOpen(true)} style={{padding:'8px 15px', background: price ? '#e3f2fd' : '#fff', color: price ? '#1565c0' : '#333', border:'1px solid #ddd', borderRadius:'20px', fontSize:'0.9rem', cursor:'pointer', fontWeight:'bold'}}>
                                {displayPrice}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* 예약 버튼 */}
        <div style={{position:'fixed', bottom:'20px', left:'50%', transform:'translateX(-50%)', width:'90%', maxWidth:'400px', zIndex:50}}>
            <button onClick={() => setIsModalOpen(true)} style={{width:'100%', padding:'18px', background:'#102A43', color:'white', border:'none', borderRadius:'50px', fontSize:'1.1rem', fontWeight:'bold', boxShadow:'0 10px 25px rgba(16,42,67,0.4)'}}>
                Book Consultation
            </button>
        </div>
      </div>

      {/* 모달 */}
      {isModalOpen && (
        <div style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <div style={{background: 'white', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '400px', position: 'relative'}}>
                <button onClick={() => setIsModalOpen(false)} style={{position:'absolute', top:'10px', right:'15px', border:'none', background:'none', fontSize:'1.5rem'}}>✕</button>
                <h3 style={{textAlign:'center', marginBottom:'20px'}}>Request Consultation</h3>
                <input type="text" placeholder="Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{width:'100%', padding:'12px', marginBottom:'10px', border:'1px solid #ddd', borderRadius:'8px'}} />
                <input type="text" placeholder="Contact Info" value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} style={{width:'100%', padding:'12px', marginBottom:'10px', border:'1px solid #ddd', borderRadius:'8px'}} />
                <button onClick={submitReservation} style={{width:'100%', padding:'15px', background:'#00B4D8', color:'white', border:'none', borderRadius:'8px', fontWeight:'bold'}}>Submit</button>
            </div>
        </div>
      )}
    </>
  );
}