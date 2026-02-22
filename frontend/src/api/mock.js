/**
 * BrainGemma Mock API
 * Simulates the /diagnose endpoint response while the real backend is in development.
 * Replace BASE_URL and remove mock flag when backend is ready.
 */

export const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    MOCK_MODE: import.meta.env.VITE_MOCK_MODE !== 'false',  // true unless explicitly set to 'false'
    MOCK_DELAY_MS: 2400,     // Simulates real inference time
};

/** @typedef {Object} DiagnoseRequest
 * @property {File[]} ctFiles
 * @property {File[]} mriFiles
 * @property {string} [clinicalContext]
 */

/** @typedef {Object} DiagnoseResponse
 * @property {string} diagnosis
 * @property {string} tumor_type
 * @property {string} grade
 * @property {number} confidence
 * @property {string} location
 * @property {string[]} modalities_used
 * @property {string} findings
 * @property {string[]} recommendations
 * @property {{ label: string, probability: number }[]} differential
 * @property {number} inference_ms
 */

const MOCK_RESPONSES = [
    {
        diagnosis: 'High-Grade Glioma',
        tumor_type: 'Glioblastoma Multiforme (GBM)',
        grade: 'Grade IV — WHO Classification',
        confidence: 94,
        location: 'Left Frontal Lobe',
        modalities_used: ['CT', 'MRI'],
        findings:
            'MRI demonstrates an irregular, heterogeneously enhancing mass in the left frontal lobe measuring approximately 4.2 × 3.8 cm with surrounding vasogenic edema. CT confirms hyperdense lesion with central necrosis. Mass effect with midline shift of ~3mm noted.',
        recommendations: [
            'Urgent referral to neuro-oncology for multidisciplinary evaluation.',
            'Stereotactic biopsy or maximal safe surgical resection to confirm histopathology.',
            'Consider concurrent chemoradiotherapy (Stupp protocol: TMZ + RT) post-surgery.',
            'MRS and perfusion MRI recommended for metabolic characterization.',
            'Genetic profiling (IDH, MGMT methylation) critical for treatment stratification.',
        ],
        differential: [
            { label: 'Glioblastoma (GBM)', probability: 94 },
            { label: 'Metastatic Lesion', probability: 4 },
            { label: 'Anaplastic Astrocytoma', probability: 2 },
        ],
        inference_ms: 847,
    },
    {
        diagnosis: 'Meningioma',
        tumor_type: 'Typical Meningioma',
        grade: 'Grade I — WHO Classification',
        confidence: 89,
        location: 'Right Parietal Convexity',
        modalities_used: ['MRI'],
        findings:
            'MRI shows a well-circumscribed, homogeneously enhancing extra-axial mass along the right parietal convexity with a broad dural base, measuring 2.9 × 2.4 cm. No surrounding edema. "Dural tail" sign present. CT confirms calcium deposits within the mass.',
        recommendations: [
            'Neurosurgical consultation for assessment of resectability (Simpson grade).',
            'If asymptomatic and small, watchful waiting with serial MRI every 6 months is acceptable.',
            'Surgical excision recommended if causing neurological symptoms or rapid growth.',
            'Stereotactic radiosurgery (Gamma Knife) as alternative for inaccessible lesions.',
            'Annual follow-up imaging post-resection to monitor for recurrence.',
        ],
        differential: [
            { label: 'Meningioma (Grade I)', probability: 89 },
            { label: 'Hemangiopericytoma', probability: 7 },
            { label: 'Dural Metastasis', probability: 4 },
        ],
        inference_ms: 612,
    },
    {
        diagnosis: 'No Tumor Detected',
        tumor_type: '—',
        grade: 'N/A',
        confidence: 97,
        location: 'N/A',
        modalities_used: ['CT', 'MRI'],
        findings:
            'No intracranial mass lesion, abnormal enhancement, or midline shift identified on CT or MRI. White matter signal within normal limits for patient age. No restricted diffusion. Ventricles normal in size and configuration.',
        recommendations: [
            'Clinical correlation with presenting symptoms is advised.',
            'If headaches or neurological symptoms persist, consider EEG or lumbar puncture.',
            'Routine follow-up imaging in 12 months if clinically indicated.',
            'Consult neurology for assessment of non-imaging causes.',
            'Review imaging with a specialist radiologist if doubts persist.',
        ],
        differential: [
            { label: 'Normal Study', probability: 97 },
            { label: 'Very Small Lesion (<5mm)', probability: 2 },
            { label: 'Artifact / Motion', probability: 1 },
        ],
        inference_ms: 523,
    },
];

/**
 * Call the diagnose endpoint (mock or real).
 * @param {DiagnoseRequest} req
 * @returns {Promise<DiagnoseResponse>}
 */
export async function callDiagnose(req) {
    if (API_CONFIG.MOCK_MODE) {
        return _mockDiagnose(req);
    }
    return _realDiagnose(req);
}

async function _mockDiagnose(req) {
    await _sleep(API_CONFIG.MOCK_DELAY_MS);
    const idx = Math.floor(Math.random() * MOCK_RESPONSES.length);
    const result = structuredClone(MOCK_RESPONSES[idx]);

    // Reflect actual uploaded modalities
    const used = [];
    if (req.ctFiles.length > 0) used.push('CT');
    if (req.mriFiles.length > 0) used.push('MRI');
    if (used.length > 0) result.modalities_used = used;

    return result;
}

async function _realDiagnose(req) {
    const form = new FormData();
    req.ctFiles.forEach((f) => form.append('ct', f));
    req.mriFiles.forEach((f) => form.append('mri', f));
    if (req.clinicalContext) form.append('context', req.clinicalContext);

    // brain-gemma routes under /api/v1/
    const res = await fetch(`${API_CONFIG.BASE_URL}/api/v1/diagnose`, {
        method: 'POST',
        body: form,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(err.detail || `HTTP ${res.status}`);
    }

    return res.json();
}

function _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
