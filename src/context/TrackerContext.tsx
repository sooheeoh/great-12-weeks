import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Action, Goal, TrackerState, WeekData } from '../types';
import { supabase } from '../lib/supabase';
import { addWeeks, startOfWeek } from 'date-fns';
import type { Session } from '@supabase/supabase-js';



interface TrackerContextType {
    state: TrackerState;
    session: Session | null;
    loading: boolean;
    startNewCycle: (goals: Goal[], startDate: Date) => void;
    addAction: (weekNumber: number, goalId: string, title: string) => void;
    toggleAction: (weekNumber: number, actionId: string) => void;
    deleteAction: (weekNumber: number, actionId: string) => void;
    resetData: () => void;
    handleLogout: () => void;
}

const TrackerContext = createContext<TrackerContextType | undefined>(undefined);

const INITIAL_STATE: TrackerState = {
    startDate: null,
    goals: [],
    weeks: {},
    isSetupComplete: false,
};

// ... QUOTES array ...
const QUOTES = [
    "The only way to do great work is to love what you do.",
    "Believe you can and you're halfway there.",
    "Your time is limited, don't waste it living someone else's life.",
    "Don't watch the clock; do what it does. Keep going.",
    "The future depends on what you do today.",
    "It does not matter how slowly you go as long as you do not stop.",
    "Everything you’ve ever wanted is on the other side of fear.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "Hardships often prepare ordinary people for an extraordinary destiny.",
    "Dream big and dare to fail.",
    "What you get by achieving your goals is not as important as what you become by achieving your goals.",
    "The best way to predict the future is to create it."
];

