import React from 'react';
import classNames from 'classnames';
import './Button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    className,
    isLoading,
    disabled,
    ...props
}) => {
    return (
        <button
            className={classNames(
                'btn',
                `btn-${variant}`,
                `btn-${size}`,
                { 'btn-loading': isLoading },
                className
            )}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading ? <span className="spinner" /> : children}
        </button>
    );
};
