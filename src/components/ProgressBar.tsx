import React from 'react';
import classNames from 'classnames';
import './ProgressBar.css';

interface ProgressBarProps {
    progress: number; // 0 to 100
    target?: number;
    className?: string;
    showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    progress,
    target = 85,
    className,
    showLabel = true
}) => {
    // Determine color based on progress relative to target
    // If progress >= target, green (success)
    // If progress >= target * 0.5, yellow (warning)
    // Else red (error) -> though "error" is harsh, let's use a gradient or warning

    const isTargetMet = progress >= target;

    return (
        <div className={classNames('progress-container', className)}>
            <div className="progress-track">
                <div
                    className={classNames('progress-fill', { 'target-met': isTargetMet })}
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
                {/* Optional: Marker for target */}
                <div
                    className="target-marker"
                    style={{ left: `${target}%` }}
                    title={`Target: ${target}%`}
                />
            </div>
            {showLabel && (
                <div className="progress-label">
                    <span className={classNames('progress-text', { 'text-success': isTargetMet })}>
                        {Math.round(progress)}%
                    </span>
                    <span className="target-text">Goal: {target}%</span>
                </div>
            )}
        </div>
    );
};
