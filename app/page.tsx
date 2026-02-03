'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { SpeedInsights } from '@vercel/speed-insights/next';

import { supabase } from './supabase';
import styles from './page.module.css';

type Clinic = {
  id: number;
  name: string;
  category: string | null;
  district: string | null;
  location: string | null;
  rating: number | null;
  reviews: number | null;
  hero_image_url: string | null;
  is_featured: boolean;
  is_freepass: boolean;
  sort_rank: number;
};

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

const [featuredClinics, setFeaturedClinics] = useState<Clinic[]>([]);
const [freepassClinics, setFreepassClinics] = useState<Clinic[]>([]);

const WHY_FEATURES = [
  {
    title: 'Price Comparison',
    desc: 'Compare prices across clinics to find the best value.',
    icon: 'fa-solid fa-scale-balanced',
  },
  {
    title: 'Exclusive Coupons',
    desc: 'Unlock members-only perks and special offers.',
    icon: 'fa-solid fa-ticket',
  },
  {
    title: 'Easy Booking',
    desc: 'Request appointments in minutes with verified partners.',
    icon: 'fa-solid fa-calendar-check',
  },
  {
    title: 'Verified Clinics',
    desc: 'Partner clinics are vetted for quality and credibility.',
    icon: 'fa-solid fa-shield-heart',
  },
];

const TESTIMONIALS = [
  {
    name: 'Sarah Johnson',
    text:
      'Amazing experience. The platform made it easy to compare prices and book my appointment. The clinic was professional and the results exceeded expectations.',
  },
  {
    name: 'Michael Chen',
    text:
      'The exclusive coupons saved me hundreds and the booking process was seamless. Customer support was excellent. Highly recommend.',
  },
  {
    name: 'Emma Williams',
    text:
      'As an international patient, this platform was a lifesaver. Everything was clear, transparent, and the clinics were well verified.',
  },
];

