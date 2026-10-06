"use client";

import { useState } from "react";
import { castVote } from "@/app/actions";

type Vote = 1 | -1;

export default function VoteButtons({
    captionId,
    initialScore,
    initialVote,
}: {
    captionId: string;
    initialScore: number;
    initialVote: Vote | 0;
}) {
    const [score, setScore] = useState(initialScore);
    const [vote, setVote] = useState<Vote | 0>(initialVote);
    const [saving, setSaving] = useState(false);
    const [failed, setFailed] = useState(false);

    async function onVote(next: Vote) {
        if (saving || next === vote) return;

        // Update the screen right away, then confirm with the server.
        const before = { score, vote };
        setScore(score + next - vote);
        setVote(next);
        setSaving(true);
        setFailed(false);

        const result = await castVote(captionId, next);

        // If the save didn't go through, put things back the way they were.
        if (!result.ok) {
            setScore(before.score);
            setVote(before.vote);
            setFailed(true);
        }
        setSaving(false);
    }

    return (
        <div className="vote-box">
            <button
                type="button"
                className="vote-button"
                aria-label="Thumbs up: upvote"
                aria-pressed={vote === 1}
                onClick={() => onVote(1)}
            >
                <span aria-hidden="true">👍</span>
                <span className="vote-label">Upvote</span>
            </button>
            <span className="vote-score" aria-label={`Score ${score}`}>
                {score}
            </span>
            <button
                type="button"
                className="vote-button vote-down"
                aria-label="Thumbs down: downvote"
                aria-pressed={vote === -1}
                onClick={() => onVote(-1)}
            >
                <span aria-hidden="true">👎</span>
                <span className="vote-label">Downvote</span>
            </button>
            {failed && (
                <span className="visually-hidden" role="alert">
                    Vote not saved. Try again.
                </span>
            )}
        </div>
    );
}
