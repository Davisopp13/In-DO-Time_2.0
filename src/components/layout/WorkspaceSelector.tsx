"use client";

import { useState, useRef, useEffect } from "react";
import { useWorkspace } from "@/lib/workspace";
import { ChevronDown, Ship, Code, User, Bot, Plus } from "lucide-react";

const iconMap: Record<string, any> = {
    Ship,
    Code,
    User,
    Bot,
};

export default function WorkspaceSelector() {
    const { workspaces, currentWorkspace, setCurrentWorkspace } = useWorkspace();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!currentWorkspace) return null;

    const CurrentIcon = iconMap[currentWorkspace.icon || "User"] || User;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full glass border-[var(--workspace-color-muted)] hover:border-[var(--workspace-color)] transition-all duration-300 group"
            >
                <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: currentWorkspace.color }}
                >
                    <CurrentIcon size={14} />
                </div>
                <span className="hidden sm:inline text-sm font-semibold text-[var(--text-primary)]">
                    {currentWorkspace.name}
                </span>
                <ChevronDown
                    size={16}
                    className={`text-[var(--text-muted)] transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 glass p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="trail-marker px-3 py-2 text-[10px]">Switch Workspace</p>
                    <div className="flex flex-col gap-1 mt-1">
                        {workspaces.map((workspace) => {
                            const Icon = iconMap[workspace.icon || "User"] || User;
                            const isActive = workspace.id === currentWorkspace.id;

                            return (
                                <button
                                    key={workspace.id}
                                    onClick={() => {
                                        setCurrentWorkspace(workspace);
                                        setIsOpen(false);
                                    }}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 ${isActive
                                        ? "bg-[var(--workspace-color-muted)] text-[var(--workspace-color)] border border-[var(--workspace-color-muted)]"
                                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border border-transparent"
                                        }`}
                                    style={isActive ? { borderColor: workspace.color } : {}}
                                >
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                                        style={{ backgroundColor: workspace.color }}
                                    >
                                        <Icon size={16} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold">{workspace.name}</p>
                                        <p className="text-[10px] opacity-70">Workspace</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    <div className="border-t border-[var(--border)] mt-2 pt-2">
                        <button className="flex items-center gap-2 px-3 py-2 w-full rounded-xl text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all">
                            <Plus size={14} />
                            <span>Create New Workspace</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
