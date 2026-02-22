import React from 'react';
import { motion } from 'framer-motion';

const Hero = () => {
    return (
        <section className="hero" aria-labelledby="hero-heading">
            <div className="hero__inner">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="hero__label"
                >
                    MEDGEMMA 1.5 · MULTIMODAL · 4B PARAMETERS
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="hero__heading"
                    id="hero-heading"
                >
                    Brain Tumor<br />
                    <span className="hero__heading--accent">Diagnosis.</span><br />
                    Reimagined.
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.35 }}
                    className="hero__subtext"
                >
                    Upload CT + MRI scans. Receive a probabilistic diagnosis,<br />
                    tumor classification, and clinical report in seconds.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="hero__metrics"
                    role="list"
                    aria-label="Key performance indicators"
                >
                    <div className="hero__metric" role="listitem">
                        <span className="hero__metric-value">≥97%</span>
                        <span className="hero__metric-label">Accuracy</span>
                    </div>
                    <div className="hero__metric-divider" aria-hidden="true">|</div>
                    <div className="hero__metric" role="listitem">
                        <span className="hero__metric-value">&lt;1s</span>
                        <span className="hero__metric-label">Response</span>
                    </div>
                    <div className="hero__metric-divider" aria-hidden="true">|</div>
                    <div className="hero__metric" role="listitem">
                        <span className="hero__metric-value">CT + MRI</span>
                        <span className="hero__metric-label">Multimodal</span>
                    </div>
                </motion.div>

                <motion.a
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.7 }}
                    href="#upload-section"
                    className="btn btn--primary btn--lg"
                    id="hero-cta"
                >
                    Start Diagnosis
                    <span className="btn__arrow" aria-hidden="true">→</span>
                </motion.a>
            </div>

            {/* Decorative scan grid */}
            <div className="hero__scan-grid" aria-hidden="true">
                {[...Array(9)].map((_, i) => (
                    <div
                        key={i}
                        className={`scan-cell ${[0, 3, 5, 8].includes(i) ? 'scan-cell--active' : ''}`}
                    ></div>
                ))}
            </div>
        </section>
    );
};

export default Hero;
