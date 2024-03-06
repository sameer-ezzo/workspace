

export function toTitleCase(propertyKey: string): string {
    const v = propertyKey
        .replace(/([A-Z])/g, ' $1') // Add space before each uppercase letter for PascalCase
        .replace(/_/g, ' ') // Replace underscores with spaces
        .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCased words
        .trim() // Remove leading and trailing spaces
        .toLowerCase()
    return v.split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
}