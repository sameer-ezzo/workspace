export function camelCaseToTitle(propertyKey: string): string {
    const v = propertyKey
        .replace(/([A-Z])/g, " $1") // Add space before each uppercase letter for PascalCase
        .replace(/_/g, " ") // Replace underscores with spaces
        .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space between camelCased words
        .trim() // Remove leading and trailing spaces
        .toLowerCase();
    return v
        .split(" ")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ");
}

export function pascalCaseToTitle(propertyKey: string): string {
    const v = propertyKey
        .replace(/_/g, " ") // Replace underscores with spaces
        .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space between camelCased words
        .trim() // Remove leading and trailing spaces
        .toLowerCase();
    return v
        .split(" ")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ");
}

export function toNameCase(name: string): string {
    return name
        .split(/[\s_]+/) // Split by spaces or underscores
        .map((word, index, arr) => {
            // Keep middle initials as "M." instead of "M.name"
            if (word.length === 2 && word[1] === ".") {
                return word.toUpperCase();
            }

            // Ensure proper capitalization of hyphenated names or prefixes (e.g., "Al-Sayed")
            return word
                .split("-")
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
                .join("-");
        })
        .join(" ") // Reconstruct the name
        .trim();
}
