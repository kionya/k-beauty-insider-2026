'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { supabase } from '../../supabase';
import styles from './page.module.css';

type Procedure = {
  id: number;
  name: string;
  rank: number;
  price_krw: number;
  description: string | null;
  category: string | null;
  clinics: string[] | null;
  is_hot: boolean;
};

export default function ProcedureDetail({ params }: { params: { id: string } }) {
  const procId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [proc, setProc] = useState<Procedure | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const [currency, setCurrency] = useState<'KRW' | 'USD'>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(1400);

  // fetch procedure
  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErrMsg(null);

      if (!Number.isFinite(procId)) {
        setErrMsg('Invalid procedure id.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.from('procedures').select('*').eq('id', procId).single();
      if (error) {
        setErrMsg(error.message);
        setProc(null);
      } else {
        setProc(data as any);
      }
      setLoading(false);
    };

    run();
  }, [procId]);

  // exchange rate (API only)
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

  const displayPrice = useMemo(() => {
    if (!proc) return '-';
    if (currency === 'KRW') return `₩${proc.price_krw.toLocaleString()}`;
    return `$${Math.round(proc.price_krw / exchangeRate).toLocaleString()}`;
  }, [proc, currency, exchangeRate]);

  const clinics = useMemo(() => {
    const arr = proc?.clinics ?? [];
    return (arr || []).map((c) => (c ? c.split(':')[0] : '')).filter(Boolean);
  }, [proc]);

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

  if (errMsg) {
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

        <div className={`container ${styles.center}`}>
          <div className={styles.errorCard}>
            <div className={styles.errorTitle}>Failed to load</div>
            <div className={styles.errorText}>{errMsg}</div>
            <Link href="/" className={styles.btnPrimary}>
              Go Home
            </Link>
          </div>
        </div>
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
          </div>
        </header>

        <div className={`container ${styles.center}`}>Not found.</div>
      </main>
    );
  }

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

      {/* Hero */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroGrid}`}>
          <div className={styles.heroLeft}>
            <div className={styles.breadcrumb}>
              <Link href="/" className={styles.breadLink}>
                Home
              </Link>
              <span className={styles.breadSep}>/</span>
              <Link href="/#procedures" className={styles.breadLink}>
                Procedures
              </Link>
              <span className={styles.breadSep}>/</span>
              <span className={styles.breadNow}>#{proc.id}</span>
            </div>

            <div className={styles.badgeRow}>
              <span className={styles.pill}>Rank {proc.rank}</span>
              {proc.category ? <span className={styles.pillSoft}>{proc.category}</span> : null}
              {proc.is_hot ? <span className={styles.pillHot}>HOT</span> : null}
            </div>

            <h1 className={styles.h1}>{proc.name}</h1>
            <p className={styles.lead}>
              Transparent pricing with verified clinic options. Exchange rate is fetched from server API.
            </p>

            <div className={styles.heroActions}>
              <Link href="/#prices" className={styles.btnSoft}>
                Compare Prices
              </Link>
              <a href="#booking" className={styles.btnPrimary}>
                Request Booking
              </a>
            </div>
          </div>

          <aside className={styles.heroRight} aria-label="Procedure image placeholder">
            <div className={styles.heroImage} />
          </aside>
        </div>
      </section>

      {/* Content */}
      <section className={styles.section}>
        <div className={`container ${styles.contentGrid}`}>
          {/* Price card */}
          <article className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <div className={styles.cardTitle}>Estimated Price</div>
                <div className={styles.cardSub}>Based on official list (KRW) + server exchange rate.</div>
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

            <div className={styles.priceValue}>{displayPrice}</div>

            <div className={styles.priceMetaRow}>
              <div className={styles.metaItem}>
                <div className={styles.metaLabel}>Exchange Rate</div>
                <div className={styles.metaValue}>₩{Math.round(exchangeRate).toLocaleString()} / $1</div>
              </div>
              <div className={styles.metaItem}>
                <div className={styles.metaLabel}>Procedure ID</div>
                <div className={styles.metaValue}>#{proc.id}</div>
              </div>
            </div>

            <div className={styles.note}>
              * Prices can vary by clinic, options, and consultation outcomes.
            </div>
          </article>

          {/* Clinics + description */}
          <article className={styles.card}>
            <div className={styles.cardTitle}>Top Clinics</div>
            <div className={styles.cardSub}>Clinic list is derived from procedure metadata.</div>

            {clinics.length ? (
              <div className={styles.clinicList}>
                {clinics.map((c) => (
                  <div key={c} className={styles.clinicItem}>
                    <i className="fa-solid fa-hospital" aria-hidden="true" />
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.empty}>No clinics listed for this procedure.</div>
            )}

            <div className={styles.divider} />

            <div className={styles.cardTitle}>Description</div>
            <p className={styles.desc}>{proc.description || 'No description provided yet.'}</p>
          </article>
        </div>
      </section>

      {/* Booking CTA */}
      <section id="booking" className={styles.cta}>
        <div className={`container ${styles.ctaInner}`}>
          <h2 className={styles.ctaTitle}>Request a Consultation</h2>
          <p className={styles.ctaSub}>
            For booking requests, use the main page flow (or connect this to a reservations form).
          </p>
          <div className={styles.ctaActions}>
            <Link href="/#featured" className={styles.btnPrimary}>
              Explore Clinics
            </Link>
            <Link href="/#prices" className={styles.btnSoft}>
              Back to Price List
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
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
