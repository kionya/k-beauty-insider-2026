'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { SpeedInsights } from '@vercel/speed-insights/next';

import { supabase } from './supabase';
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
  const [exchangeRate, setExchangeRate] = useState<number>(1400);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  // ✅ trendSlider: 드래그 중 클릭 방지용
  const sliderDraggedRef = useRef(false);
  const blockClickUntilRef = useRef(0);

  // vibe mouse tracking target
  const vibeRef = useRef<HTMLElement | null>(null);

  // header scrolled
  const [isScrolled, setIsScrolled] = useState(false);

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

  // Drawer (mobile nav)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchMyStamps = async (userId: string) => {
    const { count, error } = await supabase
      .from('stamps')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (!error && count !== null) setCurrentStamps(count);
  };

  // init load
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.from('procedures').select('*').order('rank', { ascending: true });
      if (data) setProcedures(data);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      setUser(session?.user || null);
      if (session?.user) fetchMyStamps(session.user.id);

      setLoading(false);
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) fetchMyStamps(session.user.id);
      else setCurrentStamps(0);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // header scroll state
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // reveal (intersection observer)
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('[data-reveal]')) as HTMLElement[];
    if (!els.length) return;

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reduced) {
      els.forEach((el) => el.classList.add(styles.revealOn));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const ent of entries) {
          if (ent.isIntersecting) {
            (ent.target as HTMLElement).classList.add(styles.revealOn);
            io.unobserve(ent.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -10% 0px' }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [styles.revealOn]);

  // tilt cards
  useEffect(() => {
    const cards = Array.from(document.querySelectorAll('[data-tilt]')) as HTMLElement[];
    if (!cards.length) return;

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reduced) return;

    const onMove = (e: PointerEvent) => {
      const el = e.currentTarget as HTMLElement;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      const tx = (x - 0.5) * 10;
      const ty = (y - 0.5) * 10;
      el.style.setProperty('--tx', tx.toFixed(2));
      el.style.setProperty('--ty', ty.toFixed(2));
    };

    const onLeave = (e: PointerEvent) => {
      const el = e.currentTarget as HTMLElement;
      el.style.setProperty('--tx', '0');
      el.style.setProperty('--ty', '0');
    };

    cards.forEach((el) => {
      el.style.setProperty('--tx', '0');
      el.style.setProperty('--ty', '0');
      el.addEventListener('pointermove', onMove as any, { passive: true });
      el.addEventListener('pointerleave', onLeave as any, { passive: true });
    });

    return () => {
      cards.forEach((el) => {
        el.removeEventListener('pointermove', onMove as any);
        el.removeEventListener('pointerleave', onLeave as any);
      });
    };
  }, []);

  // trending slider drag
  useEffect(() => {
    const track = document.getElementById('trendSlider') as HTMLElement | null;
    if (!track) return;

    let isDown = false;
    let startX = 0;
    let startScrollLeft = 0;

    const DRAG_THRESHOLD = 6; // px

    const onDown = (e: PointerEvent) => {
      isDown = true;
      sliderDraggedRef.current = false;

      track.classList.add(styles.dragging);
      track.setPointerCapture(e.pointerId);

      startX = e.clientX;
      startScrollLeft = track.scrollLeft;
    };

    const onMove = (e: PointerEvent) => {
      if (!isDown) return;

      const dx = e.clientX - startX;

      if (Math.abs(dx) > DRAG_THRESHOLD) {
        sliderDraggedRef.current = true;
      }

      track.scrollLeft = startScrollLeft - dx;
    };

    const endDrag = () => {
      if (!isDown) return;
      isDown = false;
      track.classList.remove(styles.dragging);

      // 드래그가 있었다면 잠깐 클릭 차단
      if (sliderDraggedRef.current) {
        blockClickUntilRef.current = Date.now() + 250;
      }
    };

      track.addEventListener('pointerdown', onDown);
      track.addEventListener('pointermove', onMove);
      track.addEventListener('pointerup', endDrag);
      track.addEventListener('pointercancel', endDrag);

    return () => {
      track.removeEventListener('pointerdown', onDown);
      track.removeEventListener('pointermove', onMove);
      track.removeEventListener('pointerup', endDrag);
      track.removeEventListener('pointercancel', endDrag);
    };
  }, [styles.dragging]);


  // exchange rate
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

  // escape closes drawer
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDrawerOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // vibe mouse variables
  useEffect(() => {
    vibeRef.current?.classList.add(styles.revealReady);
    const el = vibeRef.current;
    if (!el) return;

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--mx', String(x));
        el.style.setProperty('--my', String(y));
      });
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  // drawer open => lock scroll
  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  const handleAuth = async () => {
    if (!email || !password) {
      alert('Enter email/password');
      return;
    }

    if (authMode === 'SIGNUP') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) alert(error.message);
      else {
        alert('Signup successful!');
        setIsLoginModalOpen(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
      else setIsLoginModalOpen(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const getPrice = (krwPrice: number) =>
    currency === 'KRW' ? `₩${krwPrice.toLocaleString()}` : `$${Math.round(krwPrice / exchangeRate)}`;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = procedures.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(1, Math.ceil(procedures.length / itemsPerPage));

  const handleNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const handlePrevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        Loading...
      </div>
    );
  }

  const trendingProcedures = procedures.filter((p) => p.rank <= 5);

  return (
    <main ref={vibeRef} className={styles.page}>
      {/* vibe background */}
      <div className={styles.vibeBg} aria-hidden="true">
        <div className={styles.vibeGradientA} />
        <div className={styles.vibeGradientB} />
        <div className={styles.vibeGrid} />
        <div className={styles.vibeNoise} />
      </div>

      {/* Header */}
      <header className={`${styles.header} ${isScrolled ? styles.headerScrolled : ''}`}>
        <div className={`container ${styles.navWrap}`}>
          <div className={styles.logo}>
            <span className={styles.logoMark} aria-hidden="true" />
            <div className={styles.logoName}>
              K-Beauty <span>Insider</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <nav className={styles.nav}>
              {user && <a href="#benefits">Loyalty</a>}
              <a href="#ranking">Trends</a>
              <a href="#prices">Prices</a>
              <a href="#partners" className={styles.navCta}>
                Free Pass
              </a>

              {user ? (
                <button className={styles.btnGhost} onClick={handleLogout} type="button">
                  Logout
                </button>
              ) : (
                <button className={styles.btnPrimary} onClick={() => setIsLoginModalOpen(true)} type="button">
                  Login
                </button>
              )}

              <Link href="/admin" className={styles.iconLink} aria-label="Admin">
                <i className="fa-solid fa-gear"></i>
              </Link>
            </nav>

            <button
              className={styles.mobileNavBtn}
              type="button"
              aria-label="Open menu"
              aria-expanded={isDrawerOpen}
              onClick={() => setIsDrawerOpen(true)}
            >
              <i className="fa-solid fa-bars"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className={styles.hero} data-reveal>
        <div className="container">
          <div className={styles.heroGrid}>
            <div>
              <span className={styles.kicker}>
                <i className="fa-solid fa-shield-heart" /> Premium Medical Concierge
              </span>
              <h1 className={styles.h1}>
                Discover the True Price <br />
                of Gangnam Beauty.
              </h1>
              <p className={styles.lead}>Transparent pricing from the top clinics in Korea.</p>

              <div className={styles.heroActions}>
                <a href="#prices" className={styles.btnPrimary}>
                  View Price List
                </a>
                <a href="#benefits" className={styles.btnGhost}>
                  Loyalty Program
                </a>
              </div>
            </div>

            <aside className={`${styles.heroPanel} ${styles.tilt}`} data-tilt data-reveal>
              <div className={styles.metricRow}>
                <div className={styles.metricIcon}>
                  <i className="fa-solid fa-chart-line"></i>
                </div>
                <div>
                  <div className={styles.metricTitle}>Monthly Trends</div>
                  <p className={styles.metricText}>Top procedures highlighted from Supabase ranking.</p>
                </div>
              </div>

              <div className={styles.metricRow}>
                <div className={styles.metricIcon}>
                  <i className="fa-solid fa-coins"></i>
                </div>
                <div>
                  <div className={styles.metricTitle}>Transparent Pricing</div>
                  <p className={styles.metricText}>KRW / USD toggle (exchange from ENV later).</p>
                </div>
              </div>

              <div className={styles.metricRow}>
                <div className={styles.metricIcon}>
                  <i className="fa-solid fa-stamp"></i>
                </div>
                <div>
                  <div className={styles.metricTitle}>Loyalty Rewards</div>
                  <p className={styles.metricText}>Collect stamps and unlock a free procedure.</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Loyalty */}
      <section id="benefits" className={`${styles.section} ${styles.sectionAlt}`} data-reveal>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div>
              <div className={styles.title}>Loyalty Program</div>
              <div className={styles.subtitle}>Collect 10 stamps to get a free procedure.</div>
            </div>
          </div>

          <div className={`${styles.card} ${styles.lockWrap}`} data-reveal>
            {!user && (
              <div className={styles.lockOverlay}>
                <div className={styles.lockTitle}>Members Only Benefit</div>
                <button className={styles.btnPrimary} onClick={() => setIsLoginModalOpen(true)} type="button">
                  Login to Check Stamps
                </button>
              </div>
            )}

            <div className={styles.cardInner}>
              <div className={styles.loyaltyTop}>
                <div>
                  <div className={styles.title} style={{ fontSize: 18 }}>
                    My Stamps
                  </div>
                  <div className={styles.subtitle}>Visit any partner clinic to earn stamps.</div>
                </div>
                <div className={styles.stampCount}>
                  {currentStamps} / {MAX_STAMPS}
                </div>
              </div>

              <div className={styles.stampsGrid}>
                {Array.from({ length: MAX_STAMPS }).map((_, idx) => {
                  const on = idx < currentStamps;
                  return (
                    <div key={idx} className={`${styles.stamp} ${on ? styles.stampOn : ''}`}>
                      {on ? <i className="fa-solid fa-check"></i> : idx + 1}
                    </div>
                  );
                })}
              </div>

              {currentStamps >= MAX_STAMPS ? (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button className={styles.rewardBtn} type="button">
                    Select Free Procedure
                  </button>
                </div>
              ) : (
                <div className={styles.rewardBox}>{MAX_STAMPS - currentStamps} more visits needed for a free reward.</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Trending */}
      <section id="ranking" className={styles.section} data-reveal>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div>
              <div className={styles.title}>Trending Now</div>
              <div className={styles.subtitle}>Most requested procedures this month.</div>
            </div>
          </div>

          <div className={styles.sliderWrap}>
            <div className={styles.sliderTrack} 
              id="trendSlider"
              onClickCapture={(e) => {
                if (Date.now() < blockClickUntilRef.current) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
            >
              {trendingProcedures.map((proc) => (
                <Link href={`/procedures/${proc.id}`} key={proc.id}>
                  <article className={`${styles.trendCard} ${styles.tilt}`} data-tilt data-reveal>
                    <div>
                      <div className={styles.trendTop}>
                        <div className={styles.rankTag}>Rank 0{proc.rank}</div>
                        {proc.is_hot && <span className={styles.badgeHot}>HOT</span>}
                      </div>
                      <div className={styles.trendTitle}>{proc.name}</div>
                      <p className={styles.trendDesc}>{proc.description}</p>
                    </div>

                    <div className={styles.trendBottom}>
                      <span style={{ color: 'rgba(255,255,255,0.62)' }}>Avg. Price</span>
                      <span className={styles.priceStrong}>{getPrice(proc.price_krw)}</span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Prices */}
      <section id="prices" className={styles.section} data-reveal>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div>
              <div className={styles.title}>Official Price List</div>
              <div className={styles.subtitle}>Paginated (10 per page).</div>
            </div>

            <div className={styles.toggle}>
              <button
                className={`${styles.toggleBtn} ${currency === 'USD' ? styles.toggleBtnActive : ''}`}
                onClick={() => setCurrency('USD')}
                type="button"
              >
                USD
              </button>
              <button
                className={`${styles.toggleBtn} ${currency === 'KRW' ? styles.toggleBtnActive : ''}`}
                onClick={() => setCurrency('KRW')}
                type="button"
              >
                KRW
              </button>
            </div>
          </div>

          <div className={styles.tableShell} data-reveal>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th className={styles.thNum} style={{ width: 84 }}>
                    Rank
                  </th>
                  <th>Procedure</th>
                  <th>Top Clinics</th>
                  <th className={styles.thNum} style={{ width: 160 }}>
                    Gangnam Price
                  </th>
                  <th className={styles.thAction} style={{ width: 120 }}>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {currentItems.map((proc) => {
                  const displayedClinics = proc.clinics?.slice(0, 2) ?? [];
                  const extraCount = (proc.clinics?.length ?? 0) - displayedClinics.length;

                  return (
                    <tr key={proc.id} className={styles.trow}>
                      <td className={styles.tdNum} style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 1000 }}>
                        {proc.rank}
                      </td>

                      <td>
                        <div className={styles.procName}>{proc.name}</div>
                        <div className={styles.procMeta}>{proc.category}</div>
                      </td>

                      <td>
                        {displayedClinics.length ? (
                          <div className={styles.clinicList}>
                            {displayedClinics.map((c, i) => (
                              <div key={i} className={styles.clinicItem}>
                                <i className="fa-solid fa-hospital" style={{ color: 'var(--brand)' }} />
                                {c.split(':')[0]}
                              </div>
                            ))}
                            {extraCount > 0 && <div className={styles.moreHint}>+ {extraCount} more</div>}
                          </div>
                        ) : (
                          <span style={{ color: 'rgba(255,255,255,0.35)' }}>-</span>
                        )}
                      </td>

                      <td className={`${styles.tdNum} ${styles.priceStrong}`} style={{ color: 'var(--brand)' }}>
                        {getPrice(proc.price_krw)}
                      </td>

                      <td className={styles.tdAction}>
                        <Link href={`/procedures/${proc.id}`}>
                          <button className={styles.detailBtn} type="button">
                            Details
                          </button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className={styles.pagination}>
              <button className={styles.pageBtn} onClick={handlePrevPage} disabled={currentPage === 1} type="button">
                Prev
              </button>
              <div className={styles.pageInfo}>
                Page {currentPage} of {totalPages}
              </div>
              <button
                className={styles.pageBtn}
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Partners */}
      <section id="partners" className={styles.section} data-reveal>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div>
              <div className={styles.title} style={{ color: 'var(--brand)' }}>
                Free Pass Clinics
              </div>
              <div className={styles.subtitle}>
                Exclusive Benefit: You can redeem your free procedure at these partner clinics.
              </div>
            </div>
          </div>

          <div className={styles.partnerGrid}>
            {PARTNERS.map((p, idx) => (
                <div key={idx} className={`${styles.partnerCard} ${styles.tilt}`} data-tilt data-reveal>
                <div className={styles.partnerTag}>
                  <span className={`${styles.pill} ${styles.pillBrand}`}>FREE PASS</span>
                </div>

                <div className={styles.partnerIcon}>
                  <i className="fa-solid fa-hospital"></i>
                </div>

                <h3 className={styles.partnerName}>{p.name}</h3>
                <p className={styles.partnerMeta}>{p.category}</p>

                <div className={styles.partnerLoc}>
                  <i className="fa-solid fa-location-dot" style={{ marginRight: 6 }} />
                  {p.location}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerBrand}>
            K-Beauty <span style={{ color: 'var(--brand)', fontStyle: 'italic' }}>Insider</span>
          </div>
          <div>&copy; 2026 K-Beauty Insider. Gangnam, Seoul.</div>
        </div>
      </footer>

      {/* Drawer */}
      {isDrawerOpen && (
        <div className={styles.drawerOverlay} role="presentation" onClick={() => setIsDrawerOpen(false)}>
          <div
            className={styles.drawer}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile menu"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.drawerTop}>
              <div className={styles.logo}>
                <span className={styles.logoMark} aria-hidden="true" />
                <div className={styles.logoName}>
                  K-Beauty <span>Insider</span>
                </div>
              </div>

              <button
                className={styles.mobileNavBtn}
                type="button"
                aria-label="Close menu"
                onClick={() => setIsDrawerOpen(false)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className={styles.drawerLinks}>
              {user && (
                <a className={styles.drawerLink} href="#benefits" onClick={() => setIsDrawerOpen(false)}>
                  Loyalty <i className="fa-solid fa-chevron-right"></i>
                </a>
              )}
              <a className={styles.drawerLink} href="#ranking" onClick={() => setIsDrawerOpen(false)}>
                Trends <i className="fa-solid fa-chevron-right"></i>
              </a>
              <a className={styles.drawerLink} href="#prices" onClick={() => setIsDrawerOpen(false)}>
                Prices <i className="fa-solid fa-chevron-right"></i>
              </a>
              <a className={styles.drawerLink} href="#partners" onClick={() => setIsDrawerOpen(false)}>
                Free Pass <i className="fa-solid fa-chevron-right"></i>
              </a>

              <Link className={styles.drawerLink} href="/admin" onClick={() => setIsDrawerOpen(false)}>
                Admin <i className="fa-solid fa-chevron-right"></i>
              </Link>

              {user ? (
                <button
                  className={styles.drawerLink}
                  type="button"
                  onClick={async () => {
                    await handleLogout();
                    setIsDrawerOpen(false);
                  }}
                  style={{ justifyContent: 'space-between' }}
                >
                  Logout <i className="fa-solid fa-arrow-right-from-bracket"></i>
                </button>
              ) : (
                <button
                  className={styles.drawerLink}
                  type="button"
                  onClick={() => {
                    setIsLoginModalOpen(true);
                    setIsDrawerOpen(false);
                  }}
                  style={{ justifyContent: 'space-between' }}
                >
                  Login <i className="fa-solid fa-right-to-bracket"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {isLoginModalOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <button className={styles.modalClose} onClick={() => setIsLoginModalOpen(false)} type="button">
              ✕
            </button>

            <div className={styles.modalTitle}>{authMode === 'LOGIN' ? 'Welcome Back' : 'Join Membership'}</div>

            <input
              className={styles.modalInput}
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className={styles.modalInput}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button className={styles.modalSubmit} onClick={handleAuth} type="button">
              {authMode === 'LOGIN' ? 'Login' : 'Sign Up'}
            </button>

            <div className={styles.modalSwitch}>
              {authMode === 'LOGIN' ? "Don't have an account? " : 'Already have an account? '}
              <button
                className={styles.modalLink}
                onClick={() => setAuthMode(authMode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')}
                type="button"
              >
                {authMode === 'LOGIN' ? 'Sign Up' : 'Login'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ 반드시 컴포넌트 내부에서 렌더링 */}
      <SpeedInsights />
    </main>
  );
}
