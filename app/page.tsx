'use client';

import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Link from 'next/link';
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

const MY_STAMPS = 7;
const MAX_STAMPS = 10;

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

export default function Home() {
  const [currency, setCurrency] = useState<'KRW' | 'USD'>('USD');
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStamps] = useState(MY_STAMPS);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('procedures')
        .select('*')
        .order('rank', { ascending: true });

      if (data) setProcedures(data as Procedure[]);
      setLoading(false);
    };

    fetchData();
  }, []);

  const EXCHANGE_RATE = 1400;
  const getPrice = (krwPrice: number) =>
    currency === 'KRW' ? `₩${krwPrice.toLocaleString()}` : `$${Math.round(krwPrice / EXCHANGE_RATE)}`;

  const scrollSlider = (direction: number) => {
    const slider = document.getElementById('trendSlider');
    if (slider) slider.scrollBy({ left: direction * 360, behavior: 'smooth' });
  };

  // page calculation
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = procedures.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(procedures.length / itemsPerPage);

  const handleNextPage = () => currentPage < totalPages && setCurrentPage((p) => p + 1);
  const handlePrevPage = () => currentPage > 1 && setCurrentPage((p) => p - 1);

  if (loading) {
    return (
      <div className={styles.page} style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'rgba(255,255,255,0.7)' }}>
        Loading...
      </div>
    );
  }

  const trendingProcedures = procedures.filter((p) => p.rank <= 5);

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={`container ${styles.navWrap}`}>
          <div className={styles.logo}>
            <span className={styles.logoMark}>
              <i className="fa-solid fa-sparkles"></i>
            </span>
            <div className={`${styles.logoName} serif`}>
              K-Beauty <span>Insider</span>
            </div>
          </div>

          <nav className={styles.nav}>
            <a href="#benefits">Loyalty</a>
            <a href="#ranking">Trends</a>
            <a href="#prices">Prices</a>
            <a href="#partners" className={styles.navCta}>Free Pass</a>
            <a href="/admin" className={styles.iconLink} aria-label="Admin">
              <i className="fa-solid fa-gear"></i>
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroGrid}>
            <div>
              <span className={styles.kicker}>
                <i className="fa-solid fa-shield-heart"></i>
                Premium Medical Concierge
              </span>

              <h1 className={`${styles.h1} serif`}>
                Discover the True Price <br />
                of Gangnam Beauty.
              </h1>

              <p className={styles.lead}>
                Transparent pricing from the top clinics in Korea. Compare trending procedures, see top clinics, and redeem loyalty rewards.
              </p>

              <div className={styles.heroActions}>
                <a href="#prices" className={styles.btnPrimary}>
                  <i className="fa-solid fa-list"></i> View Price List
                </a>
                <a href="#benefits" className={styles.btnGhost}>
                  <i className="fa-solid fa-ticket"></i> Loyalty Program
                </a>
              </div>
            </div>

            <div className={styles.heroPanel}>
              <div className={styles.metricRow}>
                <div className={styles.metricIcon}>
                  <i className="fa-solid fa-chart-line"></i>
                </div>
                <div>
                  <p className={styles.metricTitle}>Monthly Trends</p>
                  <p className={styles.metricText}>Top 5 procedures auto-highlighted from your Supabase ranking.</p>
                </div>
              </div>

              <div className={styles.metricRow}>
                <div className={styles.metricIcon}>
                  <i className="fa-solid fa-hand-holding-heart"></i>
                </div>
                <div>
                  <p className={styles.metricTitle}>Transparent Pricing</p>
                  <p className={styles.metricText}>KRW / USD toggle with a fixed exchange rate (editable).</p>
                </div>
              </div>

              <div className={styles.metricRow}>
                <div className={styles.metricIcon}>
                  <i className="fa-solid fa-stamp"></i>
                </div>
                <div>
                  <p className={styles.metricTitle}>Loyalty Rewards</p>
                  <p className={styles.metricText}>Collect stamps at partner clinics and unlock free procedures.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 1) Loyalty */}
      <section id="benefits" className={`${styles.section} ${styles.sectionAlt}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={`${styles.title} serif`}>Loyalty Program</h2>
              <p className={styles.subtitle}>Collect 10 stamps to get a free procedure.</p>
            </div>
            <span className={`${styles.pill} ${styles.pillBrand}`}>
              <i className="fa-solid fa-stamp"></i> My Stamps
            </span>
          </div>

          <div className={styles.card}>
            <div className={styles.cardInner}>
              <div className={styles.loyaltyTop}>
                <div>
                  <div style={{ fontWeight: 1000, fontSize: 14 }}>Visit any partner clinic to earn stamps.</div>
                  <div style={{ color: 'rgba(255,255,255,0.62)', fontSize: 13, marginTop: 4 }}>Redeem after 10 visits.</div>
                </div>
                <div className={styles.stampCount}>
                  {currentStamps} / {MAX_STAMPS}
                </div>
              </div>

              <div className={styles.stampsGrid}>
                {Array.from({ length: MAX_STAMPS }).map((_, idx) => (
                  <div key={idx} className={`${styles.stamp} ${idx < currentStamps ? styles.stampOn : ''}`}>
                    {idx < currentStamps ? <i className="fa-solid fa-check"></i> : idx + 1}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                {currentStamps >= MAX_STAMPS ? (
                  <button className={styles.rewardBtn}>
                    <i className="fa-solid fa-gift"></i> Select Free Procedure
                  </button>
                ) : (
                  <div className={styles.rewardBox}>
                    <strong style={{ color: 'rgba(255,255,255,0.90)' }}>
                      {MAX_STAMPS - currentStamps} more visits
                    </strong>{' '}
                    needed for a free reward.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2) Trending */}
      <section id="ranking" className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={`${styles.title} serif`}>Trending Now</h2>
              <p className={styles.subtitle}>Most requested procedures this month.</p>
            </div>

            <div className={styles.controlsRow}>
              <button className={styles.detailBtn} onClick={() => scrollSlider(-1)} aria-label="Scroll left">
                <i className="fa-solid fa-arrow-left"></i>
              </button>
              <button className={styles.detailBtn} onClick={() => scrollSlider(1)} aria-label="Scroll right">
                <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </div>

          <div className={styles.sliderWrap}>
            <div className={styles.sliderTrack} id="trendSlider">
              {trendingProcedures.map((proc) => (
                <Link href={`/procedures/${proc.id}`} key={proc.id}>
                  <article className={styles.trendCard}>
                    <div>
                      <div className={styles.trendTop}>
                        <div className={styles.rankTag}>Rank 0{proc.rank}</div>
                        {proc.is_hot && <span className={styles.badgeHot}>HOT</span>}
                      </div>

                      <h3 className={styles.trendTitle}>{proc.name}</h3>
                      <p className={styles.trendDesc}>{proc.description}</p>
                    </div>

                    <div className={styles.trendBottom}>
                      <span style={{ color: 'rgba(255,255,255,0.62)', fontSize: 12 }}>Avg. Price</span>
                      <span className={`${styles.priceStrong} serif`}>{getPrice(proc.price_krw)}</span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3) Prices (table -> mobile cards) */}
      <section id="prices" className={`${styles.section} ${styles.sectionAlt}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={`${styles.title} serif`}>Official Price List</h2>
              <p className={styles.subtitle}>Desktop table, mobile auto-cards. Paginated (10 per page).</p>
            </div>

            <div className={styles.controlsRow}>
              <div className={styles.toggle} role="tablist" aria-label="Currency toggle">
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

              <span className={`${styles.pill} ${styles.pillCyan}`}>
                <i className="fa-solid fa-layer-group"></i> {procedures.length} Procedures
              </span>
            </div>
          </div>

          <div className={styles.tableShell}>
            {/* Desktop table */}
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th style={{ width: 84 }}>Rank</th>
                  <th>Procedure</th>
                  <th>Top Clinics</th>
                  <th style={{ width: 160 }}>Gangnam Price</th>
                  <th style={{ width: 120 }}>Action</th>
                </tr>
              </thead>

              <tbody>
                {currentItems.map((proc) => {
                  const displayedClinics = proc.clinics ? proc.clinics.slice(0, 2) : [];
                  const extraCount = proc.clinics ? proc.clinics.length - 2 : 0;

                  return (
                    <tr key={proc.id} className={styles.trow}>
                      <td style={{ fontWeight: 1000, color: 'rgba(255,255,255,0.55)' }}>{proc.rank}</td>
                      <td>
                        <div className={styles.procName}>{proc.name}</div>
                        <div className={styles.procMeta}>{proc.category}</div>
                      </td>
                      <td>
                        {displayedClinics.length > 0 ? (
                          <div className={styles.clinicList}>
                            {displayedClinics.map((c, i) => (
                              <div key={i} className={styles.clinicItem}>
                                <i className="fa-solid fa-hospital" style={{ color: 'var(--brand)' }}></i>
                                {c.split(':')[0]}
                              </div>
                            ))}
                            {extraCount > 0 && <div className={styles.moreHint}>+ {extraCount} more</div>}
                          </div>
                        ) : (
                          <span style={{ color: 'rgba(255,255,255,0.35)' }}>-</span>
                        )}
                      </td>
                      <td className={`${styles.priceStrong} serif`}>{getPrice(proc.price_krw)}</td>
                      <td>
                        <Link href={`/procedures/${proc.id}`}>
                          <button className={styles.detailBtn} type="button">
                            DETAILS
                          </button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile cards (auto via CSS) */}
            <div className={styles.mobileCards}>
              {currentItems.map((proc) => {
                const displayedClinics = proc.clinics ? proc.clinics.slice(0, 2) : [];
                const extraCount = proc.clinics ? proc.clinics.length - 2 : 0;

                return (
                  <div key={proc.id} className={styles.priceCard}>
                    <div className={styles.priceCardTop}>
                      <div>
                        <h3 className={styles.priceCardTitle}>
                          #{proc.rank} · {proc.name} {proc.is_hot && <span className={styles.badgeHot} style={{ marginLeft: 8 }}>HOT</span>}
                        </h3>
                        <div className={styles.priceCardMeta}>{proc.category}</div>
                      </div>
                      <div className={`${styles.priceCardPrice} serif`}>{getPrice(proc.price_krw)}</div>
                    </div>

                    <div className={styles.priceCardClinics}>
                      {displayedClinics.length > 0 ? (
                        <>
                          {displayedClinics.map((c, i) => (
                            <div key={i} className={styles.clinicItem}>
                              <i className="fa-solid fa-hospital" style={{ color: 'var(--brand)' }}></i>
                              {c.split(':')[0]}
                            </div>
                          ))}
                          {extraCount > 0 && <div className={styles.moreHint}>+ {extraCount} more</div>}
                        </>
                      ) : (
                        <div style={{ color: 'rgba(255,255,255,0.35)' }}>No clinic list</div>
                      )}
                    </div>

                    <div className={styles.priceCardActions}>
                      <Link href={`/procedures/${proc.id}`}>
                        <button className={styles.detailBtn} type="button">DETAILS</button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className={styles.pagination}>
              <button className={styles.pageBtn} onClick={handlePrevPage} disabled={currentPage === 1} type="button">
                <i className="fa-solid fa-chevron-left"></i> Prev
              </button>

              <div className={styles.pageInfo}>
                Page {currentPage} of {totalPages}
              </div>

              <button className={styles.pageBtn} onClick={handleNextPage} disabled={currentPage === totalPages} type="button">
                Next <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4) Partners */}
      <section id="partners" className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={`${styles.title} serif`} style={{ color: 'var(--brand)' }}>Free Pass Clinics</h2>
              <p className={styles.subtitle}>
                Exclusive Benefit: redeem your free procedure at these partner clinics.
              </p>
            </div>
            <span className={`${styles.pill} ${styles.pillBrand}`}>
              <i className="fa-solid fa-ticket"></i> FREE PASS
            </span>
          </div>

          <div className={styles.partnerGrid}>
            {PARTNERS.map((partner, idx) => (
              <div key={idx} className={styles.partnerCard}>
                <div className={`${styles.pill} ${styles.pillBrand} ${styles.partnerTag}`}>
                  FREE PASS
                </div>

                <div className={styles.partnerIcon}>
                  <i className="fa-solid fa-hospital"></i>
                </div>

                <h3 className={styles.partnerName}>{partner.name}</h3>
                <p className={styles.partnerMeta}>{partner.category}</p>

                <div className={styles.partnerLoc}>
                  <i className="fa-solid fa-location-dot" style={{ marginRight: 6 }}></i>
                  {partner.location}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={`${styles.footerBrand} serif`}>
            K-Beauty <span style={{ fontStyle: 'italic', color: 'var(--brand)' }}>Insider</span>
          </div>
          <div style={{ fontSize: 13 }}>
            &copy; 2026 K-Beauty Insider. Gangnam, Seoul.
          </div>
        </div>
      </footer>
    </div>
  );
}
