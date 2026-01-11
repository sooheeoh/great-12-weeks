// src/features/dashboard/GoalEditor.tsx
import React, { useState } from 'react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useTracker } from '../../context/TrackerContext';
import { Pencil, Trash2, X, Check } from 'lucide-react';
import './GoalEditor.css';

export const GoalEditor: React.FC = () => {
    const { state, updateGoal, deleteGoal, finishCurrentCycle } = useTracker();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ title: '', description: '' });

    const handleEditClick = (goal: any) => {
        setEditingId(goal.id);
        setEditForm({ title: goal.title, description: goal.description || '' });
    };

    const handleSave = () => {
        if (!editForm.title.trim() || !editingId) return;
        updateGoal(editingId, editForm.title, editForm.description);
        setEditingId(null);
    };

    return (
        <Card className="goal-editor-card">
            <div className="goal-editor-header">
                <h3>My 12-Week Goals</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button variant="ghost" size="sm" onClick={finishCurrentCycle} style={{ color: '#ef4444' }}>
                        End Cycle
                    </Button>
                </div>
            </div>

            <div className="goals-list">
                {state.goals.map(goal => (
                    <div key={goal.id} className="goal-item-row">
                        {editingId === goal.id ? (
                            <div className="goal-edit-form">
                                <Input
                                    className="edit-input"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Goal Title"
                                />
                                <Input
                                    className="edit-input"
                                    value={editForm.description}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Description (Optional)"
                                />
                                <div className="edit-actions">
                                    <Button size="sm" onClick={handleSave}><Check size={16} /></Button>
                                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X size={16} /></Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="goal-content">
                                    <h4 className="goal-title">{goal.title}</h4>
                                    {goal.description && <p className="goal-desc">{goal.description}</p>}
                                </div>
                                <div className="goal-actions">
                                    <button className="icon-btn" onClick={() => handleEditClick(goal)}>
                                        <Pencil size={16} />
                                    </button>
                                    <button className="icon-btn danger" onClick={() => deleteGoal(goal.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </Card>
    );
};
