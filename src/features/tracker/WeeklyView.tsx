import React, { useState, useMemo } from 'react';
import classNames from 'classnames';
import { useTracker } from '../../context/TrackerContext';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ProgressBar } from '../../components/ProgressBar';
import { Plus, Trash2, CheckCircle, Circle } from 'lucide-react';
import './WeeklyView.css';
import { format, parseISO } from 'date-fns';

export const WeeklyView: React.FC = () => {
    const { state, addAction, toggleAction, deleteAction } = useTracker();

    // Determine current week
    const currentWeekNum = useMemo(() => {
        const today = new Date();
        // Default to week 1 if not started, but app handles proper routing.
        // Loop through weeks to find which one we are in.
        const weekNumStr = Object.keys(state.weeks).find(k => {
            const w = state.weeks[Number(k)];
            const start = parseISO(w.startDate);
            const end = parseISO(w.endDate); // Note: endDate in context was computed as next monday.
            // Actually endOfDay checks might be safer or just strict comparison.
            // Let's use isWithinInterval.
            // Adjust end to be inclusive of the last millisecond of Sunday or similar, 
            // but since our generated end date is the *start* of the next week, we use start <= today < end logic
            return today >= start && today < end;
        });

        return weekNumStr ? Number(weekNumStr) : 1; // Default to 1 if outside range or logic fail, 
        // real app might show "Pre-start" or "Post-end" UI.
        // For now assuming Week 1 if early, or Week 12 if late is fine for MVP or just 1.
    }, [state.weeks]);

    // Allow user to toggle weeks? MVP: Just show current week or a selector. 
    // Let's add a simple selector tab for now, default to current.
    const [selectedWeek, setSelectedWeek] = useState(currentWeekNum);

    const weekData = state.weeks[selectedWeek];

    // Local state for new action input
    const [newActionTitle, setNewActionTitle] = useState('');
    const [selectedGoalId, setSelectedGoalId] = useState(state.goals[0]?.id || '');

    // Add Action Handler
    const handleAddAction = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newActionTitle.trim()) return;

        addAction(selectedWeek, selectedGoalId, newActionTitle);
        setNewActionTitle('');
    };

    // Calculate Progress
    const progress = useMemo(() => {
        if (!weekData || weekData.actions.length === 0) return 0;
        const completed = weekData.actions.filter(a => a.isCompleted).length;
        return (completed / weekData.actions.length) * 100;
    }, [weekData]);

    if (!weekData) return <div>Loading...</div>;

    return (
        <div className="weekly-container">
            {/* Week Selector / Header */}
            <div className="weekly-header">
                <div className="week-selector">
                    {/* Simple prev/next or just display */}
                    <h2 className="week-title">Week {selectedWeek}</h2>
                    <span className="week-date-range">
                        {format(parseISO(weekData.startDate), 'MMM d')} - {format(parseISO(weekData.endDate), 'MMM d')}
                    </span>
                </div>

                {/* Quote */}
                <Card className="quote-card">
                    <p className="quote-text">"{weekData.quote}"</p>
                </Card>
            </div>

            {/* Progress Overview */}
            <div className="progress-section">
                <div className="progress-header-row">
                    <h3>Weekly Execution Score</h3>
                    <span className={classNames('score-badge', { 'score-good': progress >= 85 })}>
                        {Math.round(progress)}%
                    </span>
                </div>
                <ProgressBar progress={progress} showLabel={false} />
                <p className="progress-hint">Target: 85% completion to win the week.</p>
            </div>

            {/* Actions List */}
            <div className="actions-board">
                <div className="actions-list-container">
                    <div className="actions-header">
                        <h3>Weekly Actions</h3>
                    </div>

                    {weekData.actions.length === 0 ? (
                        <div className="empty-state">
                            <p>No actions set for this week yet. Plan your week to succeed!</p>
                        </div>
                    ) : (
                        <div className="actions-list">
                            {weekData.actions.map(action => (
                                <div key={action.id} className={classNames('action-item', { 'completed': action.isCompleted })}>
                                    <button
                                        className="check-btn"
                                        onClick={() => toggleAction(selectedWeek, action.id)}
                                    >
                                        {action.isCompleted ? <CheckCircle size={24} color="var(--color-success)" /> : <Circle size={24} color="var(--color-text-muted)" />}
                                    </button>
                                    <div className="action-content">
                                        <p className="action-title">{action.title}</p>
                                        <span className="action-goal-tag">
                                            {state.goals.find(g => g.id === action.goalId)?.title || 'Unknown Goal'}
                                        </span>
                                    </div>
                                    <button
                                        className="delete-btn"
                                        onClick={() => deleteAction(selectedWeek, action.id)}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Add Action Form */}
                <Card className="add-action-card">
                    <h3>Add New Action</h3>
                    <form onSubmit={handleAddAction}>
                        <div className="form-group">
                            <label>Goal</label>
                            <select
                                value={selectedGoalId}
                                onChange={(e) => setSelectedGoalId(e.target.value)}
                                className="glass-select"
                            >
                                {state.goals.map(g => (
                                    <option key={g.id} value={g.id}>{g.title}</option>
                                ))}
                            </select>
                        </div>
                        <Input
                            placeholder="Action description..."
                            value={newActionTitle}
                            onChange={(e) => setNewActionTitle(e.target.value)}
                        />
                        <Button type="submit" size="sm" style={{ width: '100%' }}>
                            <Plus size={16} style={{ marginRight: 8 }} /> Add Action
                        </Button>
                    </form>
                </Card>
            </div>

            {/* Week Navigation (Quick dirty way) */}
            <div className="week-nav">
                {[...Array(12)].map((_, i) => (
                    <button
                        key={i + 1}
                        className={classNames('week-nav-dot', { 'active': selectedWeek === i + 1 })}
                        onClick={() => setSelectedWeek(i + 1)}
                    >
                        {i + 1}
                    </button>
                ))}
            </div>
        </div>
    );
};
