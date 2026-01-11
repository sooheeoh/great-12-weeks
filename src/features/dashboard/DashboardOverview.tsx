import React, { useState } from 'react';
import { useTracker } from '../../context/TrackerContext';
import { Card } from '../../components/Card';
import { GoalEditor } from './GoalEditor';
import { HistoryView } from '../cycles/HistoryView';
import { Button } from '../../components/Button';
import { addWeeks, isBefore, isSameWeek, parseISO } from 'date-fns';
import classNames from 'classnames';
import './DashboardOverview.css';

export const DashboardOverview: React.FC = () => {
    const { state } = useTracker();
    const [showHistory, setShowHistory] = useState(false);

    // ... Logic remains mostly same, just checking imports/usage
    const startDate = state.startDate ? parseISO(state.startDate) : new Date();
    const today = new Date();

    // Calculate total progress
    const allActions = Object.values(state.weeks).flatMap(w => w.actions);
    const totalActions = allActions.length;
    const completedActions = allActions.filter(a => a.isCompleted).length;
    const overallProgress = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

    // Calculate week statuses for grid
    const weeksGrid = Array.from({ length: 12 }, (_, i) => {
        const weekNum = i + 1;
        const weekData = state.weeks[weekNum];
        const weekStart = addWeeks(startDate, i);
        const isPast = isBefore(addWeeks(weekStart, 1), today);
        const isCurrent = isSameWeek(today, weekStart, { weekStartsOn: 1 });

        let status: 'pending' | 'success' | 'warning' | 'danger' = 'pending';

        if (weekData && weekData.actions.length > 0) {
            const wTotal = weekData.actions.length;
            const wCompleted = weekData.actions.filter(a => a.isCompleted).length;
            const wPercent = (wCompleted / wTotal) * 100;

            if (wPercent >= 85) status = 'success';
            else if (wPercent >= 50) status = 'warning';
            else status = 'danger';
        }

        return { weekNum, status, isCurrent, isPast };
    });

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2>{state.profile?.nickname ? `${state.profile.nickname}님의 위대한 12주` : '위대한 12주'}</h2>
                <Button variant="secondary" size="sm" onClick={() => setShowHistory(true)}>
                    지난 기록
                </Button>
            </div>

            <GoalEditor />

            {/* Grid and Progress logic */}
            <div className="stats-row">
                <Card className="stats-card">
                    <h3>전체 진행률</h3>
                    <div className="big-percent">{overallProgress}%</div>
                    <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${overallProgress}%` }}></div>
                    </div>
                </Card>

                <Card className="grid-card">
                    <div className="weeks-grid">
                        {weeksGrid.map(w => (
                            <div key={w.weekNum}
                                className={classNames('week-box', w.status, { current: w.isCurrent, past: w.isPast })}
                            >
                                <span className="week-label">{w.weekNum}주</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {showHistory && <HistoryView onClose={() => setShowHistory(false)} />}
        </div>
    );
};
