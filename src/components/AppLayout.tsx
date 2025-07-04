
"use client";
import React from 'react';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-svh">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto pb-20 md:pb-6">{children}</main>
      </div>
    </div>
  );
}
