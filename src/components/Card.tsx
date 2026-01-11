import React from 'react';
import classNames from 'classnames';
import './Card.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    title?: string;
    action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className, title, action, ...props }) => {
    return (
        <div className={classNames('glass-panel', 'card', className)} {...props}>
            {(title || action) && (
                <div className="card-header">
                    {title && <h3 className="card-title">{title}</h3>}
                    {action && <div className="card-action">{action}</div>}
                </div>
            )}
            <div className="card-content">{children}</div>
        </div>
    );
};
