import React from 'react';

const Footer = () => {
    return (
        <footer className="footer" role="contentinfo">
            <div className="footer__inner">
                <div className="footer__brand">
                    <span aria-hidden="true">⬡</span> BrainGemma
                </div>
                <div className="footer__note">
                    Research/Hackathon Demo · Not for clinical use · Built on MedGemma 1.5 (Google)
                </div>
                <div className="footer__badges">
                    <span className="badge">OPEN SOURCE</span>
                    <span className="badge">CC BY 4.0</span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
