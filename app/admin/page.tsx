'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabase';
import Link from 'next/link';
import * as XLSX from 'xlsx';

export default function AdminPage() {
  const [loading, setLoading] = useState(true);

  // Auth gates
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Data
  const [procedures, setProcedures] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [stamps, setStamps] = useState<any[]>([]);

   // ✅ 여기(1): helper 함수들 추가 (state 바로 아래)
  const getAccessToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  };

  const apiFetch = async (url: string, init?: RequestInit) => {
    const token = await getAccessToken();
    if (!token) throw new Error('No session');

    const res = await fetch(url, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error ?? 'API error');
    return json;
  };

  // ✅ 여기(2): fetchAllData에서 apiFetch를 사용하도록 교체
  const fetchAllData = async () => {
    const procJson = await apiFetch('/api/admin/procedures');
    setProcedures(procJson.data ?? []);

    const resvJson = await apiFetch('/api/admin/reservations');
    setReservations(resvJson.data ?? []);

    const stampsJson = await apiFetch('/api/admin/stamps');
    setStamps(stampsJson.data ?? []);
  };

  const canAccess = useMemo(() => isAdmin || isAuthenticated, [isAdmin, isAuthenticated]);

  // 1) Admin role check (Supabase 로그인 기반)
  useEffect(() => {
    const run = async () => {
      try {

        // ✅ [여기 추가] 세션 확인 로그
        const { data: sess } = await supabase.auth.getSession();
        console.log('ADMIN session?', sess.session);

        const { data: userRes, error: userErr } = await supabase.auth.getUser();
        const user = userRes?.user;

        if (userErr) {
          // 로그인 세션이 없거나 오류면 admin false 유지
          setIsAdmin(false);
          return;
        }

        if (!user) {
          setIsAdmin(false);
          return;
        }

        // profiles row가 없거나 RLS로 막혀도 죽지 않게 처리
        const { data: profile, error: profErr } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (!profErr && profile?.role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  useEffect(() => {
    if (!canAccess) return;
    fetchAllData(); // ✅ 위에서 정의한 apiFetch 기반 fetchAllData 호출
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAccess]);


  const handleLogin = () => {
    // TODO: 하드코딩 대신 ENV 권장. 일단 현재 패턴 유지.
    if (password === '1234') setIsAuthenticated(true);
    else alert('Wrong Password!');
  };

  const handleUpdate = async (id: number, field: string, value: any) => {
    setProcedures((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));

    await apiFetch(`/api/admin/procedures/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ [field]: value }),
    });
  };

  const handleClinicUpdate = async (id: number, text: string) => {
    const clinicArray = text.split(',').map((c) => c.trim()).filter(Boolean);
    await handleUpdate(id, 'clinics', clinicArray);
  };

  const handleDeleteProcedure = async (id: number) => {
    if (!confirm('Delete this procedure?')) return;

    setProcedures((prev) => prev.filter((p) => p.id !== id));

    await apiFetch(`/api/admin/procedures/${id}`, { method: 'DELETE' });
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    setReservations(reservations.map(res => (res.id === id ? { ...res, status: newStatus } : res)));

    await apiFetch(`/api/admin/reservations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
  };

  const handleDeleteReservation = async (id: number) => {
    if (!confirm("Delete this reservation?")) return;

    setReservations(reservations.filter(r => r.id !== id));
    await apiFetch(`/api/admin/reservations/${id}`, { method: 'DELETE' });
  };

  const handleIssueStamp = async (reservation: any) => {
    if (!confirm(`Issue stamp for ${reservation.customer_name}?`)) return;

    // UI 차원에서 미리 차단(최종 강제는 DB 트리거/서버)
    if (!reservation.user_id) {
      alert('Cannot issue stamp: Guest user (No ID linked).');
      return;
    }

    try {
      const json = await apiFetch('/api/admin/stamps/issue', {
        method: 'POST',
        body: JSON.stringify({ reservation_id: reservation.id }),
      });

      if (json?.data) {
        setStamps((prev) => [...prev, json.data]);
      }

      alert('Stamp Issued!');
    } catch (e: any) {
      alert(e?.message ?? 'Failed to issue stamp.');
      console.error(e);
    }
  };


  const handleFileUpload = (e: any) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = async (evt: any) => {
    try {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws);

      if (!confirm(`Upload ${data.length} items?`)) return;

      const formattedData = (data as any[]).map((row: any) => ({
        name: row.name,
        rank: row.rank || 99,
        price_krw: row.price_krw,
        category: row.category || 'Etc',
        description: row.description || '',
        clinics: row.clinics
          ? String(row.clinics).split(',').map((c: string) => c.trim()).filter(Boolean)
          : [],
        is_hot: row.is_hot === 'TRUE' || row.is_hot === true,
      }));

      await apiFetch('/api/admin/procedures', {
        method: 'POST',
        body: JSON.stringify({ items: formattedData }),
      });

      await fetchAllData(); // ✅ 업로드 후 화면만 갱신
      alert('Upload success');
    } catch (e: any) {
      alert(e?.message ?? 'Upload failed');
      console.error(e);
    }
  };

  // ✅ 이 줄은 반드시 handleFileUpload 함수의 맨 아래(= onload 바깥)에 있어야 합니다.
  reader.readAsBinaryString(file);
};


  // ✅ 로딩 화면
  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 40 }}>
        Loading...
      </div>
    );
  }

  // ✅ 권한 없으면 로그인 폼
  if (!canAccess) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 40 }}>
        <div className="card" style={{ width: 360, padding: 40, textAlign: 'center' }}>
          <h2 className="title" style={{ marginBottom: 20 }}>
            Admin Access
          </h2>
          <input
            type="password"
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            style={{ width: '100%', marginBottom: 15 }}
            placeholder="Enter Password"
          />
          <button onClick={handleLogin} className="btnPrimary" style={{ width: '100%' }}>
            Login
          </button>
          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
            (Supabase admin role 로그인 시 자동 통과)
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ padding: '40px 5%' }}>
      {/* Header */}
      <div className="sectionHeader">
        <div>
          <h1 className="title">Admin Dashboard</h1>
          <p className="subtitle">Manage procedures, reservations, and stamps.</p>
        </div>
        <div className="controlsRow">
          <label className="btnPrimary" style={{ background: 'var(--brand-2)', color: 'black', cursor: 'pointer' }}>
            <i className="fa-solid fa-file-excel" style={{ marginRight: 8 }} /> Upload Excel
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
          <Link href="/" className="btnGhost">
            View Site <i className="fa-solid fa-arrow-up-right-from-square" style={{ marginLeft: 5 }} />
          </Link>
        </div>
      </div>

      {/* Reservations & Stamps */}
      <section className="sectionAlt" style={{ borderRadius: 20, padding: 30, marginBottom: 40, border: '1px solid var(--border)' }}>
        <h2 className="title" style={{ fontSize: 20, marginBottom: 20 }}>
          📋 Reservations & Stamps
        </h2>

        <div className="tableShell">
          <div className="price-table-wrapper">
            <table className="table">
              <thead className="thead">
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Procedure</th>
                  <th>Status</th>
                  <th className="thAction">Stamp</th>
                  <th className="thAction">Action</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((res) => {
                  const isStamped = stamps.some((s) => s.reservation_id === res.id);
                  return (
                    <tr key={res.id} className="trow">
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                        {new Date(res.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ fontWeight: 'bold' }}>{res.customer_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{res.contact_info}</div>
                      </td>
                      <td style={{ color: 'var(--brand)', fontWeight: 600 }}>{res.procedure_name}</td>

                      <td>
                        <select
                          value={res.status}
                          onChange={(e) => handleStatusChange(res.id, e.target.value)}
                          className="select"
                          style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}
                        >
                          <option value="Pending">🟠 Pending</option>
                          <option value="Confirmed">🟢 Confirmed</option>
                          <option value="Completed">🔵 Completed</option>
                          <option value="Cancelled">⚪ Cancelled</option>
                        </select>
                      </td>

                      <td className="tdAction">
                        {isStamped ? (
                          <span style={{ color: 'var(--brand)', fontWeight: 'bold', fontSize: 12, border: '1px solid var(--brand)', padding: '4px 8px', borderRadius: 99 }}>
                            ✓ Issued
                          </span>
                        ) : (
                          <button
                            onClick={() => handleIssueStamp(res)}
                            disabled={res.status !== 'Completed'}
                            style={{
                              opacity: res.status === 'Completed' ? 1 : 0.3,
                              cursor: res.status === 'Completed' ? 'pointer' : 'not-allowed',
                              background: 'var(--brand)',
                              color: 'black',
                              padding: '6px 12px',
                              borderRadius: 99,
                              fontSize: 11,
                              fontWeight: 800,
                            }}
                          >
                            ISSUE STAMP
                          </button>
                        )}
                      </td>

                      <td className="tdAction">
                        <button onClick={() => handleDeleteReservation(res.id)} style={{ color: 'var(--text-muted)' }}>
                          <i className="fa-solid fa-trash" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Procedures */}
      <section className="sectionAlt" style={{ borderRadius: 20, padding: 30, border: '1px solid var(--border)' }}>
        <h2 className="title" style={{ fontSize: 20, marginBottom: 20 }}>
          💰 Procedures & Prices
        </h2>

        <div className="tableShell">
          <div className="price-table-wrapper">
            <table className="table">
              <thead className="thead">
                <tr>
                  <th style={{ width: 60 }}>Rank</th>
                  <th>Name</th>
                  <th>Price (KRW)</th>
                  <th>Clinics (Name:Price)</th>
                  <th className="thAction">Action</th>
                </tr>
              </thead>
              <tbody>
                {procedures.map((item) => (
                  <tr key={item.id} className="trow">
                    <td>
                      <input
                        type="number"
                        defaultValue={item.rank}
                        onBlur={(e) => handleUpdate(item.id, 'rank', Number(e.target.value))}
                        className="input"
                        style={{ width: 50, padding: 6, textAlign: 'center', height: 30 }}
                      />
                    </td>
                    <td style={{ fontWeight: 'bold' }}>{item.name}</td>
                    <td>
                      <input
                        type="number"
                        defaultValue={item.price_krw}
                        onBlur={(e) => handleUpdate(item.id, 'price_krw', Number(e.target.value))}
                        className="input"
                        style={{ width: 120, padding: 6, height: 30 }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        defaultValue={item.clinics?.join(', ') ?? ''}
                        onBlur={(e) => handleClinicUpdate(item.id, e.target.value)}
                        className="input"
                        style={{ width: '100%', padding: 6, fontSize: 12, height: 30 }}
                      />
                    </td>
                    <td className="tdAction">
                      <button onClick={() => handleDeleteProcedure(item.id)} style={{ color: 'var(--danger)' }}>
                        <i className="fa-solid fa-trash" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
