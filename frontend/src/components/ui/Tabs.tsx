import React, { createContext, useContext, useState } from "react";

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextValue>({ activeTab: "", setActiveTab: () => {} });

interface TabsProps {
  defaultTab?: string;
  value?: string;
  onChange?: (tab: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ defaultTab = "", value, onChange, children, className = "" }: TabsProps) {
  const [internalTab, setInternalTab] = useState(defaultTab);
  const activeTab = value ?? internalTab;
  const setActiveTab = (tab: string) => {
    setInternalTab(tab);
    onChange?.(tab);
  };
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabList({ children, className = "" }: TabListProps) {
  return (
    <div
      role="tablist"
      className={`flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit ${className}`}
    >
      {children}
    </div>
  );
}

interface TabProps {
  value: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export function Tab({ value, children, icon, disabled = false }: TabProps) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === value;
  return (
    <button
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => !disabled && setActiveTab(value)}
      className={`
        flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium
        transition-all duration-150 whitespace-nowrap
        ${isActive
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-500 hover:text-slate-700 hover:bg-white/60"
        }
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {icon && <span className="text-current">{icon}</span>}
      {children}
    </button>
  );
}

interface TabPanelProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabPanel({ value, children, className = "" }: TabPanelProps) {
  const { activeTab } = useContext(TabsContext);
  if (activeTab !== value) return null;
  return (
    <div role="tabpanel" className={`animate-fade-in ${className}`}>
      {children}
    </div>
  );
}
