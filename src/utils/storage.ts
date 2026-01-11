import type { TrackerState } from '../types';

const STORAGE_KEY = 'great12_data';

export const loadState = (): TrackerState | null => {
    try {
        const serializedState = localStorage.getItem(STORAGE_KEY);
        if (serializedState === null) {
            return null;
        }
        return JSON.parse(serializedState);
    } catch (err) {
        console.error('Failed to load state:', err);
        return null;
    }
};

export const saveState = (state: TrackerState) => {
    try {
        const serializedState = JSON.stringify(state);
        localStorage.setItem(STORAGE_KEY, serializedState);
    } catch (err) {
        console.error('Failed to save state:', err);
    }
};

export const clearState = () => {
    localStorage.removeItem(STORAGE_KEY);
}
