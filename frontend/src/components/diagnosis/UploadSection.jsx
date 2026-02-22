import React from 'react';
import { useApp } from '../../context/AppContext';
import Dropzone from '../ui/Dropzone';

const UploadSection = () => {
    const {
        ctFiles, setCtFiles,
        mriFiles, setMriFiles,
        clinicalContext, setClinicalContext,
        isLoading, runDiagnosis
    } = useApp();

    const handleCtFilesAdded = (files) => setCtFiles([...ctFiles, ...files]);
    const handleMriFilesAdded = (files) => setMriFiles([...mriFiles, ...files]);

    const handleCtFileRemoved = (idx) => {
        const newFiles = [...ctFiles];
        newFiles.splice(idx, 1);
        setCtFiles(newFiles);
    };

    const handleMriFileRemoved = (idx) => {
        const newFiles = [...mriFiles];
        newFiles.splice(idx, 1);
        setMriFiles(newFiles);
    };

    const hasFiles = ctFiles.length > 0 || mriFiles.length > 0;

    return (
        <section className="upload-section section" id="upload-section" aria-labelledby="upload-heading">
            <div className="section__inner">
                <div className="section__label">STEP 01 / UPLOAD SCANS</div>
                <h2 className="section__heading" id="upload-heading">Provide Patient Imaging</h2>

                <div className="upload-grid">
                    <Dropzone
                        id="ct"
                        label="CT"
                        description="Computed Tomography"
                        hint=".DCM / .NII / .PNG / .JPG · up to 500MB"
                        files={ctFiles}
                        onFilesAdded={handleCtFilesAdded}
                        onFileRemoved={handleCtFileRemoved}
                        accept=".dcm,.nii,.nii.gz,.png,.jpg,.jpeg"
                    />

                    <div className="upload-separator" aria-hidden="true">
                        <div className="upload-separator__line"></div>
                        <div className="upload-separator__label">+</div>
                        <div className="upload-separator__line"></div>
                    </div>

                    <Dropzone
                        id="mri"
                        label="MRI"
                        description="Magnetic Resonance Imaging"
                        hint=".DCM / .NII / .PNG / .JPG · up to 500MB"
                        files={mriFiles}
                        onFilesAdded={handleMriFilesAdded}
                        onFileRemoved={handleMriFileRemoved}
                        accept=".dcm,.nii,.nii.gz,.png,.jpg,.jpeg"
                    />
                </div>

                <div className="context-block">
                    <label className="context-block__label" htmlFor="patient-context">
                        CLINICAL CONTEXT <span className="context-block__optional">(Optional)</span>
                    </label>
                    <textarea
                        className="context-block__textarea"
                        id="patient-context"
                        placeholder="Patient age, symptoms, prior history, relevant clinical notes..."
                        rows="3"
                        value={clinicalContext}
                        onChange={(e) => setClinicalContext(e.target.value)}
                        aria-label="Optional clinical context for the AI model"
                    ></textarea>
                </div>

                <div className="submit-row">
                    <button
                        className={`btn btn--primary btn--xl ${isLoading ? 'is-loading' : ''}`}
                        id="run-diagnosis-btn"
                        disabled={!hasFiles || isLoading}
                        onClick={runDiagnosis}
                    >
                        <span className="btn__text">Run Diagnosis</span>
                        <span className="btn__loader" aria-hidden="true"></span>
                        <span className="btn__arrow" aria-hidden="true">→</span>
                    </button>
                    <p className="submit-hint" id="submit-hint">
                        {isLoading
                            ? 'Running inference — please wait…'
                            : hasFiles
                                ? `${ctFiles.length} CT · ${mriFiles.length} MRI file(s) ready`
                                : 'Upload at least one scan to enable diagnosis'}
                    </p>
                </div>
            </div>
        </section>
    );
};

export default UploadSection;
