import React from 'react';

const Header = () => {
    return (
        <header className="header" role="banner">
            <div className="header__inner">
                <div className="header__brand">
                    <span className="header__icon" aria-hidden="true">⬡</span>
                    <span className="header__name">BrainGemma</span>
                    <span className="header__tag">v0.1 · REACT</span>
                </div>
                <nav className="header__nav" aria-label="Primary navigation">
                    <a href="#upload-section" className="header__nav-link">Diagnose</a>
                    <a href="#about-section" className="header__nav-link">About</a>
                    <span className="header__status" id="api-status" aria-live="polite">
                        <span className="header__status-dot" aria-hidden="true"></span>
                        MOCK MODE
                    </span>
                </nav>
            </div>
        </header>
    );
};

export default Header;
