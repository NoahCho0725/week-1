"use client";

import { useState, useTransition } from "react";
import { deleteCaption, deleteImage, publishImage } from "@/app/actions";

export type Photo = {
    id: string;
    url: string;
    published: boolean;
    captions: { id: string; content: string }[];
};

// One of the user's own photos, with its captions and the controls to manage them.
export default function PhotoCard({ photo }: { photo: Photo }) {
    const [pending, startTransition] = useTransition();
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState("");

    // Runs a server action. When it succeeds the server sends back the updated
    // list, so this card redraws (or disappears) by itself.
    function run(action: () => Promise<{ ok: boolean }>, failText: string) {
        setError("");
        startTransition(async () => {
            const result = await action();
            if (!result.ok) setError(failText);
        });
    }

    return (
        <article className="retro-card photo-card" aria-busy={pending}>
            <span className="retro-badge">{photo.published ? "[IN FEED]" : "[DRAFT]"}</span>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt="A photo you uploaded" className="photo-preview" loading="lazy" />

            {photo.captions.length === 0 ? (
                <p className="photo-note">No captions left on this photo.</p>
            ) : (
                <ul className="caption-rows">
                    {photo.captions.map((caption) => (
                        <li key={caption.id}>
                            <p>{caption.content}</p>
                            <button
                                type="button"
                                className="small-button danger"
                                disabled={pending}
                                aria-label={`Delete caption: ${caption.content}`}
                                onClick={() => run(() => deleteCaption(caption.id), "Couldn't delete that caption.")}
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {!photo.published && (
                <p className="photo-note">
                    This is a draft, so only you can see it. Delete the captions you don&apos;t want, then save
                    to put the rest in the Rate feed.
                </p>
            )}

            <div className="button-row">
                {!photo.published && (
                    <button
                        type="button"
                        className="retro-button"
                        style={{ fontSize: "0.6rem", padding: "10px 16px" }}
                        disabled={pending || photo.captions.length === 0}
                        onClick={() => run(() => publishImage(photo.id), "Couldn't save. Try again.")}
                    >
                        Save captions
                    </button>
                )}

                {confirming ? (
                    <>
                        <span className="photo-note" style={{ margin: 0 }}>
                            Delete this photo and its captions?
                        </span>
                        <button
                            type="button"
                            className="small-button danger"
                            disabled={pending}
                            onClick={() => run(() => deleteImage(photo.id), "Couldn't delete that photo.")}
                        >
                            Yes, delete
                        </button>
                        <button
                            type="button"
                            className="small-button"
                            disabled={pending}
                            onClick={() => setConfirming(false)}
                        >
                            Cancel
                        </button>
                    </>
                ) : (
                    <button
                        type="button"
                        className="small-button danger"
                        disabled={pending}
                        onClick={() => setConfirming(true)}
                    >
                        Delete photo
                    </button>
                )}
            </div>

            {error && (
                <p className="form-error" role="alert">
                    {error}
                </p>
            )}
        </article>
    );
}
