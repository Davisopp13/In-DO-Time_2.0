import { HTMLAttributes } from "react";

function Skeleton({
    className,
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={`animate-pulse rounded-2xl bg-[var(--surface-hover)] ${className}`}
            {...props}
        />
    );
}

export { Skeleton };
