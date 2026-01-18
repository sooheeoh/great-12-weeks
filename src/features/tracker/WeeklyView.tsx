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
    const [timeLeft, setTimeLeft] = useState<string>('');

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

    // Timer Logic
    React.useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            // End of week is weekEnd (which is next Monday 00:00, or close to it)
            // Actually addWeeks(start, 1) gives next Monday same time.
            const diff = weekEnd.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft("주간 종료");
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            setTimeLeft(`${days}일 ${hours}시간 ${minutes}분 남음`);
        };

        const timerId = setInterval(updateTimer, 60000); // Update every minute
        updateTimer(); // Initial call

        return () => clearInterval(timerId);
    }, [weekEnd]);


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

    const handlePrevWeek = () => {
        if (currentWeek > 1) setSelectedWeek(currentWeek - 1);
    };

    const handleNextWeek = () => {
        if (currentWeek < 12) setSelectedWeek(currentWeek + 1);
    };

    return (
        <div className="weekly-container">
            <div className="week-nav-controls">
                <Button variant="ghost" size="sm" onClick={handlePrevWeek} disabled={currentWeek === 1}>
                    &lt; 이전 주
                </Button>
                <div className="week-nav">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                        <button
                            key={num}
                            className={classNames('week-dot', { active: num === currentWeek })}
                            onClick={() => setSelectedWeek(num)}
                            title={`${num}주 차`}
                        >
                            {num}
                        </button>
                    ))}
                </div>
                <Button variant="ghost" size="sm" onClick={handleNextWeek} disabled={currentWeek === 12}>
                    다음 주 &gt;
                </Button>
            </div>

            <Card className="weekly-card">
                <div className="week-header">
                    <div>
                        <span className="week-label">{currentWeek}주 차</span>
                        <span className="week-dates">
                            {format(weekStart, 'M월 d일')} - {format(weekEnd, 'M월 d일')}
                        </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        {isCurrentWeek && <span className="current-badge">이번 주</span>}
                        {isCurrentWeek && <div className="week-timer">{timeLeft}</div>}
                    </div>
                </div>

                <div className="quote-section">
                    <p>"{weekData.quote}"</p>
                </div>

                <div className="progress-section">
                    <ProgressBar progress={progress} target={85} />
                    <p className="score-text">주간 실행 점수: {progress}%</p>
                </div>

                <div className="actions-section">
                    <h3>이번 주 실천 행동</h3>

                    <div className="add-action-form">
                        <select
                            value={selectedGoalId}
                            onChange={(e) => setSelectedGoalId(e.target.value)}
                            className="goal-select"
                        >
                            <option value="">목표를 선택하세요...</option>
                            {state.goals.map(g => (
                                <option key={g.id} value={g.id}>{g.title}</option>
                            ))}
                        </select>
                        <div className="input-group">
                            <Input
                                placeholder="할 일을 입력하세요..."
                                value={newActionTitle}
                                onChange={(e) => setNewActionTitle(e.target.value)}
                            />
                            <Button onClick={handleAddAction} disabled={!selectedGoalId || !newActionTitle}>추가</Button>
                        </div>
                    </div>

                    <div className="actions-list">
                        {weekData.actions.length === 0 ? (
                            <p className="empty-actions">등록된 할 일이 없습니다.</p>
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
                                                const newTitle = window.prompt("할 일 수정:", action.title);
                                                if (newTitle && newTitle.trim()) updateAction(currentWeek, action.id, newTitle);
                                            }}
                                            title="수정"
                                        >
                                            ✎
                                        </button>
                                        <button
                                            className="icon-btn-sm danger"
                                            onClick={() => deleteAction(currentWeek, action.id)}
                                            title="삭제"
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
