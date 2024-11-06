import React from 'react'

interface WrapperProps {
    children: React.ReactNode;
    className?: string;
}

const Wrapper = ({ children, className = "" }: WrapperProps) => {
    return (
        <div className={className}>
            {children}
        </div>
    );
};

export default Wrapper;
