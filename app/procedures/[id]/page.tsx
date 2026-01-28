'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase'; // DB 연결 도구
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
  const id = params.id; // 주소창의 번호(1, 2, 3...) 가져오기
  
  const [proc, setProc] = useState<Procedure | null>(null);
  const [loading, setLoading] = useState(true);

  // DB에서 데이터 한 줄 가져오기
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('procedures')
        .select('*')
        .eq('id', id)
        .single(); // 딱 하나만 가져와!

      if (error) {
        console.error(error);
      } else {
        setProc(data);
      }
      setLoading(false);
    };

    fetchData();
  }, [id]);

  const openBooking = () => {
    alert("준비 중인 기능입니다! (다음 단계에서 카카오톡 연결 예정)");
  };

  if (loading) return <div style={{padding:'100px', textAlign:'center'}}>Loading...</div>;
  if (!proc) return <div style={{padding:'100px', textAlign:'center'}}>Procedure not found.</div>;

  return (
    <>
      <header style={{padding:'20px', borderBottom:'1px solid #eee'}}>
        <div className="container" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
           <Link href="/" style={{fontWeight:'bold', color:'#102A43'}}>← Back to List</Link>
           <div style={{fontFamily:'Playfair Display', fontWeight:'bold', color:'#102A43'}}>K-Beauty Insider</div>
        </div>
      </header>

      <div className="container" style={{padding:'60px 20px', maxWidth:'800px'}}>
        {/* 상단 뱃지 & 제목 */}
        <div style={{marginBottom:'10px'}}>
           <span className="badge badge-purple" style={{marginRight:'10px'}}>{proc.category}</span>
           {proc.is_hot && <span className="badge badge-hot">HOT TREND</span>}
        </div>
        
        <h1 style={{fontSize:'2.5rem', fontFamily:'Playfair Display', color:'#102A43', marginBottom:'10px'}}>
            {proc.name}
        </h1>
        <p style={{fontSize:'1.2rem', color:'#486581', marginBottom:'40px'}}>{proc.description}</p>

        {/* 가격 정보 카드 */}
        <div style={{background:'#F8FAFC', padding:'30px', borderRadius:'16px', border:'1px solid #D9E2EC', marginBottom:'40px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                <span style={{fontSize:'1.1rem', fontWeight:'bold', color:'#102A43'}}>Average Price (Gangnam)</span>
                <span style={{fontSize:'1.8rem', fontWeight:'bold', color:'#00B4D8'}}>₩{proc.price_krw.toLocaleString()}</span>
            </div>
            <p style={{fontSize:'0.9rem', color:'#888', textAlign:'right'}}>* VAT excluded. Tax refund available.</p>
        </div>

        {/* 상세 정보 (임시 텍스트) */}
        <div style={{marginBottom:'50px'}}>
            <h3 style={{fontSize:'1.5rem', color:'#102A43', marginBottom:'20px', borderBottom:'2px solid #00B4D8', display:'inline-block'}}>
                Why this procedure?
            </h3>
            <p style={{lineHeight:'1.8', color:'#333', marginBottom:'20px'}}>
                This procedure is currently one of the most popular treatments in Gangnam. 
                It is known for its effectiveness in <strong>{proc.description}</strong>.
            </p>
            <ul style={{listStyle:'disc', paddingLeft:'20px', lineHeight:'1.8', color:'#333'}}>
                <li><strong>Recovery:</strong> Usually takes 1-3 days depending on skin type.</li>
                <li><strong>Pain Level:</strong> Mild to Moderate (Numbing cream provided).</li>
                <li><strong>Duration:</strong> Approx. 30-60 minutes.</li>
            </ul>
        </div>

        {/* 추천 병원 리스트 */}
        <div style={{marginBottom:'50px'}}>
            <h3 style={{fontSize:'1.5rem', color:'#102A43', marginBottom:'20px'}}>Top Rated Clinics</h3>
            <div style={{display:'grid', gap:'15px'}}>
                {proc.clinics?.map((clinic, idx) => (
                    <div key={idx} style={{padding:'20px', border:'1px solid #eee', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                        <div style={{fontWeight:'bold', color:'#102A43'}}>
                            <i className="fa-solid fa-hospital" style={{color:'#00B4D8', marginRight:'10px'}}></i>
                            {clinic}
                        </div>
                        <button style={{padding:'8px 15px', background:'#fff', border:'1px solid #102A43', borderRadius:'20px', fontSize:'0.8rem', cursor:'pointer'}}>
                            View Profile
                        </button>
                    </div>
                ))}
            </div>
        </div>

        {/* 하단 고정 예약 버튼 (모바일 친화적) */}
        <div style={{position:'fixed', bottom:'20px', left:'50%', transform:'translateX(-50%)', width:'90%', maxWidth:'400px', zIndex:100}}>
            <button 
                onClick={openBooking}
                style={{
                    width:'100%', padding:'18px', 
                    background:'#102A43', color:'white', 
                    border:'none', borderRadius:'50px', 
                    fontSize:'1.1rem', fontWeight:'bold', 
                    boxShadow:'0 10px 25px rgba(16, 42, 67, 0.4)',
                    cursor:'pointer'
                }}
            >
                Book Now & Get Reward
            </button>
        </div>
      </div>
    </>
  );
}