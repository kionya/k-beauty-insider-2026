'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { supabase } from '../../supabase';
import styles from './page.module.css';

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

export default function ProcedureDetail({ params }: { params: { id: string } }) {
  const id = params.id;

  const [proc, setProc] = useState<Procedure | null>(null);
  const [loading, setLoading] = useState(true);

  const [currency, setCurrency] = useState<'KRW' | 'USD'>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(1400);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    messenger: 'KakaoTalk',
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);

      const { data, error } = await supabase.from('procedures').select('*').eq('id', id).single();
      if (!error && data) setProc(data as any);
      else setProc(null);

      setLoading(false);
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    const loadRate = async () => {
      try {
        const res = await fetch('/api/exchange-rate', { cache: 'no-store' });
        const json = await res.json();
        const rate = Number(json?.rate);
        if (Number.isFinite(rate) && rate > 0) setExchangeRate(rate);
      } catch {
        // ignore
      }
    };
    loadRate();
  }, []);

  const formatPrice = (krw: number) => {
    if (currency === 'KRW') return `₩${krw.toLocaleString()}`;
    return `$${Math.round(krw / exchangeRate).toLocaleString()}`;
  };

  const clinicRows = useMemo(() => {
    const arr = proc?.clinics ?? [];
    return arr
      .map((clinicStr) => {
        const [name, price] = String(clinicStr).split(':');
        const krw = price ? Number.parseInt(price, 10) : null;
        return { name: (name ?? '').trim(), krw };
      })
      .filter((x) => x.name);
  }, [proc]);

  const submitReservation = async (e: FormEvent) => {
    e.preventDefault();
    if (!proc) return;

    const customer_name = formData.name.trim();
    const contact_info = formData.contact.trim();
    const messenger_type = formData.messenger.trim();

    if (!customer_name || !contact_info || !messenger_type) {
      alert('Please fill in all fields.');
      return;
    }

    setSubmitting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token ?? '';
      const userId = session?.user?.id ?? null;

      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          user_id: userId,
          customer_name,
          contact_info,
          messenger_type,
          procedure_name: proc.name,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json?.error ?? 'Error submitting request. Please try again.');
        return;
      }

      alert('Request received! We will contact you shortly.');
      setIsModalOpen(false);
      setFormData({ name: '', contact: '', messenger: 'KakaoTalk' });
    } finally {
      setSubmitting(false);
    }
  };

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
            </Link>
          </div>
        </header>
        <div className={`container ${styles.center}`}>Loading...</div>
      </main>
    );
  }

  if (!proc) {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <div className={`container ${styles.navWrap}`}>
            <Link href="/" className={styles.brand}>
              <span className={styles.brandIcon} aria-hidden="true">
                <i className="fa-solid fa-crown" />
              </span>
              <span className={styles.brandName}>K-Beauty Insider</span>
            </Link>
            <div className={styles.navActions}>
              <Link href="/" className={styles.btnSoftSmall}>
                Back Home
              </Link>
            </div>
          </div>
        </header>
        <div className={`container ${styles.center}`}>Procedure not found.</div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={`container ${styles.navWrap}`}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandIcon} aria-hidden="true">
              <i className="fa-solid fa-crown" />
            </span>
            <span className={styles.brandName}>K-Beauty Insider</span>
          </Link>

          <nav className={styles.nav}>
            <Link href="/#featured">Clinics</Link>
            <Link href="/#procedures">Procedures</Link>
            <Link href="/#prices">Prices</Link>
            <Link href="/#about">Reviews</Link>
          </nav>

          <div className={styles.navActions}>
            <Link href="/#prices" className={styles.btnSoftSmall}>
              Price List
            </Link>
            <Link href="/" className={styles.iconLink} aria-label="Home">
              <i className="fa-solid fa-house" />
            </Link>
          </div>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={`container ${styles.heroGrid}`}>
          <div className={styles.heroLeft}>
            <div className={styles.badgeRow}>
              <span className={styles.pill}>Rank {proc.rank}</span>
              {proc.category ? <span className={styles.pillSoft}>{proc.category}</span> : null}
              {proc.is_hot ? <span className={styles.pillHot}>HOT</span> : null}
            </div>

            <h1 className={styles.h1}>{proc.name}</h1>
            <p className={styles.lead}>{proc.description}</p>

            <div className={styles.heroActions}>
              <Link href="/#prices" className={styles.btnSoft}>
                Compare Prices
              </Link>
              <button className={styles.btnPrimary} type="button" onClick={() => setIsModalOpen(true)}>
                Request Consultation
              </button>
            </div>
          </div>

          <aside className={styles.heroRight} aria-label="Procedure image placeholder">
            <div className={styles.heroImage} />
          </aside>
        </div>
      </section>

      <section className={styles.section}>
        <div className={`container ${styles.contentGrid}`}>
          <article className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <div className={styles.cardTitle}>Gangnam Average</div>
                <div className={styles.cardSub}>Exchange rate from server API.</div>
              </div>

              <div className={styles.toggle}>
                <button
                  className={`${styles.toggleBtn} ${currency === 'USD' ? styles.toggleActive : ''}`}
                  onClick={() => setCurrency('USD')}
                  type="button"
                >
                  USD
                </button>
                <button
                  className={`${styles.toggleBtn} ${currency === 'KRW' ? styles.toggleActive : ''}`}
                  onClick={() => setCurrency('KRW')}
                  type="button"
                >
                  KRW
                </button>
              </div>
            </div>

            <div className={styles.priceValue}>{formatPrice(proc.price_krw)}</div>
            <div className={styles.note}>₩{Math.round(exchangeRate).toLocaleString()} / $1</div>
          </article>

          <article className={styles.card}>
            <div className={styles.cardTitle}>Partner Clinics Pricing</div>
            <div className={styles.cardSub}>Click a row to request consultation.</div>

            <div className={styles.clinicList}>
              {clinicRows.length ? (
                clinicRows.map((c) => (
                  <button
                    key={`${c.name}-${c.krw ?? 'na'}`}
                    className={styles.clinicRow}
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <div className={styles.clinicLeft}>
                      <i className="fa-solid fa-hospital" aria-hidden="true" />
                      <span>{c.name}</span>
                    </div>
                    <div className={styles.clinicRight}>{c.krw ? formatPrice(c.krw) : 'Contact for Price'}</div>
                  </button>
                ))
              ) : (
                <div className={styles.empty}>No clinic pricing available.</div>
              )}
            </div>
          </article>
        </div>
      </section>

      <div className={styles.fabWrap}>
        <button className={styles.fab} type="button" onClick={() => setIsModalOpen(true)}>
          Request Free Consultation
        </button>
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <button className={styles.modalClose} onClick={() => setIsModalOpen(false)} type="button">
              ✕
            </button>

            <div className={styles.modalTitle}>Request Consultation</div>
            <div className={styles.modalSub}>
              Leave your contact info. We will reach out via your preferred messenger.
            </div>

            <form onSubmit={submitReservation} className={styles.modalForm}>
              <div>
                <label className={styles.modalLabel}>Full Name</label>
                <input
                  className={styles.modalInput}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your Name"
                />
              </div>

              <div>
                <label className={styles.modalLabel}>Messenger App</label>
                <select
                  className={styles.modalInput}
                  value={formData.messenger}
                  onChange={(e) => setFormData({ ...formData, messenger: e.target.value })}
                >
                  <option value="KakaoTalk">KakaoTalk ID</option>
                  <option value="WhatsApp">WhatsApp Number</option>
                  <option value="Line">LINE ID</option>
                  <option value="WeChat">WeChat ID</option>
                  <option value="Phone">Phone Number (SMS)</option>
                </select>
              </div>

              <div>
                <label className={styles.modalLabel}>ID / Number</label>
                <input
                  className={styles.modalInput}
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="Enter your ID or Number"
                />
              </div>

              <button className={styles.modalSubmit} type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      )}

      <footer className={styles.footer}>
        <div className={`container ${styles.footerInner}`}>
          <div className={styles.footerBrand}>
            <span className={styles.brandIconSmall} aria-hidden="true">
              <i className="fa-solid fa-crown" />
            </span>
            K-Beauty Insider
          </div>
          <div className={styles.footerText}>© 2026 K-Beauty Insider. All rights reserved.</div>
        </div>
      </footer>
    </main>
  );
}
