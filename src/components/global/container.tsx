"use client";

interface ContainerProps {
    children: React.ReactNode;
    className?: string;
    reverse?: boolean;
}

const Container = ({ children, className = "", reverse = false }: ContainerProps) => {
    return (
        <div className={`container mx-auto ${reverse ? 'flex flex-col-reverse' : 'flex flex-col'} ${className}`}>
            {children}
        </div>
    );
};

export default Container;