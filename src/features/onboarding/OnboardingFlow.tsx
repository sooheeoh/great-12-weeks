import React, { useState } from 'react';

import type { Goal } from '../../types';
import { useTracker } from '../../context/TrackerContext';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import './OnboardingFlow.css';

// Simple ID generator for goals locally
const generateId = () => Math.random().toString(36).substr(2, 9);

export const OnboardingFlow: React.FC = () => {
    const { startNewCycle } = useTracker();
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [goals, setGoals] = useState<{ title: string, description: string }[]>([
        { title: '', description: '' },
        { title: '', description: '' },
        { title: '', description: '' },
    ]);

    const handleGoalChange = (index: number, field: 'title' | 'description', value: string) => {
        const newGoals = [...goals];
        newGoals[index] = { ...newGoals[index], [field]: value };
        setGoals(newGoals);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate
        const hasGoals = goals.every(g => g.title.trim().length > 0);
        if (!hasGoals) {
            alert("Please fill in all 3 goals to start your 12-week journey.");
            return;
        }

        const finalGoals: Goal[] = goals.map(g => ({
            id: generateId(),
            title: g.title,
            description: g.description,
            createdAt: new Date().toISOString()
        }));

        startNewCycle(finalGoals, new Date(startDate));
    };

    return (
        <div className="onboarding-container">
            <div className="onboarding-header">
                <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '1rem' }}>Great 12 Weeks</h1>
                <p className="subtitle">Achieve more in 12 weeks than most do in 12 months.</p>
            </div>

            <Card className="onboarding-card">
                <form onSubmit={handleSubmit}>
                    <div className="form-section">
                        <h2 className="section-title">1. When do we start?</h2>
                        <Input
                            type="date"
                            label="Start Date (Week 1 commences)"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-section">
                        <h2 className="section-title">2. Define your Top 3 Goals</h2>
                        <p className="section-desc">Focus on a few key objectives. These will drive your weekly actions.</p>

                        <div className="goals-inputs">
                            {goals.map((goal, idx) => (
                                <div key={idx} className="goal-input-group">
                                    <Input
                                        label={`Goal #${idx + 1}`}
                                        placeholder="e.g. Launch MVP..."
                                        value={goal.title}
                                        onChange={(e) => handleGoalChange(idx, 'title', e.target.value)}
                                        required
                                    />
                                    <Input
                                        placeholder="Description (optional)"
                                        value={goal.description}
                                        onChange={(e) => handleGoalChange(idx, 'description', e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-actions">
                        <Button type="submit" size="lg">Begin the Journey</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
