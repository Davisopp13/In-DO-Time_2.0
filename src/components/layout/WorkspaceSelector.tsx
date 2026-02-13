"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useWorkspace } from "@/lib/workspace";
import { ChevronDown, Ship, Code, User, Bot, Plus } from "lucide-react";
import Sheet from "@/components/ui/Sheet";
import { Z_INDEX } from "@/lib/constants";
import { useIsMobile } from "@/hooks/useMediaQuery";

const iconMap: Record<string, any> = {
    Ship,
    Code,
    User,
    Bot,
};

export default function WorkspaceSelector() {
    const { workspaces, currentWorkspace, setCurrentWorkspace } = useWorkspace();
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null!);
    const dropdownRef = useRef<HTMLDivElement>(null!);
    const isMobile = useIsMobile();

    const close = useCallback(() => setIsOpen(false), []);

    // Desktop: close on outside click
    useEffect(() => {
        if (isMobile || !isOpen) return;
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(event.target as Node)
            ) {
                close();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isMobile, isOpen, close]);

    // Desktop: close on Escape
    useEffect(() => {
        if (isMobile || !isOpen) return;
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") close();
        };
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [isMobile, isOpen, close]);

    if (!currentWorkspace) return null;

    const CurrentIcon = iconMap[currentWorkspace.icon || "User"] || User;

    const handleSelect = (workspace: typeof currentWorkspace) => {
        setCurrentWorkspace(workspace);
        close();
    };

    const workspaceList = (
        <div className="flex flex-col gap-1">
            {workspaces.map((workspace) => {
                const Icon = iconMap[workspace.icon || "User"] || User;
                const isActive = workspace.id === currentWorkspace.id;

                return (
                    <button
                        key={workspace.id}
                        onClick={() => handleSelect(workspace)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 min-h-[44px] ${isActive
                            ? "bg-[var(--workspace-color-muted)] text-[var(--workspace-color)] border border-[var(--workspace-color-muted)]"
                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border border-transparent"
                            }`}
                        style={isActive ? { borderColor: workspace.color } : {}}
                    >
                        <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                            style={{ backgroundColor: workspace.color }}
                        >
                            <Icon size={18} />
                        </div>
                        <div className="text-left">
                            <p className="font-semibold">{workspace.name}</p>
                            <p className="text-[10px] opacity-70">Workspace</p>
                        </div>
                    </button>
                );
            })}

            <div className="border-t border-[var(--border)] mt-2 pt-2">
                <button className="flex items-center gap-2 px-3 py-2.5 w-full rounded-xl text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all min-h-[44px]">
                    <Plus size={14} />
                    <span>Create New Workspace</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            <button
                ref={triggerRef}
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full glass border-[var(--workspace-color-muted)] hover:border-[var(--workspace-color)] transition-all duration-300 group"
                aria-label={`Switch workspace, current: ${currentWorkspace.name}`}
                aria-expanded={isOpen}
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

            {/* Mobile: Bottom Sheet */}
            {isMobile && (
                <Sheet open={isOpen} onClose={close} title="Switch Workspace">
                    {workspaceList}
                </Sheet>
            )}

            {/* Desktop: Portal dropdown */}
            {!isMobile && isOpen && (
                <DesktopDropdown triggerRef={triggerRef} dropdownRef={dropdownRef}>
                    <p className="trail-marker px-3 py-2 text-[10px]">Switch Workspace</p>
                    <div className="mt-1">{workspaceList}</div>
                </DesktopDropdown>
            )}
        </>
    );
}

/** Desktop dropdown rendered via portal to avoid z-index stacking context issues */
function DesktopDropdown({
    triggerRef,
    dropdownRef,
    children,
}: {
    triggerRef: React.RefObject<HTMLButtonElement>;
    dropdownRef: React.RefObject<HTMLDivElement>;
    children: React.ReactNode;
}) {
    const [pos, setPos] = useState({ top: 0, left: 0 });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        setPos({
            top: rect.bottom + 8,
            left: rect.left,
        });
    }, [triggerRef]);

    if (!mounted) return null;

    return createPortal(
        <div
            ref={dropdownRef}
            className="fixed w-72 glass p-2"
            style={{
                top: pos.top,
                left: pos.left,
                zIndex: Z_INDEX.dropdown_portal,
                borderRadius: "1.25rem",
            }}
        >
            {children}
        </div>,
        document.body
    );
}