export const TrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<TrackerState>(INITIAL_STATE);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeCycleId, setActiveCycleId] = useState<string | null>(null);

    // 1. Auth Listener
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            fetchUserData(session);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (_event === 'SIGNED_IN') fetchUserData(session);
            if (_event === 'SIGNED_OUT') {
                setState(INITIAL_STATE);
                setActiveCycleId(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // 2. Fetch User Data from Supabase
    const fetchUserData = async (currentSession: Session | null) => {
        if (!currentSession) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            // Fetch latest active cycle
            const { data: cycles, error: cycleError } = await supabase
                .from('cycles')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1);

            if (cycleError) throw cycleError;

            if (cycles && cycles.length > 0) {
                const cycle = cycles[0];
                setActiveCycleId(cycle.id);

                // Fetch Goals
                const { data: goals } = await supabase.from('goals').select('*').eq('cycle_id', cycle.id);

                // Fetch Actions
                const { data: actions } = await supabase.from('actions').select('*').eq('cycle_id', cycle.id);

                // Reconstruct State
                // Calculate weeks structure
                const start = new Date(cycle.start_date);
                const weeks: Record<number, WeekData> = {};
                for (let i = 1; i <= 12; i++) {
                    const weekStart = addWeeks(start, i - 1);
                    const weekEnd = addWeeks(weekStart, 1);
                    weeks[i] = {
                        weekNumber: i,
                        startDate: weekStart.toISOString(),
                        endDate: weekEnd.toISOString(),
                        quote: QUOTES[i - 1] || "Keep going!",
                        actions: (actions || []).filter((a: any) => a.week_number === i).map((a: any) => ({
                            id: a.id,
                            goalId: a.goal_id,
                            title: a.title,
                            isCompleted: a.is_completed,
                            createdAt: a.created_at
                        }))
                    };
                }

                setState({
                    startDate: cycle.start_date,
                    goals: (goals || []).map((g: any) => ({
                        id: g.id,
                        title: g.title,
                        description: g.description,
                        createdAt: g.created_at
                    })),
                    weeks: weeks,
                    isSetupComplete: true
                });
            } else {
                // No Data found
                setState(INITIAL_STATE);
            }
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    const startNewCycle = async (goals: Goal[], startDate: Date) => {
        if (!session) return;
        const monday = startOfWeek(startDate, { weekStartsOn: 1 });

        try {
            // Optimistic UI Update first (Optional, but let's stick to simple await for safety)

            // 1. Create Cycle
            const { data: cycle, error: cycleError } = await supabase.from('cycles').insert({
                user_id: session.user.id,
                start_date: monday.toISOString()
            }).select().single();

            if (cycleError) throw cycleError;
            if (!cycle) throw new Error("Failed to create cycle");

            setActiveCycleId(cycle.id);

            // 2. Create Goals
            const goalsToInsert = goals.map(g => ({
                cycle_id: cycle.id,
                user_id: session.user.id,
                title: g.title,
                description: g.description
            }));

            const { data: insertedGoals, error: goalError } = await supabase.from('goals').insert(goalsToInsert).select();
            if (goalError) throw goalError;

            // 3. Update Local State
            // ... Re-use logic to build initial weeks ...
            const weeks: Record<number, WeekData> = {};
            for (let i = 1; i <= 12; i++) {
                const weekStart = addWeeks(monday, i - 1);
                const weekEnd = addWeeks(weekStart, 1);
                weeks[i] = {
                    weekNumber: i,
                    startDate: weekStart.toISOString(),
                    endDate: weekEnd.toISOString(),
                    quote: QUOTES[i - 1] || "",
                    actions: []
                };
            }

            setState({
                startDate: monday.toISOString(),
                goals: (insertedGoals as any[]).map(g => ({ ...g, createdAt: g.created_at })),
                weeks: weeks,
                isSetupComplete: true
            });

        } catch (err) {
            console.error("New cycle error:", err);
            alert("Failed to save to database: " + (err as any).message);
        }
    };

    const addAction = async (weekNumber: number, goalId: string, title: string) => {
        if (!activeCycleId || !session) return;

        try {
            const { data, error } = await supabase.from('actions').insert({
                cycle_id: activeCycleId,
                user_id: session.user.id,
                goal_id: goalId,
                week_number: weekNumber,
                title: title,
                is_completed: false
            }).select().single();

            if (error) throw error;
            if (!data) return;

            // Update State
            const newAction: Action = {
                id: data.id,
                goalId: data.goal_id,
                title: data.title,
                isCompleted: data.is_completed,
                createdAt: data.created_at
            };

            setState(prev => {
                const week = prev.weeks[weekNumber];
                return {
                    ...prev,
                    weeks: {
                        ...prev.weeks,
                        [weekNumber]: {
                            ...week,
                            actions: [...week.actions, newAction]
                        }
                    }
                };
            });
        } catch (err) {
            console.error("Add action error", err);
        }
    };

    const toggleAction = async (weekNumber: number, actionId: string) => {
        // Optimistic update
        setState(prev => {
            const week = prev.weeks[weekNumber];
            return {
                ...prev,
                weeks: {
                    ...prev.weeks,
                    [weekNumber]: {
                        ...week,
                        actions: week.actions.map(a => a.id === actionId ? { ...a, isCompleted: !a.isCompleted } : a)
                    }
                }
            };
        });

        try {
            const targetAction = state.weeks[weekNumber].actions.find(a => a.id === actionId);
            const { error } = await supabase.from('actions')
                .update({ is_completed: !targetAction?.isCompleted }) // note: using inverted logic of *previous* state might be racey, mostly works for solo
                .eq('id', actionId);

            if (error) console.error(error); // Revert?
        } catch (err) { console.error(err); }
    };

    const deleteAction = async (weekNumber: number, actionId: string) => {
        setState(prev => {
            const week = prev.weeks[weekNumber];
            return {
                ...prev,
                weeks: {
                    ...prev.weeks,
                    [weekNumber]: {
                        ...week,
                        actions: week.actions.filter(a => a.id !== actionId)
                    }
                }
            };
        });

        await supabase.from('actions').delete().eq('id', actionId);
    };

    const resetData = () => { /* Not implemented for DB version */ };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <TrackerContext.Provider value={{ state, session, loading, startNewCycle, addAction, toggleAction, deleteAction, resetData, handleLogout }}>
            {children}
        </TrackerContext.Provider>
    );
};

export const useTracker = () => {
    const context = useContext(TrackerContext);
    if (context === undefined) {
        throw new Error('useTracker must be used within a TrackerProvider');
    }
    return context;
};
