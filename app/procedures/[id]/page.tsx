'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { useParams } from 'next/navigation';
import Link from 'next/link';

// 시술 정보 타입
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

  // 모달(팝업) 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 입력 폼 상태 관리
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    messenger: 'KakaoTalk'
  });

  // DB에서 데이터 가져오기
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from('procedures')
        .select('*')
        .eq('id', id)
        .single();

      if (error) console.error(error);
      else setProc(data);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  // 예약 데이터 DB 전송
  const submitReservation = async () => {
    if (!formData.name || !formData.contact) {
      alert("이름과 연락처를 입력해주세요.");
      return;
    }

    if(!confirm("이 정보로 상담 예약을 접수하시겠습니까?")) return;

    const { error } = await supabase
      .from('reservations')
      .insert({
        customer_name: formData.name,
        contact_info: formData.contact,
        messenger_type: formData.messenger,
        procedure_name: proc?.name
      });

    if (error) {
      alert("오류가 발생했습니다. 다시 시도해주세요.");
      console.error(error);
    } else {
      alert("접수가 완료되었습니다! 담당자가 곧 연락드립니다.");
      setIsModalOpen(false); // 모달 닫기
      setFormData({ name: '', contact: '', messenger: 'KakaoTalk' }); // 폼 초기화
    }
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

      <div className="container" style={{padding:'60px 20px', maxWidth:'800px', paddingBottom:'100px'}}>
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
                <span style={{fontSize:'1.1rem', fontWeight:'bold', color:'#102A43'}}>Average Price</span>
                <span style={{fontSize:'1.8rem', fontWeight:'bold', color:'#00B4D8'}}>₩{proc.price_krw.toLocaleString()}</span>
            </div>
            <p style={{fontSize:'0.9rem', color:'#888', textAlign:'right'}}>* VAT excluded. Tax refund available.</p>
        </div>

        {/* 상세 설명 */}
        <div style={{marginBottom:'50px'}}>
            <h3 style={{fontSize:'1.5rem', color:'#102A43', marginBottom:'20px', borderBottom:'2px solid #00B4D8', display:'inline-block'}}>Why this procedure?</h3>
            <p style={{lineHeight:'1.8', color:'#333', marginBottom:'20px'}}>
                This procedure is currently one of the most popular treatments in Gangnam. 
                It is known for its effectiveness in <strong>{proc.description}</strong>.
            </p>
        </div>

        {/* 하단 고정 예약 버튼 */}
        <div style={{position:'fixed', bottom:'20px', left:'50%', transform:'translateX(-50%)', width:'90%', maxWidth:'400px', zIndex:50}}>
            <button 
                onClick={() => setIsModalOpen(true)}
                style={{
                    width:'100%', padding:'18px', 
                    background:'#102A43', color:'white', 
                    border:'none', borderRadius:'50px', 
                    fontSize:'1.1rem', fontWeight:'bold', 
                    boxShadow:'0 10px 25px rgba(16, 42, 67, 0.4)',
                    cursor:'pointer'
                }}
            >
                Book Consultation
            </button>
        </div>
      </div>

      {/* --- 레이어 팝업 (모달) --- */}
      {isModalOpen && (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.6)', zIndex: 1000,
            display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
            <div style={{
                background: 'white', padding: '30px', borderRadius: '16px',
                width: '90%', maxWidth: '400px', position: 'relative'
            }}>
                <button 
                    onClick={() => setIsModalOpen(false)}
                    style={{position:'absolute', top:'15px', right:'15px', border:'none', background:'none', fontSize:'1.2rem', cursor:'pointer'}}
                >✕</button>
                
                <h3 style={{textAlign:'center', marginBottom:'20px', color:'#102A43'}}>Consultation Request</h3>
                <p style={{textAlign:'center', marginBottom:'20px', fontSize:'0.9rem', color:'#666'}}>
                    Leave your info. We will contact you shortly.<br/>
                    <strong>Target: {proc.name}</strong>
                </p>

                <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                    <input 
                        type="text" placeholder="Your Name" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        style={{padding:'12px', border:'1px solid #ddd', borderRadius:'8px'}}
                    />
                    <select 
                        value={formData.messenger}
                        onChange={(e) => setFormData({...formData, messenger: e.target.value})}
                        style={{padding:'12px', border:'1px solid #ddd', borderRadius:'8px'}}
                    >
                        <option value="KakaoTalk">KakaoTalk ID</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Line">LINE ID</option>
                        <option value="Phone">Phone Number</option>
                    </select>
                    <input 
                        type="text" placeholder="ID or Number" 
                        value={formData.contact}
                        onChange={(e) => setFormData({...formData, contact: e.target.value})}
                        style={{padding:'12px', border:'1px solid #ddd', borderRadius:'8px'}}
                    />
                    
                    <button 
                        onClick={submitReservation}
                        style={{
                            marginTop:'10px', padding:'15px', 
                            background:'#00B4D8', color:'white', 
                            border:'none', borderRadius:'8px', 
                            fontWeight:'bold', fontSize:'1rem', cursor:'pointer'
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