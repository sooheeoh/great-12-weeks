export interface Action {
    id: string;
    goalId: string;
    title: string;
    isCompleted: boolean;
    createdAt: string; // ISO Date string
}

export interface Goal {
    id: string;
    title: string;
    description: string;
    createdAt: string;
}

export interface WeekData {
    weekNumber: number; // 1-12
    startDate: string; // ISO Date string of the Monday of that week
    endDate: string; // ISO Date string of the Sunday of that week
    quote: string;
    actions: Action[];
    review: string[]; /* Changed from optional string to array */
}

export interface TrackerState {
    startDate: string | null; // The start date of the 12-week cycle (should be a Monday)
    goals: Goal[];
    weeks: Record<number, WeekData>;
    isSetupComplete: boolean;
    profile?: { nickname: string };
}

export interface WeeklyStats {
    totalActions: number;
    completedActions: number;
    percentage: number;
}
