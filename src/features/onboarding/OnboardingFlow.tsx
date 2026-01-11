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
    const { startNewCycle, updateProfile } = useTracker();
    const [nickname, setNickname] = useState('');
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate
        if (!nickname.trim()) {
            alert("닉네임을 입력해주세요.");
            return;
        }

        const hasGoals = goals.every(g => g.title.trim().length > 0);
        if (!hasGoals) {
            alert("12주 동안 집중할 3가지 목표를 모두 입력해주세요.");
            return;
        }

        const finalGoals: Goal[] = goals.map(g => ({
            id: generateId(),
            title: g.title,
            description: g.description,
            createdAt: new Date().toISOString()
        }));

        // Update profile first
        await updateProfile(nickname);
        startNewCycle(finalGoals, new Date(startDate));
    };

    return (
        <div className="onboarding-container">
            <div className="onboarding-header">
                <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '1rem' }}>위대한 12주</h1>
                <p className="subtitle">많은 사람들이 12개월 동안 할 일을, 12주 만에 해내세요.</p>
            </div>

            <Card className="onboarding-card">
                <form onSubmit={handleSubmit}>
                    <div className="form-section">
                        <h2 className="section-title">0. 당신을 어떻게 부를까요?</h2>
                        <Input
                            placeholder="닉네임 (예: 열정맨)"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-section">
                        <h2 className="section-title">1. 언제 시작할까요?</h2>
                        <Input
                            type="date"
                            label="시작일 (1주차 시작)"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-section">
                        <h2 className="section-title">2. 핵심 목표 3가지 정의</h2>
                        <p className="section-desc">가장 중요한 목표에 집중하세요. 이 목표들이 매주 실천의 기준이 됩니다.</p>

                        <div className="goals-inputs">
                            {goals.map((goal, idx) => (
                                <div key={idx} className="goal-input-group">
                                    <Input
                                        label={`목표 #${idx + 1}`}
                                        placeholder="예: MVP 런칭하기"
                                        value={goal.title}
                                        onChange={(e) => handleGoalChange(idx, 'title', e.target.value)}
                                        required
                                    />
                                    <Input
                                        placeholder="상세 설명 (선택)"
                                        value={goal.description}
                                        onChange={(e) => handleGoalChange(idx, 'description', e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-actions">
                        <Button type="submit" size="lg">여정 시작하기</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
