export default function NameFields({
    firstName,
    lastName,
}: {
    firstName?: string | null;
    lastName?: string | null;
}) {
    return (
        <>
            <label className="retro-label" htmlFor="first_name">
                First name
            </label>
            <input
                className="retro-input"
                id="first_name"
                name="first_name"
                defaultValue={firstName ?? ""}
                autoComplete="given-name"
                maxLength={80}
                required
            />
            <label className="retro-label" htmlFor="last_name">
                Last name
            </label>
            <input
                className="retro-input"
                id="last_name"
                name="last_name"
                defaultValue={lastName ?? ""}
                autoComplete="family-name"
                maxLength={80}
                required
            />
        </>
    );
}
