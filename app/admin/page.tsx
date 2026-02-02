'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { supabase } from '../supabase';
import styles from './page.module.css';

type TabKey = 'reservations' | 'procedures' | 'stamps';

export default function AdminPage() {
  const [loading, setLoading] = useState(true);

  // Auth gates
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Data
  const [procedures, setProcedures] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [stamps, setStamps] = useState<any[]>([]);

  // UI
  const [tab, setTab] = useState<TabKey>('reservations');

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
    if (!res.ok) throw new Error(json?.error ?? `API error (${res.status})`);
    return json;
  };

  const fetchAllData = async () => {
    const procJson = await apiFetch('/api/admin/procedures');
    setProcedures(procJson.data ?? []);

    const resvJson = await apiFetch('/api/admin/reservations');
    setReservations(resvJson.data ?? []);

    const stampsJson = await apiFetch('/api/admin/stamps');
    setStamps(stampsJson.data ?? []);
  };

  const canAccess = useMemo(() => isAdmin, [isAdmin]);

  // Admin role check (server gate 단일화)
  useEffect(() => {
    const run = async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const session = sess.session;

        if (!session) {
          setIsAdmin(false);
          setUserEmail(null);
          return;
        }

        setUserEmail(session.user?.email ?? null);

        // 서버 requireAdmin 기준으로 최종 판정
        await apiFetch('/api/admin/me');
        setIsAdmin(true);
      } catch {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!canAccess) return;
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAccess]);

  const handleUpdate = async (id: number, field: string, value: any) => {
    setProcedures((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));

    await apiFetch(`/api/admin/procedures/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ [field]: value }),
    });
  };

  const handleClinicUpdate = async (id: number, text: string) => {
    const clinicArray = text
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    await handleUpdate(id, 'clinics', clinicArray);
  };

  const handleDeleteProcedure = async (id: number) => {
    if (!confirm('Delete this procedure?')) return;

    setProcedures((prev) => prev.filter((p) => p.id !== id));
    await apiFetch(`/api/admin/procedures/${id}`, { method: 'DELETE' });
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    setReservations((prev) => prev.map((res) => (res.id === id ? { ...res, status: newStatus } : res)));

    await apiFetch(`/api/admin/reservations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
  };

  const handleDeleteReservation = async (id: number) => {
    if (!confirm('Delete this reservation?')) return;

    setReservations((prev) => prev.filter((r) => r.id !== id));
    await apiFetch(`/api/admin/reservations/${id}`, { method: 'DELETE' });
  };

  const handleIssueStamp = async (reservation: any) => {
    if (!confirm(`Issue stamp for ${reservation.customer_name}?`)) return;

    // UI 차원 차단(최종 강제는 DB 트리거/서버)
    if (!reservation.user_id) {
      alert('Cannot issue stamp: Guest user (No ID linked).');
      return;
    }

    try {
      const json = await apiFetch('/api/admin/stamps/issue', {
        method: 'POST',
        body: JSON.stringify({ reservation_id: reservation.id }),
      });

      if (json?.data) setStamps((prev) => [...prev, json.data]);
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
            ? String(row.clinics)
                .split(',')
                .map((c: string) => c.trim())
                .filter(Boolean)
            : [],
          is_hot: row.is_hot === 'TRUE' || row.is_hot === true,
        }));

        await apiFetch('/api/admin/procedures', {
          method: 'POST',
          body: JSON.stringify({ items: formattedData }),
        });

        await fetchAllData();
        alert('Upload success');
      } catch (e: any) {
        alert(e?.message ?? 'Upload failed');
        console.error(e);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Loading
  if (loading) {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <div className={`container ${styles.navWrap}`}>
            <Link href="/" className={styles.brand}>
              <span className={styles.brandIcon} aria-hidden="true">
                <i className="fa-solid fa-crown" />
              </span>
              <span className={styles.brandName}>K-Beauty Insider</span>
              <span className={styles.adminBadge}>Admin</span>
            </Link>
          </div>
        </header>
        <div className={`container ${styles.center}`}>Loading...</div>
      </main>
    );
  }

  // No access
  if (!canAccess) {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <div className={`container ${styles.navWrap}`}>
            <Link href="/" className={styles.brand}>
              <span className={styles.brandIcon} aria-hidden="true">
                <i className="fa-solid fa-crown" />
              </span>
              <span className={styles.brandName}>K-Beauty Insider</span>
              <span className={styles.adminBadge}>Admin</span>
            </Link>
          </div>
        </header>

        <div className={`container ${styles.center}`}>
          <div className={styles.card} style={{ maxWidth: 520 }}>
            <div className={styles.cardTitle}>Admin Access Required</div>
            <p className={styles.cardSub} style={{ marginTop: 6 }}>
              이 계정은 admin 권한이 아닙니다. Supabase에서 <code>profiles.role</code>을 <code>admin</code>으로 설정한 뒤
              다시 로그인하세요.
            </p>

            <div className={styles.metaLine}>
              현재 로그인: <b>{userEmail ?? '-'}</b>
            </div>

            <div className={styles.rowBtns}>
              <button
                className={styles.btnPrimary}
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut();
                  location.href = '/';
                }}
              >
                로그아웃
              </button>

              <Link href="/" className={styles.btnSoft}>
                홈으로
              </Link>
            </div>

            <div className={styles.helpBox}>
              <div style={{ marginBottom: 6, fontWeight: 900 }}>SQL 예시</div>
              <code>update profiles set role='admin' where id='&lt;auth_uid&gt;';</code>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const stampedReservationIds = new Set(stamps.map((s) => s.reservation_id));

  return (
    <main className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={`container ${styles.navWrap}`}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandIcon} aria-hidden="true">
              <i className="fa-solid fa-crown" />
            </span>
            <span className={styles.brandName}>K-Beauty Insider</span>
            <span className={styles.adminBadge}>Admin</span>
          </Link>

          <div className={styles.navRight}>
            <label className={styles.btnSoftSmall}>
              <i className="fa-solid fa-file-excel" aria-hidden="true" />
              <span>Upload Excel</span>
              <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className={styles.fileInput} />
            </label>

            <Link href="/" className={styles.btnSoftSmall}>
              View Site <i className="fa-solid fa-arrow-up-right-from-square" style={{ marginLeft: 6 }} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroTop}>
            <div>
              <div className={styles.kicker}>Dashboard</div>
              <h1 className={styles.h1}>
                Admin <span className={styles.h1Sub}>Management</span>
              </h1>
              <p className={styles.lead}>
                Write operations must go through <code>/api/admin/*</code> (Bearer token required).
              </p>
            </div>

            <div className={styles.quickCard}>
              <div className={styles.quickTitle}>Quick checks</div>
              <ul className={styles.quickList}>
                <li>✅ Admin routes: Bearer required</li>
                <li>✅ Excel upload: /api/admin/procedures</li>
                <li>✅ Stamps issue: /api/admin/stamps/issue</li>
              </ul>
            </div>
          </div>

          <div className={styles.tabsRow}>
            <button
              type="button"
              className={`${styles.tabBtn} ${tab === 'reservations' ? styles.tabBtnActive : ''}`}
              onClick={() => setTab('reservations')}
            >
              <i className="fa-solid fa-calendar-check" />
              Reservations
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${tab === 'procedures' ? styles.tabBtnActive : ''}`}
              onClick={() => setTab('procedures')}
            >
              <i className="fa-solid fa-list-check" />
              Procedures
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${tab === 'stamps' ? styles.tabBtnActive : ''}`}
              onClick={() => setTab('stamps')}
            >
              <i className="fa-solid fa-stamp" />
              Stamps
            </button>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className={styles.section}>
        <div className="container">
          {/* Reservations */}
          {tab === 'reservations' && (
            <article className={styles.card}>
              <div className={styles.cardHead}>
                <div>
                  <div className={styles.cardTitle}>Reservations</div>
                  <div className={styles.cardSub}>Status update / stamp issue / delete</div>
                </div>
              </div>

              <div className={styles.tableShell}>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead className={styles.thead}>
                      <tr>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Procedure</th>
                        <th>Status</th>
                        <th className={styles.thAction}>Stamp</th>
                        <th className={styles.thAction}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservations.map((res) => {
                        const isStamped = stampedReservationIds.has(res.id);

                        return (
                          <tr key={res.id} className={styles.trow}>
                            <td className={styles.muted}>
                              {res.created_at ? new Date(res.created_at).toLocaleDateString() : '-'}
                            </td>

                            <td>
                              <div className={styles.bold}>{res.customer_name}</div>
                              <div className={styles.smallMuted}>{res.contact_info}</div>
                            </td>

                            <td className={styles.brandText}>{res.procedure_name}</td>

                            <td>
                              <select
                                value={res.status}
                                onChange={(e) => handleStatusChange(res.id, e.target.value)}
                                className={styles.select}
                              >
                                <option value="Pending">🟠 Pending</option>
                                <option value="Confirmed">🟢 Confirmed</option>
                                <option value="Completed">🔵 Completed</option>
                                <option value="Cancelled">⚪ Cancelled</option>
                              </select>
                            </td>

                            <td className={styles.tdAction}>
                              {isStamped ? (
                                <span className={styles.badgeIssued}>✓ Issued</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleIssueStamp(res)}
                                  disabled={res.status !== 'Completed'}
                                  className={`${styles.btnPill} ${res.status !== 'Completed' ? styles.btnDisabled : ''}`}
                                >
                                  ISSUE STAMP
                                </button>
                              )}
                            </td>

                            <td className={styles.tdAction}>
                              <button type="button" className={styles.iconBtn} onClick={() => handleDeleteReservation(res.id)}>
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
            </article>
          )}

          {/* Procedures */}
          {tab === 'procedures' && (
            <article className={styles.card}>
              <div className={styles.cardHead}>
                <div>
                  <div className={styles.cardTitle}>Procedures</div>
                  <div className={styles.cardSub}>Inline edit rank / price / clinics</div>
                </div>
              </div>

              <div className={styles.tableShell}>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead className={styles.thead}>
                      <tr>
                        <th style={{ width: 80 }}>Rank</th>
                        <th>Name</th>
                        <th style={{ width: 160 }}>Price (KRW)</th>
                        <th>Clinics (Name:Price)</th>
                        <th className={styles.thAction} style={{ width: 90 }}>
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {procedures.map((item) => (
                        <tr key={item.id} className={styles.trow}>
                          <td>
                            <input
                              type="number"
                              defaultValue={item.rank}
                              onBlur={(e) => handleUpdate(item.id, 'rank', Number(e.target.value))}
                              className={styles.input}
                            />
                          </td>

                          <td className={styles.bold}>{item.name}</td>

                          <td>
                            <input
                              type="number"
                              defaultValue={item.price_krw}
                              onBlur={(e) => handleUpdate(item.id, 'price_krw', Number(e.target.value))}
                              className={styles.input}
                            />
                          </td>

                          <td>
                            <input
                              type="text"
                              defaultValue={item.clinics?.join(', ') ?? ''}
                              onBlur={(e) => handleClinicUpdate(item.id, e.target.value)}
                              className={styles.input}
                            />
                          </td>

                          <td className={styles.tdAction}>
                            <button type="button" className={styles.iconBtnDanger} onClick={() => handleDeleteProcedure(item.id)}>
                              <i className="fa-solid fa-trash" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </article>
          )}

          {/* Stamps */}
          {tab === 'stamps' && (
            <article className={styles.card}>
              <div className={styles.cardHead}>
                <div>
                  <div className={styles.cardTitle}>Stamps</div>
                  <div className={styles.cardSub}>Issued stamps list</div>
                </div>

                <button type="button" className={styles.btnSoftSmall} onClick={fetchAllData}>
                  Refresh
                </button>
              </div>

              <div className={styles.tableShell}>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead className={styles.thead}>
                      <tr>
                        <th>Issued At</th>
                        <th>User</th>
                        <th>Reservation ID</th>
                        <th>Issued By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stamps.map((s) => (
                        <tr key={s.id} className={styles.trow}>
                          <td className={styles.muted}>
                            {s.issued_at ? new Date(s.issued_at).toLocaleString() : '-'}
                          </td>
                          <td className={styles.bold}>{s.user_id ?? '-'}</td>
                          <td className={styles.muted}>{s.reservation_id ?? '-'}</td>
                          <td className={styles.muted}>{s.issued_by ?? '-'}</td>
                        </tr>
                      ))}
                      {!stamps.length && (
                        <tr className={styles.trow}>
                          <td colSpan={4} className={styles.muted}>
                            No stamps.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </article>
          )}
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={`container ${styles.footerInner}`}>
          <div className={styles.footerBrand}>
            <span className={styles.brandIconSmall} aria-hidden="true">
              <i className="fa-solid fa-crown" />
            </span>
            K-Beauty Insider Admin
          </div>
          <div className={styles.footerText}>© 2026</div>
        </div>
      </footer>
    </main>
  );
}
