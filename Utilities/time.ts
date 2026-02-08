/**
 * Formats a timestamp into a relative "time ago" string.
 * e.g., "29s ago", "1m ago", "1h ago", "1d ago", "1mo ago", "1y ago"
 */
export function formatTimeAgo(timestamp: string | undefined): string {
    if (!timestamp) return "Never";

    const now = Date.now();
    const diffInSeconds = Math.floor((now - new Date(timestamp).getTime()) / 1000);

    if (diffInSeconds < 60) {
        return `${Math.max(0, diffInSeconds)}s ago`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours}h ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
        return `${diffInDays}d ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return `${diffInMonths}mo ago`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears}y ago`;
}
