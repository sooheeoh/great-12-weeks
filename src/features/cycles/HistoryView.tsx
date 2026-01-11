import React, { useEffect, useState } from 'react';
import { useTracker } from '../../context/TrackerContext';
import { Card } from '../../components/Card';
import { format } from 'date-fns';
import './HistoryView.css';

export const HistoryView: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { fetchHistory } = useTracker();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory().then(data => {
            setHistory(data);
            setLoading(false);
        });
    }, []);

    return (
        <div className="history-overlay">
            <div className="history-modal">
                <div className="history-header">
                    <h2>지난 기록</h2>
                    <button onClick={onClose} className="close-btn">닫기</button>
                </div>

                <div className="history-list">
                    {loading ? (
                        <p>로딩 중...</p>
                    ) : history.length === 0 ? (
                        <p className="empty-msg">아직 기록이 없습니다. 파이팅!</p>
                    ) : (
                        history.map(cycle => (
                            <Card key={cycle.id} className="history-item">
                                <div className="history-dates">
                                    <span className="date-tag">시작일: {format(new Date(cycle.start_date), 'MMM d, yyyy')}</span>
                                    {/* Calculated End date could be added here */}
                                </div>
                                <div className="history-goals">
                                    <ul>
                                        {cycle.goals.map((g: any) => (
                                            <li key={g.id}>{g.title}</li>
                                        ))}
                                    </ul>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