export default function Home() {
  // Data
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredClinics, setFeaturedClinics] = useState<any[]>([]);
  const [freepassClinics, setFreepassClinics] = useState<any[]>([]);

  // Auth
  const [user, setUser] = useState<any>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Loyalty / Stamps
  const MAX_STAMPS = 10;
  const [currentStamps, setCurrentStamps] = useState(0);

  const fetchMyStamps = async (userId: string) => {
    const { count, error } = await supabase
      .from('stamps')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (!error && count !== null) setCurrentStamps(count);
  };

  // Exchange / Currency
  const [currency, setCurrency] = useState<'KRW' | 'USD'>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(1400);

  // Price list pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Mobile drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // revealReady (JS 실패해도 기본은 보이게)
  const [revealReady, setRevealReady] = useState(false);

  // Search bar states (UI용)
  const [searchProcedureId, setSearchProcedureId] = useState<string>('');
  const [searchLocation, setSearchLocation] = useState<string>('All Districts');
  const [searchDate, setSearchDate] = useState<string>('');

  const pricesRef = useRef<HTMLElement | null>(null);
  const featuredRef = useRef<HTMLElement | null>(null);

  // Helpers
  const getPrice = (krwPrice: number) =>
    currency === 'KRW' ? `₩${krwPrice.toLocaleString()}` : `$${Math.round(krwPrice / exchangeRate)}`;

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // init
  useEffect(() => {
    const init = async () => {
      // 1) procedures
      const { data } = await supabase.from('procedures').select('*').order('rank', { ascending: true });
      if (data) setProcedures(data as any);

      // 2) auth
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setUser(session?.user || null);
      if (session?.user) fetchMyStamps(session.user.id);
      else setCurrentStamps(0);

      // 3) clinics (featured / freepass)  ✅ 여기서 await 사용
      try {
        const [featRes, freeRes] = await Promise.all([
          fetch('/api/clinics?featured=1', { cache: 'no-store' }),
          fetch('/api/clinics?freepass=1', { cache: 'no-store' }),
        ]);

        const featJson = await featRes.json().catch(() => ({}));
        const freeJson = await freeRes.json().catch(() => ({}));

        setFeaturedClinics(featJson.data ?? []);
        setFreepassClinics(freeJson.data ?? []);
      } catch {
        setFeaturedClinics([]);
        setFreepassClinics([]);
      }

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

  // revealReady
  useEffect(() => {
    setRevealReady(true);
  }, []);

  // reveal observer (JS 실패해도 화면 보이게 안전 처리)
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('[data-reveal]')) as HTMLElement[];
    if (!els.length) return;

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    // reduced motion이면 애니메이션 없이 즉시 표시
    if (reduced) {
      els.forEach((el) => el.classList.add(styles.revealOn));
      return;
    }

    // IntersectionObserver 미지원이면 즉시 표시(= blank page 방지)
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add(styles.revealOn));
      return;
    }

    // 관찰 시작 대상에만 pending(숨김) 부여
    els.forEach((el) => el.classList.add(styles.revealPending));

    const io = new IntersectionObserver(
      (entries) => {
        for (const ent of entries) {
          if (ent.isIntersecting) {
            const target = ent.target as HTMLElement;
            target.classList.remove(styles.revealPending);
            target.classList.add(styles.revealOn);
            io.unobserve(ent.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -10% 0px' }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [styles.revealOn, styles.revealPending]);

  // exchange rate (front constant 금지, API only)
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
        alert('Signup successful! Check your email to confirm.');
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

  // price list pagination
  const totalPages = Math.max(1, Math.ceil(procedures.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const priceListItems = useMemo(() => procedures.slice(indexOfFirstItem, indexOfLastItem), [procedures, indexOfFirstItem, indexOfLastItem]);

  const popularProcedures = useMemo(() => procedures.slice(0, 8), [procedures]);
  const procedureOptions = useMemo(() => procedures.slice(0, 50), [procedures]); // UI용

  const handleNextPage = () => currentPage < totalPages && setCurrentPage((p) => p + 1);
  const handlePrevPage = () => currentPage > 1 && setCurrentPage((p) => p - 1);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    // 현재는 랜딩 UX용: Featured로 이동 후, 이후 필터 적용/페이지 분리로 확장 가능
    featuredRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        Loading...
      </div>
    );
  }

  return (
    <main className={styles.page} data-reveal-ready={revealReady ? '1' : '0'}>
      {/* Header */}
      <header className={styles.header}>
        <div className={`container ${styles.navWrap}`}>
          <div className={styles.brand}>
            <span className={styles.brandIcon} aria-hidden="true">
              <i className="fa-solid fa-crown" />
            </span>
            <span className={styles.brandName}>K-Beauty Insider</span>
          </div>

          <nav className={styles.nav}>
            <a href="#home">Home</a>
            <a href="#loyalty">Loyalty</a>
            <a href="#featured">Clinics</a>
            <a href="#procedures">Procedures</a>
            <a href="#about">About</a>
          </nav>

          <div className={styles.navActions}>
            {user ? (
              <>
                <button className={styles.btnGhost} onClick={() => scrollToId('prices')} type="button">
                  Pricing
                </button>
                <button className={styles.btnPrimary} onClick={handleLogout} type="button">
                  Logout
                </button>
              </>
            ) : (
              <button className={styles.btnPrimary} onClick={() => setIsLoginModalOpen(true)} type="button">
                Sign in
              </button>
            )}

            <Link href="/admin" className={styles.iconLink} aria-label="Admin">
              <i className="fa-solid fa-gear" />
            </Link>

            <button
              className={styles.mobileNavBtn}
              type="button"
              aria-label="Open menu"
              aria-expanded={isDrawerOpen}
              onClick={() => setIsDrawerOpen(true)}
            >
              <i className="fa-solid fa-bars" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="home" className={styles.hero} data-reveal>
        <div className={`container ${styles.heroGrid}`}>
          <div className={styles.heroLeft} data-reveal>
            <h1 className={styles.h1}>
              Discover Premium <span>K-Beauty Clinics</span>
            </h1>
            <p className={styles.lead}>
              Compare prices, request appointments, and get exclusive benefits for top clinics in Gangnam &amp; Seocho.
            </p>

            <div className={styles.heroActions}>
              <button className={styles.btnPrimary} type="button" onClick={() => scrollToId('featured')}>
                Explore Clinics
              </button>
              <button className={styles.btnSoft} type="button" onClick={() => scrollToId('why')}>
                Learn More
              </button>
            </div>
          </div>

          {/* Placeholder image panel */}
          <aside className={styles.heroRight} data-reveal aria-label="Hero image placeholder">
            <div className={styles.heroImage} />
          </aside>
        </div>

        {/* Floating search card */}
        <div className={`container ${styles.searchDock}`} data-reveal>
          <form className={styles.searchCard} onSubmit={onSearch}>
            <div className={styles.searchField}>
              <label className={styles.searchLabel}>Procedure</label>
              <select
                className={styles.searchControl}
                value={searchProcedureId}
                onChange={(e) => setSearchProcedureId(e.target.value)}
              >
                <option value="">Select procedure</option>
                {procedureOptions.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.searchField}>
              <label className={styles.searchLabel}>Location</label>
              <select
                className={styles.searchControl}
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
              >
                <option>All Districts</option>
                <option>Gangnam</option>
                <option>Seocho</option>
                <option>Sinsa</option>
                <option>Apgujeong</option>
              </select>
            </div>

            <div className={styles.searchField}>
              <label className={styles.searchLabel}>Date</label>
              <input
                className={styles.searchControl}
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
              />
            </div>

            <button className={styles.searchBtn} type="submit">
              <i className="fa-solid fa-magnifying-glass" /> Search
            </button>
          </form>
        </div>
      </section>

      {/* Loyalty / Stamps */}
      <section id="loyalty" className={styles.section} data-reveal>
        <div className="container">
          <div className={styles.sectionHead} data-reveal>
            <h2 className={styles.h2}>Loyalty Stamps</h2>
            <p className={styles.sub}>Collect 10 stamps to unlock a free procedure.</p>
          </div>

          <div className={styles.loyaltyCard} data-reveal>
            {!user && (
              <div className={styles.lockOverlay}>
                <div className={styles.lockTitle}>Members Only</div>
                <div className={styles.lockSub}>Sign in to track your stamps.</div>
                <button className={styles.btnPrimary} type="button" onClick={() => setIsLoginModalOpen(true)}>
                  Sign in
                </button>
              </div>
            )}

            <div className={styles.loyaltyTop}>
              <div>
                <div className={styles.cardTitle}>My Stamps</div>
                <div className={styles.cardDesc}>Earn stamps when your reservation is completed.</div>
              </div>
              <div className={styles.stampCount}>
                {currentStamps} / {MAX_STAMPS}
              </div>
            </div>

            <div className={styles.stampsGrid}>
              {Array.from({ length: MAX_STAMPS }).map((_, idx) => {
                const on = idx < currentStamps;
                return (
                  <div key={idx} className={`${styles.stampCell} ${on ? styles.stampOn : ''}`}>
                    {on ? <i className="fa-solid fa-check" /> : idx + 1}
                  </div>
                );
              })}
            </div>

            {currentStamps >= MAX_STAMPS ? (
              <div className={styles.rewardRow}>
                <button className={styles.btnPrimary} type="button" onClick={() => scrollToId('freepass')}>
                  Redeem at Free Pass Clinics
                </button>
              </div>
            ) : (
              <div className={styles.rewardHint}>
                {MAX_STAMPS - currentStamps} more visits needed for a free reward.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Free Pass Clinics */}
      <section id="freepass" className={styles.sectionAlt} data-reveal>
        <div className="container">
          <div className={styles.sectionHeadRow} data-reveal>
            <div>
              <h2 className={styles.h2}>Free Pass Clinics</h2>
              <p className={styles.sub}>Redeem your free procedure at verified partner clinics.</p>
            </div>

            <button className={styles.btnSoftSmall} type="button" onClick={() => scrollToId('prices')}>
              See Price List
            </button>
          </div>

          <div className={styles.partnerGrid}>
            {freepassClinics.map((c) => (
              <article key={c.name} className={styles.partnerCard} data-reveal>
                <div className={styles.partnerTop}>
                  <span className={styles.pill}>FREE PASS</span>
                  <span className={styles.rating}>
                    <i className="fa-solid fa-star" aria-hidden="true" /> {c.rating.toFixed(1)} <span>({c.reviews})</span>
                  </span>
                </div>

                <div className={styles.partnerIcon} aria-hidden="true">
                  <i className="fa-solid fa-hospital" />
                </div>

                <h3 className={styles.cardTitle}>{c.name}</h3>
                <p className={styles.cardDesc}>
                  {c.district} • Verified partner • English-friendly support
                </p>

                <div className={styles.partnerBottom}>
                  <div className={styles.priceFrom}>From ${c.priceFromUsd.toLocaleString()}+</div>
                  <button className={styles.btnPrimarySmall} type="button" onClick={() => scrollToId('contact')}>
                    Contact
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose */}
      <section id="why" className={styles.section} data-reveal>
        <div className="container">
          <div className={styles.sectionHead} data-reveal>
            <h2 className={styles.h2}>Why Choose K-Beauty Insider?</h2>
            <p className={styles.sub}>Your trusted partner for Korean beauty procedures.</p>
          </div>

          <div className={styles.featureGrid}>
            {WHY_FEATURES.map((f) => (
              <article key={f.title} className={styles.featureCard} data-reveal>
                <div className={styles.featureIcon} aria-hidden="true">
                  <i className={f.icon} />
                </div>
                <h3 className={styles.cardTitle}>{f.title}</h3>
                <p className={styles.cardDesc}>{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Featured clinics */}
      <section id="featured" ref={(el) => {featuredRef.current = el;}} className={styles.sectionAlt} data-reveal>
        <div className="container">
          <div className={styles.sectionHeadRow} data-reveal>
            <div>
              <h2 className={styles.h2}>Featured Clinics</h2>
              <p className={styles.sub}>Top-rated clinics in Gangnam &amp; Seocho.</p>
            </div>
            <button className={styles.btnSoftSmall} type="button" onClick={() => scrollToId('procedures')}>
              View All Clinics
            </button>
          </div>

          <div className={styles.clinicGrid}>
            {featuredClinics.map((c) => (
              <article key={c.name} className={styles.clinicCard} data-reveal>
                <div className={styles.clinicThumb} aria-hidden="true" />
                <div className={styles.clinicBody}>
                  <div className={styles.clinicTop}>
                    <span className={styles.pill}>{c.district}</span>
                    <span className={styles.rating}>
                      <i className="fa-solid fa-star" aria-hidden="true" /> {c.rating.toFixed(1)} <span>({c.reviews})</span>
                    </span>
                  </div>
                  <h3 className={styles.cardTitle}>{c.name}</h3>
                  <p className={styles.cardDesc}>Verified partner clinic • English-friendly support</p>

                  <div className={styles.clinicBottom}>
                    <div className={styles.priceFrom}>${c.priceFromUsd.toLocaleString()}+</div>
                    <button className={styles.btnPrimarySmall} type="button" onClick={() => scrollToId('prices')}>
                      View Details
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Popular procedures */}
      <section id="procedures" className={styles.section} data-reveal>
        <div className="container">
          <div className={styles.sectionHead} data-reveal>
            <h2 className={styles.h2}>Popular Procedures</h2>
            <p className={styles.sub}>Browse our most sought-after treatments.</p>
          </div>

          <div className={styles.procGrid}>
            {popularProcedures.map((p) => (
              <Link key={p.id} href={`/procedures/${p.id}`} className={styles.procCard} data-reveal>
                <div className={styles.procBadge} aria-hidden="true">
                  <i className="fa-solid fa-sparkles" />
                </div>
                <div className={styles.procName}>{p.name}</div>
                <div className={styles.procMeta}>
                  From <strong>{getPrice(p.price_krw)}</strong>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Prices (kept for data integrity + mobile cards) */}
      <section id="prices" ref={(el) => {pricesRef.current = el;}} className={styles.sectionAlt} data-reveal>
        <div className="container">
          <div className={styles.sectionHeadRow} data-reveal>
            <div>
              <h2 className={styles.h2}>Official Price List</h2>
              <p className={styles.sub}>Paginated (10 per page). Exchange rate from server API.</p>
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

          <div className={styles.priceShell} data-reveal>
            {/* Desktop table */}
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 84 }}>Rank</th>
                  <th>Procedure</th>
                  <th>Top Clinics</th>
                  <th style={{ width: 160, textAlign: 'right' }}>Price</th>
                  <th style={{ width: 120, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>

              <tbody>
                {priceListItems.map((proc) => {
                  const displayedClinics = proc.clinics?.slice(0, 2) ?? [];
                  const extraCount = (proc.clinics?.length ?? 0) - displayedClinics.length;

                  return (
                    <tr key={proc.id}>
                      <td className={styles.tdDim}>{proc.rank}</td>
                      <td>
                        <div className={styles.tProcName}>{proc.name}</div>
                        <div className={styles.tProcMeta}>{proc.category}</div>
                      </td>
                      <td>
                        {displayedClinics.length ? (
                          <div className={styles.clinicList}>
                            {displayedClinics.map((c, i) => (
                              <div key={i} className={styles.clinicItem}>
                                <i className="fa-solid fa-hospital" style={{ marginRight: 8 }} />
                                {c.split(':')[0]}
                              </div>
                            ))}
                            {extraCount > 0 && <div className={styles.moreHint}>+ {extraCount} more</div>}
                          </div>
                        ) : (
                          <span className={styles.tdDim}>-</span>
                        )}
                      </td>
                      <td className={styles.tPrice}>{getPrice(proc.price_krw)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <Link href={`/procedures/${proc.id}`}>
                          <button className={styles.btnPrimarySmall} type="button">
                            Details
                          </button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className={styles.mobileCards}>
              {priceListItems.map((proc) => {
                const displayedClinics = proc.clinics?.slice(0, 2) ?? [];
                const extraCount = (proc.clinics?.length ?? 0) - displayedClinics.length;

                return (
                  <article key={proc.id} className={styles.mobileCard}>
                    <div className={styles.mobileTop}>
                      <div>
                        <div className={styles.mobileRank}>Rank {proc.rank}</div>
                        <div className={styles.mobileName}>{proc.name}</div>
                        <div className={styles.mobileMeta}>{proc.category}</div>
                      </div>
                      <div className={styles.mobilePrice}>{getPrice(proc.price_krw)}</div>
                    </div>

                    <div className={styles.mobileClinics}>
                      {displayedClinics.length ? (
                        <>
                          {displayedClinics.map((c, i) => (
                            <div key={i} className={styles.mobileClinicItem}>
                              <i className="fa-solid fa-hospital" style={{ marginRight: 8 }} />
                              {c.split(':')[0]}
                            </div>
                          ))}
                          {extraCount > 0 && <div className={styles.moreHint}>+ {extraCount} more</div>}
                        </>
                      ) : (
                        <span className={styles.tdDim}>-</span>
                      )}
                    </div>

                    <div className={styles.mobileActions}>
                      <Link href={`/procedures/${proc.id}`}>
                        <button className={styles.btnPrimarySmall} type="button">
                          Details
                        </button>
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

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

      {/* Testimonials */}
      <section id="about" className={styles.section} data-reveal>
        <div className="container">
          <div className={styles.sectionHead} data-reveal>
            <h2 className={styles.h2}>What Our Clients Say</h2>
            <p className={styles.sub}>Real experiences from real people.</p>
          </div>

          <div className={styles.testGrid}>
            {TESTIMONIALS.map((t) => (
              <article key={t.name} className={styles.testCard} data-reveal>
                <div className={styles.testTop}>
                  <div className={styles.avatar} aria-hidden="true" />
                  <div>
                    <div className={styles.testName}>{t.name}</div>
                    <div className={styles.testStars} aria-hidden="true">
                      <i className="fa-solid fa-star" />
                      <i className="fa-solid fa-star" />
                      <i className="fa-solid fa-star" />
                      <i className="fa-solid fa-star" />
                      <i className="fa-solid fa-star" />
                    </div>
                  </div>
                </div>
                <p className={styles.testText}>&ldquo;{t.text}&rdquo;</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className={styles.cta} data-reveal>
        <div className={`container ${styles.ctaInner}`} data-reveal>
          <h2 className={styles.ctaTitle}>Ready to Transform Your Beauty Journey?</h2>
          <p className={styles.ctaSub}>Join thousands of satisfied clients who found their perfect clinic.</p>
          <div className={styles.ctaActions}>
            <button className={styles.btnPrimary} type="button" onClick={() => scrollToId('featured')}>
              Get Started Now
            </button>
            <button className={styles.btnSoft} type="button" onClick={() => scrollToId('prices')}>
              Contact Us
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={`container ${styles.footerGrid}`}>
          <div>
            <div className={styles.footerBrand}>
              <span className={styles.brandIconSmall} aria-hidden="true">
                <i className="fa-solid fa-crown" />
              </span>
              K-Beauty Insider
            </div>
            <p className={styles.footerText}>
              Your trusted partner for Korean beauty procedures in Gangnam &amp; Seocho.
            </p>
            <div className={styles.footerSocial} aria-label="Social links">
              <a className={styles.socialBtn} href="#home" aria-label="Twitter">
                <i className="fa-brands fa-x-twitter" />
              </a>
              <a className={styles.socialBtn} href="#home" aria-label="Instagram">
                <i className="fa-brands fa-instagram" />
              </a>
              <a className={styles.socialBtn} href="#home" aria-label="YouTube">
                <i className="fa-brands fa-youtube" />
              </a>
            </div>
          </div>

          <div>
            <div className={styles.footerHead}>Quick Links</div>
            <a className={styles.footerLink} href="#home">Home</a>
            <a className={styles.footerLink} href="#featured">Clinics</a>
            <a className={styles.footerLink} href="#procedures">Procedures</a>
            <a className={styles.footerLink} href="#prices">Prices</a>
          </div>

          <div>
            <div className={styles.footerHead}>Support</div>
            <a className={styles.footerLink} href="#contact">Contact</a>
            <a className={styles.footerLink} href="#about">Reviews</a>
            <Link className={styles.footerLink} href="/admin">Admin</Link>
          </div>

          <div>
            <div className={styles.footerHead}>Newsletter</div>
            <p className={styles.footerText}>Subscribe to get special offers and updates.</p>
            <div className={styles.newsletter}>
              <input className={styles.newsInput} placeholder="Your email" />
              <button className={styles.newsBtn} type="button" aria-label="Subscribe">
                <i className="fa-solid fa-arrow-right" />
              </button>
            </div>
          </div>
        </div>

        <div className={`container ${styles.footerBottom}`}>
          © 2026 K-Beauty Insider. All rights reserved.
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
              <div className={styles.brand}>
                <span className={styles.brandIcon} aria-hidden="true">
                  <i className="fa-solid fa-crown" />
                </span>
                <span className={styles.brandName}>K-Beauty Insider</span>
              </div>

              <button className={styles.mobileNavBtn} type="button" aria-label="Close menu" onClick={() => setIsDrawerOpen(false)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className={styles.drawerLinks}>
              <a className={styles.drawerLink} href="#home" onClick={() => setIsDrawerOpen(false)}>
                Home <i className="fa-solid fa-chevron-right" />
              </a>
              <a className={styles.drawerLink} href="#loyalty" onClick={() => setIsDrawerOpen(false)}>
                Loyalty <i className="fa-solid fa-chevron-right" />
              </a>
              <a className={styles.drawerLink} href="#featured" onClick={() => setIsDrawerOpen(false)}>
                Clinics <i className="fa-solid fa-chevron-right" />
              </a>
              <a className={styles.drawerLink} href="#procedures" onClick={() => setIsDrawerOpen(false)}>
                Procedures <i className="fa-solid fa-chevron-right" />
              </a>
              <a className={styles.drawerLink} href="#prices" onClick={() => setIsDrawerOpen(false)}>
                Prices <i className="fa-solid fa-chevron-right" />
              </a>
              <a className={styles.drawerLink} href="#about" onClick={() => setIsDrawerOpen(false)}>
                About <i className="fa-solid fa-chevron-right" />
              </a>
              <a className={styles.drawerLink} href="#contact" onClick={() => setIsDrawerOpen(false)}>
                Contact <i className="fa-solid fa-chevron-right" />
              </a>

              <Link className={styles.drawerLink} href="/admin" onClick={() => setIsDrawerOpen(false)}>
                Admin <i className="fa-solid fa-chevron-right" />
              </Link>

              {user ? (
                <button
                  className={styles.drawerLinkBtn}
                  type="button"
                  onClick={async () => {
                    await handleLogout();
                    setIsDrawerOpen(false);
                  }}
                >
                  Logout <i className="fa-solid fa-arrow-right-from-bracket" />
                </button>
              ) : (
                <button
                  className={styles.drawerLinkBtn}
                  type="button"
                  onClick={() => {
                    setIsLoginModalOpen(true);
                    setIsDrawerOpen(false);
                  }}
                >
                  Sign in <i className="fa-solid fa-right-to-bracket" />
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

      <SpeedInsights />
    </main>
  );
}
