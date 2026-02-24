"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Show } from "@/types/show";
import { ShowCard } from "./ShowCard";

interface SortableShowCardProps {
    show: Show;
}

/**
 * SortableShowCard - Wrapper que adiciona comportamento de arraste ao ShowCard.
 */
export function SortableShowCard({ show }: SortableShowCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: show.id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 0,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing"
        >
            <ShowCard show={show} />
        </div>
    );
}
