
import DashboardSidebar from '@/components/sidebar';
import React from 'react';

interface Props {
    children: React.ReactNode;
}

const DashboardLayout = ({ children }: Props) => {
    return (
        
            <main className="flex lg:flex-row flex-col flex-1 size-full">
                <DashboardSidebar />
                <div className="lg:ml-72 pt-14 w-full">
                    {children}
                </div>
            </main>

    );
};

export default DashboardLayout;