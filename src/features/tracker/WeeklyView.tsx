import React, { useState } from 'react';
import { useTracker } from '../../context/TrackerContext';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { ProgressBar } from '../../components/ProgressBar';
import { Input } from '../../components/Input';
import { format, addWeeks, isSameWeek } from 'date-fns';
import classNames from 'classnames';
import './WeeklyView.css';

export const WeeklyView: React.FC = () => {
    const { state, addAction, toggleAction, deleteAction, updateAction } = useTracker();
    const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
    const [newActionTitle, setNewActionTitle] = useState('');
    const [selectedGoalId, setSelectedGoalId] = useState<string>('');

    // Determine current week based on date
    const today = new Date();
    const startDate = state.startDate ? new Date(state.startDate) : new Date();

    // Default to current week logic...
    if (selectedWeek === null && state.startDate) {
        const weekDiff = Math.floor((today.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
        const initialWeek = Math.max(1, Math.min(12, weekDiff));
        setSelectedWeek(initialWeek);
    }

    const currentWeek = selectedWeek || 1;
    const weekData = state.weeks[currentWeek];

    const weekStart = addWeeks(startDate, currentWeek - 1);
    const weekEnd = addWeeks(weekStart, 1);
    const isCurrentWeek = isSameWeek(today, weekStart, { weekStartsOn: 1 });

    // Progress
    const totalActions = weekData?.actions.length || 0;
    const completedActions = weekData?.actions.filter(a => a.isCompleted).length || 0;
    const progress = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

    const handleAddAction = () => {
        if (!newActionTitle.trim() || !selectedGoalId) return;
        addAction(currentWeek, selectedGoalId, newActionTitle);
        setNewActionTitle('');
    };

    if (!weekData) return <div>Loading...</div>;

    return (
        <div className="weekly-container">
            <div className="week-nav">
                {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                    <button
                        key={num}
                        className={classNames('week-dot', { active: num === currentWeek })}
                        onClick={() => setSelectedWeek(num)}
                    >
                        {num}
                    </button>
                ))}
            </div>

            <Card className="weekly-card">
                <div className="week-header">
                    <div>
                        <span className="week-label">Week {currentWeek}</span>
                        <span className="week-dates">
                            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
                        </span>
                    </div>
                    {isCurrentWeek && <span className="current-badge">Current</span>}
                </div>

                <div className="quote-section">
                    <p>"{weekData.quote}"</p>
                </div>

                <div className="progress-section">
                    <ProgressBar progress={progress} target={85} />
                    <p className="score-text">Execution Score: {progress}%</p>
                </div>

                <div className="actions-section">
                    <h3>Weekly Actions</h3>

                    <div className="add-action-form">
                        <select
                            value={selectedGoalId}
                            onChange={(e) => setSelectedGoalId(e.target.value)}
                            className="goal-select"
                        >
                            <option value="">Select a Goal...</option>
                            {state.goals.map(g => (
                                <option key={g.id} value={g.id}>{g.title}</option>
                            ))}
                        </select>
                        <div className="input-group">
                            <Input
                                placeholder="Action step for this week..."
                                value={newActionTitle}
                                onChange={(e) => setNewActionTitle(e.target.value)}
                            />
                            <Button onClick={handleAddAction} disabled={!selectedGoalId || !newActionTitle}>Add</Button>
                        </div>
                    </div>

                    <div className="actions-list">
                        {weekData.actions.length === 0 ? (
                            <p className="empty-actions">No actions planned for this week.</p>
                        ) : (
                            weekData.actions.map(action => (
                                <div key={action.id} className={classNames('action-item', { completed: action.isCompleted })}>
                                    <div className="action-left">
                                        <input
                                            type="checkbox"
                                            checked={action.isCompleted}
                                            onChange={() => toggleAction(currentWeek, action.id)}
                                            style={{ marginRight: '10px' }}
                                        />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span className="action-title">{action.title}</span>
                                            <span className="action-goal-tag">
                                                {state.goals.find(g => g.id === action.goalId)?.title}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="action-actions">
                                        <button
                                            className="icon-btn-sm"
                                            onClick={() => {
                                                const newTitle = window.prompt("Edit Action", action.title);
                                                if (newTitle && newTitle.trim()) updateAction(currentWeek, action.id, newTitle);
                                            }}
                                            title="Edit"
                                        >
                                            ✎
                                        </button>
                                        <button
                                            className="icon-btn-sm danger"
                                            onClick={() => deleteAction(currentWeek, action.id)}
                                            title="Delete"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
};
