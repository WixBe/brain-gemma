import React, { useRef } from 'react';

const Dropzone = ({ id, label, description, hint, files, onFilesAdded, onFileRemoved, accept }) => {
    const inputRef = useRef(null);

    // ── Bug Fix: Only the div's onClick triggers the input click.
    // The <input> is hidden (display:none) so it can never receive pointer events
    // directly — eliminating the event-bubbling double-open bug.
    const handleClick = () => inputRef.current?.click();

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.currentTarget.classList.add('is-dragover');
    };

    const handleDragLeave = (e) => {
        e.currentTarget.classList.remove('is-dragover');
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('is-dragover');
        const newFiles = Array.from(e.dataTransfer.files);
        if (newFiles.length > 0) onFilesAdded(newFiles);
    };

    const handleInputChange = (e) => {
        const newFiles = Array.from(e.target.files);
        if (newFiles.length > 0) onFilesAdded(newFiles);
        e.target.value = '';
    };

    const formatBytes = (bytes) => {
        if (bytes < 1024) return `${bytes}B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    };

    const hasFiles = files.length > 0;

    return (
        <div className="upload-card" id={`${id}-upload-card`}>
            <div className="upload-card__header">
                <span className="upload-card__modality">{label}</span>
                <span className="upload-card__desc">{description}</span>
            </div>

            <div
                className={`dropzone ${hasFiles ? 'has-files' : ''}`}
                id={`${id}-dropzone`}
                role="button"
                tabIndex={0}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                aria-label={`Drop ${label} scan files here or click to browse`}
            >
                {/* Hidden input — display:none so it never intercepts pointer events */}
                <input
                    type="file"
                    id={`${id}-file-input`}
                    style={{ display: 'none' }}
                    multiple
                    accept={accept}
                    ref={inputRef}
                    onChange={handleInputChange}
                />

                <div className="dropzone__icon" aria-hidden="true">
                    {hasFiles ? (
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                            <rect x="1" y="1" width="38" height="38" stroke="#00C2A8" strokeWidth="1" />
                            <path d="M13 20L18 25L27 15" stroke="#00C2A8" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    ) : (
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                            <rect x="1" y="1" width="38" height="38" stroke="#00C2A8" strokeWidth="1" />
                            <path d="M20 12V28M13 20H27" stroke="#00C2A8" strokeWidth="1.5" />
                        </svg>
                    )}
                </div>

                <p className="dropzone__text">
                    {hasFiles ? `${files.length} file${files.length > 1 ? 's' : ''} selected` : `Drop ${label} files here`}
                </p>
                <p className="dropzone__hint">{hasFiles ? 'Click to add more' : hint}</p>
            </div>

            {hasFiles && (
                <div className="dropzone__files" aria-live="polite" aria-label={`${label} files`}>
                    {files.map((file, idx) => (
                        <div key={`${file.name}-${idx}`} className="file-badge">
                            <span className="file-badge__name" title={file.name}>{file.name}</span>
                            <span className="file-badge__size">{formatBytes(file.size)}</span>
                            <button
                                className="file-badge__remove"
                                aria-label={`Remove ${file.name}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onFileRemoved(idx);
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dropzone;
