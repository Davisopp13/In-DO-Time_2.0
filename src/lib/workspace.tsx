"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import type { Workspace } from "@/types";

interface WorkspaceContextValue {
    workspaces: Workspace[];
    currentWorkspace: Workspace | null;
    setCurrentWorkspace: (workspace: Workspace) => void;
    isLoading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

const STORAGE_KEY = "in-do-time-workspace";

export function WorkspaceProvider({
    children,
    initialWorkspaces = []
}: {
    children: React.ReactNode,
    initialWorkspaces?: Workspace[]
}) {
    const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces);
    const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load from localStorage on mount
    useEffect(() => {
        const storedSlug = localStorage.getItem(STORAGE_KEY);
        if (storedSlug && workspaces.length > 0) {
            const workspace = workspaces.find(w => w.slug === storedSlug);
            if (workspace) {
                setCurrentWorkspaceState(workspace);
            } else {
                setCurrentWorkspaceState(workspaces[0]);
            }
        } else if (workspaces.length > 0) {
            setCurrentWorkspaceState(workspaces[0]);
        }
        setIsLoading(false);
    }, [workspaces]);

    const setCurrentWorkspace = useCallback((workspace: Workspace) => {
        setCurrentWorkspaceState(workspace);
        localStorage.setItem(STORAGE_KEY, workspace.slug);

        // Apply workspace color to CSS variable
        document.documentElement.style.setProperty("--workspace-color", workspace.color);

        // Create a muted version for backgrounds
        const hex = workspace.color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        document.documentElement.style.setProperty("--workspace-color-muted", `rgba(${r}, ${g}, ${b}, 0.15)`);
        document.documentElement.style.setProperty("--workspace-color-glow", `rgba(${r}, ${g}, ${b}, 0.3)`);
    }, []);

    // Sync workspace color when currentWorkspace changes
    useEffect(() => {
        if (currentWorkspace) {
            setCurrentWorkspace(currentWorkspace);
        }
    }, [currentWorkspace, setCurrentWorkspace]);

    const value = useMemo(() => ({
        workspaces,
        currentWorkspace,
        setCurrentWorkspace,
        isLoading
    }), [workspaces, currentWorkspace, setCurrentWorkspace, isLoading]);

    return (
        <WorkspaceContext.Provider value={value}>
            {children}
        </WorkspaceContext.Provider>
    );
}

export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (!context) {
        throw new Error("useWorkspace must be used within a WorkspaceProvider");
    }
    return context;
}
