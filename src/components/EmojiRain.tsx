const EMOJIS = ["😂", "🤣", "😆", "😹"];
const DROPS = 28;

// Laughing emojis falling behind the page. Purely decorative, so screen readers skip it.
export default function EmojiRain() {
    return (
        <div className="emoji-rain" aria-hidden="true">
            {Array.from({ length: DROPS }, (_, i) => {
                // Spread the drops out with simple arithmetic instead of random numbers,
                // so the server and the browser always draw the same thing.
                const left = (i * 37) % 100;
                const size = 1.2 + ((i * 7) % 5) * 0.35;
                const duration = 7 + ((i * 5) % 8);
                const delay = -((i * 13) % 15);
                return (
                    <span
                        key={i}
                        style={{
                            left: `${left}%`,
                            fontSize: `${size}rem`,
                            animationDuration: `${duration}s`,
                            // A negative delay starts each drop partway down, so it's already raining on load.
                            animationDelay: `${delay}s`,
                        }}
                    >
                        {EMOJIS[i % EMOJIS.length]}
                    </span>
                );
            })}
        </div>
    );
}
