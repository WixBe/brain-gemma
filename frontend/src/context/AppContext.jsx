import React, { createContext, useContext, useState } from 'react';
import { callDiagnose } from '../api/mock';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [ctFiles, setCtFiles] = useState([]);
    const [mriFiles, setMriFiles] = useState([]);
    const [clinicalContext, setClinicalContext] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState(null);

    const runDiagnosis = async () => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            const data = await callDiagnose({
                ctFiles,
                mriFiles,
                clinicalContext,
            });
            setResults(data);
            return data;
        } catch (error) {
            console.error('Diagnosis failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const resetDiagnosis = () => {
        setCtFiles([]);
        setMriFiles([]);
        setClinicalContext('');
        setResults(null);
        setIsLoading(false);
    };

    const value = {
        ctFiles,
        setCtFiles,
        mriFiles,
        setMriFiles,
        clinicalContext,
        setClinicalContext,
        isLoading,
        results,
        runDiagnosis,
        resetDiagnosis,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
