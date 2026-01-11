import React, { useMemo } from 'react';
import classNames from 'classnames';
import { useTracker } from '../../context/TrackerContext';
import { Card } from '../../components/Card';
import './DashboardOverview.css';

export const DashboardOverview: React.FC = () => {
    const { state } = useTracker();

    // Calculate stats
    const stats = useMemo(() => {
        let totalActions = 0;
        let completedActions = 0;

        Object.values(state.weeks).forEach(week => {
            totalActions += week.actions.length;
            completedActions += week.actions.filter(a => a.isCompleted).length;
        });

        const overallProgress = totalActions > 0 ? (completedActions / totalActions) * 100 : 0;

        return {
            overallProgress,
            weeksCompleted: Object.values(state.weeks).filter(w => {
                // A week is "completed" if it has passed? Or if all actions done?
                // Let's just say a week is processed if it has actions.
                // Or maybe just show time elapsed?
                // For the heatmap/grid, we color code by success rate.
                return w.actions.length > 0;
            }).length
        };
    }, [state]);

    const getWeekStatus = (weekNum: number) => {
        const week = state.weeks[weekNum];
        if (!week || week.actions.length === 0) return 'empty';

        const completion = week.actions.filter(a => a.isCompleted).length / week.actions.length;
        if (completion >= 0.85) return 'success';
        if (completion >= 0.5) return 'warning';
        return 'danger';
    };

    return (
        <Card className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h2>12-Week Overview</h2>
                    <p className="dashboard-subtitle"> Consistency is key.</p>
                </div>
                <div className="overall-stat">
                    <span className="stat-value">{Math.round(stats.overallProgress)}%</span>
                    <span className="stat-label">Total Completion</span>
                </div>
            </div>

            <div className="weeks-grid">
                {Array.from({ length: 12 }, (_, i) => i + 1).map(num => {
                    const status = getWeekStatus(num);
                    return (
                        <div key={num} className={classNames('week-box', `status-${status}`)}>
                            <span className="week-box-num">{num}</span>
                        </div>
                    );
                })}
            </div>

            <div className="legend">
                <div className="legend-item"><span className="dot status-success"></span> Win (≥85%)</div>
                <div className="legend-item"><span className="dot status-warning"></span> Fair (≥50%)</div>
                <div className="legend-item"><span className="dot status-danger"></span> Needs Focus (&lt;50%)</div>
                <div className="legend-item"><span className="dot status-empty"></span> Not Started</div>
            </div>
        </Card>
    );
};
