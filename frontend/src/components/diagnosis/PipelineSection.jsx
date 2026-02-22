import React from 'react';

const PipelineSection = () => {
    return (
        <section className="about-section section" id="about-section" aria-labelledby="about-heading">
            <div className="section__inner">
                <div className="section__label">TECHNOLOGY</div>
                <h2 className="section__heading" id="about-heading">How BrainGemma Works</h2>

                <div className="pipeline">
                    <div className="pipeline__step">
                        <div className="pipeline__num">01</div>
                        <div className="pipeline__content">
                            <div className="pipeline__title">Multimodal Ingestion</div>
                            <div className="pipeline__desc">CT and MRI slices are loaded, normalized, and aligned. DICOM metadata is parsed to determine modality and slice orientation.</div>
                        </div>
                    </div>
                    <div className="pipeline__connector" aria-hidden="true"></div>
                    <div className="pipeline__step">
                        <div className="pipeline__num">02</div>
                        <div className="pipeline__content">
                            <div className="pipeline__title">MedGemma Inference</div>
                            <div className="pipeline__desc">Google's MedGemma 1.5 (4B params), fine-tuned on 5-fold cross-validated Kaggle brain-tumor datasets, processes both modalities simultaneously.</div>
                        </div>
                    </div>
                    <div className="pipeline__connector" aria-hidden="true"></div>
                    <div className="pipeline__step">
                        <div className="pipeline__num">03</div>
                        <div className="pipeline__content">
                            <div className="pipeline__title">Report Generation</div>
                            <div className="pipeline__desc">The model's generative backbone produces a structured clinical report: diagnosis, grade, location, findings, and actionable recommendations.</div>
                        </div>
                    </div>
                </div>

                <div className="data-note">
                    <span className="data-note__icon" aria-hidden="true">⬡</span>
                    <p className="data-note__text">No patient data is stored. All processing is ephemeral. Communications are encrypted via TLS. HIPAA-aligned design.</p>
                </div>
            </div>
        </section>
    );
};

export default PipelineSection;
