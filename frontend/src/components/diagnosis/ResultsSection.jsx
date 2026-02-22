import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { motion } from 'framer-motion';

const cardVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    }),
};

const TriageBadge = ({ level }) => {
    if (!level) return null;
    return (
        <span className={`triage-badge triage-badge--${level}`}>
            <span className="triage-badge__dot" />
            {level}
        </span>
    );
};

const ResultsSection = () => {
    const { results, resetDiagnosis } = useApp();
    const sectionRef = useRef(null);

    useEffect(() => {
        if (results && sectionRef.current) {
            setTimeout(() => sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
        }
    }, [results]);

    if (!results) return null;

    const isNoTumor = results.diagnosis === 'No Tumor Detected';

    const exportReport = () => {
        const d = results;
        const text = [
            '╔═══════════════════════════════════════════╗',
            '║       BRAINGEMMA DIAGNOSTIC REPORT        ║',
            '╚═══════════════════════════════════════════╝',
            `Generated : ${new Date().toLocaleString()}`,
            `Triage    : ${d.triage ?? 'N/A'}`,
            '',
            `DIAGNOSIS    : ${d.diagnosis}`,
            `TUMOR TYPE   : ${d.tumor_type}`,
            `GRADE        : ${d.grade}`,
            `CONFIDENCE   : ${d.confidence}%`,
            `LOCATION     : ${d.location}`,
            `MODALITIES   : ${d.modalities_used.join(', ')}`,
            '',
            '─── CLINICAL FINDINGS ───────────────────────',
            d.findings,
            '',
            '─── RECOMMENDATIONS ─────────────────────────',
            ...d.recommendations.map((r, i) => `  ${i + 1}. ${r}`),
            '',
            '─── DIFFERENTIAL DIAGNOSIS ──────────────────',
            ...d.differential.map((x) => `  ${x.label}: ${x.probability}%`),
            '',
            `Inference Time : ${d.inference_ms}ms`,
            '',
            '⚠  THIS IS NOT FOR CLINICAL USE — Research/Hackathon Demo',
        ].join('\n');

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `braingemma-report-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <section className="results-section section" id="results-section" ref={sectionRef}>
            <div className="section__inner">
                <div className="section__label">STEP 02 / DIAGNOSTIC REPORT</div>
                <h2 className="section__heading">AI Analysis Complete</h2>

                {/* Status banner */}
                <motion.div
                    initial={{ scaleX: 0, originX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="status-banner"
                    style={{
                        borderColor: isNoTumor ? 'var(--c-teal)' : 'var(--c-teal)',
                    }}
                >
                    <span className="status-banner__icon" aria-hidden="true">⬡</span>
                    <span className="status-banner__text">
                        {isNoTumor
                            ? 'No tumor detected — full findings below'
                            : `${results.tumor_type} — ${results.grade}`}
                    </span>
                    <TriageBadge level={results.triage} />
                    {results.inference_ms > 0 && (
                        <span className="status-banner__time">{results.inference_ms}ms</span>
                    )}
                </motion.div>

                {/* Report grid */}
                <div className="report-grid">
                    <motion.div
                        custom={0} variants={cardVariants} initial="hidden" animate="visible"
                        className="report-card report-card--primary"
                    >
                        <div className="report-card__label">PRIMARY DIAGNOSIS</div>
                        <div className="report-card__value">{results.diagnosis}</div>
                        <div className="report-card__sub">{results.tumor_type}</div>
                    </motion.div>

                    <motion.div
                        custom={1} variants={cardVariants} initial="hidden" animate="visible"
                        className="report-card"
                    >
                        <div className="report-card__label">CONFIDENCE</div>
                        <div className="confidence-meter">
                            <div
                                style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '2rem',
                                    fontWeight: 700,
                                    color: 'var(--c-teal)',
                                    lineHeight: 1,
                                    marginBottom: '8px',
                                }}
                            >
                                {results.confidence}%
                            </div>
                            <div className="confidence-meter__track">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${results.confidence}%` }}
                                    transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                    className="confidence-meter__fill"
                                />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        custom={2} variants={cardVariants} initial="hidden" animate="visible"
                        className="report-card"
                    >
                        <div className="report-card__label">GRADE</div>
                        <div className="report-card__value" style={{ fontSize: '1rem', fontWeight: 500 }}>
                            {results.grade}
                        </div>
                    </motion.div>

                    <motion.div
                        custom={3} variants={cardVariants} initial="hidden" animate="visible"
                        className="report-card"
                    >
                        <div className="report-card__label">LOCATION</div>
                        <div className="report-card__value" style={{ fontSize: '1rem', fontWeight: 500 }}>
                            {results.location}
                        </div>
                        <div className="modality-tags" style={{ marginTop: '8px' }}>
                            {results.modalities_used.map((m) => (
                                <span key={m} className="modality-tag">{m}</span>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        custom={4} variants={cardVariants} initial="hidden" animate="visible"
                        className="report-card report-card--wide"
                    >
                        <div className="report-card__label">CLINICAL FINDINGS</div>
                        <p className="report-card__body">{results.findings}</p>
                    </motion.div>

                    <motion.div
                        custom={5} variants={cardVariants} initial="hidden" animate="visible"
                        className="report-card report-card--wide"
                    >
                        <div className="report-card__label">RECOMMENDATIONS</div>
                        <ul className="report-recommendations">
                            {results.recommendations.map((r, i) => (
                                <li key={i}>{r}</li>
                            ))}
                        </ul>
                    </motion.div>

                    <motion.div
                        custom={6} variants={cardVariants} initial="hidden" animate="visible"
                        className="report-card report-card--wide"
                    >
                        <div className="report-card__label">DIFFERENTIAL DIAGNOSIS</div>
                        <div className="differential-list">
                            {results.differential.map((item, i) => (
                                <div
                                    key={item.label}
                                    className={`differential-item ${i === 0 ? 'differential-item--primary' : ''}`}
                                >
                                    <span className="differential-item__label">{item.label}</span>
                                    <div className="differential-item__bar-track">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${item.probability}%` }}
                                            transition={{ duration: 1, delay: 0.8 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                                            className="differential-item__bar-fill"
                                        />
                                    </div>
                                    <span className="differential-item__pct">{item.probability}%</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Actions */}
                <div className="report-actions">
                    <button className="btn btn--secondary" id="export-report-btn" onClick={exportReport}>
                        Export Report
                        <span className="btn__arrow" aria-hidden="true">↓</span>
                    </button>
                    <button className="btn btn--ghost" id="new-diagnosis-btn" onClick={resetDiagnosis}>
                        New Diagnosis
                    </button>
                </div>
            </div>
        </section>
    );
};

export default ResultsSection;
