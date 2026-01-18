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
    finishCurrentCycle: () => void;
    addAction: (weekNumber: number, goalId: string, title: string) => void;
    updateAction: (weekNumber: number, actionId: string, title: string) => void;
    toggleAction: (weekNumber: number, actionId: string) => void;
    deleteAction: (weekNumber: number, actionId: string) => void;
    updateGoal: (goalId: string, title: string, description: string) => void;
    deleteGoal: (goalId: string) => void;
    updateProfile: (nickname: string) => Promise<void>;
    saveReview: (weekNumber: number, content: string) => Promise<void>;
    fetchHistory: () => Promise<any[]>;
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
    "위대한 일을 해내는 유일한 방법은 당신이 하는 일을 사랑하는 것입니다.",
    "할 수 있다고 믿으세요. 그러면 이미 절반은 해낸 것입니다.",
    "당신의 시간은 한정되어 있습니다. 다른 사람의 삶을 사느라 낭비하지 마세요.",
    "시계를 보지 마세요. 시계가 하는 대로 계속 나아가세요.",
    "미래는 오늘 당신이 무엇을 하느냐에 달려 있습니다.",
    "멈추지 않는 한, 얼마나 천천히 가는지는 중요하지 않습니다.",
    "당신이 원하는 모든 것은 두려움의 반대편에 있습니다.",
    "성공은 끝이 아니며, 실패는 치명적이지 않습니다. 중요한 것은 계속하는 용기입니다.",
    "고난은 종종 평범한 사람을 비범한 운명으로 이끕니다.",
    "크게 꿈꾸고, 대담하게 실패하세요.",
    "목표를 달성해서 얻는 것보다 중요한 것은, 목표를 달성하며 변화하는 당신의 모습입니다.",
    "미래를 예측하는 가장 좋은 방법은 미래를 만들어가는 것입니다."
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

            // Fetch Profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('nickname')
                .eq('id', currentSession.user.id)
                .single();

            // Fetch latest active cycle
            const { data: cycles, error: cycleError } = await supabase
                .from('cycles')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1);

            if (cycleError) throw cycleError;

            let extraState = {};
            if (profile) {
                extraState = { profile: { nickname: profile.nickname } };
            }

            if (cycles && cycles.length > 0) {
                const cycle = cycles[0];
                setActiveCycleId(cycle.id);

                // Fetch Goals
                const { data: goals } = await supabase.from('goals').select('*').eq('cycle_id', cycle.id);

                // Fetch Actions
                const { data: actions } = await supabase.from('actions').select('*').eq('cycle_id', cycle.id);

                // Fetch Reviews
                const { data: reviews } = await supabase.from('weekly_reviews').select('*').eq('cycle_id', cycle.id);

                // Reconstruct State
                // Calculate weeks structure
                const start = new Date(cycle.start_date);
                const weeks: Record<number, WeekData> = {};
                for (let i = 1; i <= 12; i++) {
                    const weekStart = addWeeks(start, i - 1);
                    const weekEnd = addWeeks(weekStart, 1);

                    const reviewData = reviews?.find((r: any) => r.week_number === i);

                    weeks[i] = {
                        weekNumber: i,
                        startDate: weekStart.toISOString(),
                        endDate: weekEnd.toISOString(),
                        quote: QUOTES[i - 1] || "포기하지 마세요!",
                        review: reviewData ? reviewData.content : '',
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
                    isSetupComplete: true,
                    ...extraState
                });
            } else {
                // No Data found
                setState({ ...INITIAL_STATE, ...extraState });
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

    const finishCurrentCycle = async () => {
        if (!activeCycleId) return;

        const confirmEnd = window.confirm("Are you sure you want to finish this 12-week cycle? It will be archived.");
        if (!confirmEnd) return;

        try {
            const { error } = await supabase.from('cycles')
                .update({ is_active: false })
                .eq('id', activeCycleId);

            if (error) throw error;

            // Reset local state
            setState(INITIAL_STATE);
            setActiveCycleId(null);
        } catch (err) {
            console.error("Error finishing cycle:", err);
        }
    };

    const fetchHistory = async () => {
        if (!session) return [];
        const { data, error } = await supabase.from('cycles')
            .select('*, goals(*)')
            .eq('is_active', false)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching history:", error);
            return [];
        }
        return data;
    };

    const updateGoal = async (goalId: string, title: string, description: string) => {
        // Optimistic
        setState(prev => ({
            ...prev,
            goals: prev.goals.map(g => g.id === goalId ? { ...g, title, description } : g)
        }));

        await supabase.from('goals').update({ title, description }).eq('id', goalId);
    };

    const deleteGoal = async (goalId: string) => {
        if (!window.confirm("Delete this goal? Associated actions will also be deleted.")) return;

        // Optimistic
        setState(prev => ({
            ...prev,
            goals: prev.goals.filter(g => g.id !== goalId),
            // Also remove actions associated? Or just let refetch handle it? 
            // For optimistic UI, we should verify actions in weeks too
            weeks: Object.fromEntries(Object.entries(prev.weeks).map(([k, w]) => [
                k,
                { ...w, actions: w.actions.filter(a => a.goalId !== goalId) }
            ]))
        }));

        await supabase.from('goals').delete().eq('id', goalId);
    };

    const updateAction = async (weekNumber: number, actionId: string, title: string) => {
        setState(prev => {
            const week = prev.weeks[weekNumber];
            return {
                ...prev,
                weeks: {
                    ...prev.weeks,
                    [weekNumber]: {
                        ...week,
                        actions: week.actions.map(a => a.id === actionId ? { ...a, title } : a)
                    }
                }
            };
        });
        await supabase.from('actions').update({ title }).eq('id', actionId);
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
            // DB update
            const { error } = await supabase.from('actions')
                .update({ is_completed: !targetAction?.isCompleted })
                .eq('id', actionId);

            if (error) console.error(error);
        } catch (err) { console.error(err); }
    };

    const deleteAction = async (weekNumber: number, actionId: string) => {
        if (!window.confirm("Remove this action?")) return;

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

    const updateProfile = async (nickname: string) => {
        if (!session) return;

        setState(prev => ({ ...prev, profile: { nickname } }));

        await supabase.from('profiles').upsert({
            id: session.user.id,
            nickname: nickname,
            created_at: new Date().toISOString()
        });
    };

    const saveReview = async (weekNumber: number, content: string) => {
        if (!activeCycleId || !session) return;

        // Optimistic update
        setState(prev => {
            const week = prev.weeks[weekNumber];
            return {
                ...prev,
                weeks: {
                    ...prev.weeks,
                    [weekNumber]: { ...week, review: content }
                }
            };
        });

        await supabase.from('weekly_reviews').upsert({
            cycle_id: activeCycleId,
            user_id: session.user.id,
            week_number: weekNumber,
            content: content,
            updated_at: new Date().toISOString()
        }, { onConflict: 'cycle_id, week_number' });
    };

    return (
        <TrackerContext.Provider value={{
            state,
            session,
            loading,
            startNewCycle,
            finishCurrentCycle,
            addAction,
            updateAction,
            toggleAction,
            deleteAction,
            updateGoal,
            deleteGoal,
            fetchHistory,
            updateProfile,
            saveReview,
            resetData,
            handleLogout
        }}>
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
