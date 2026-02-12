/**
 * Formats a timestamp into a relative "time" string.
 * Handles both past ("ago") and future ("in X") cases.
 * @param timestamp ISO string or date object
 * @param precision 'highest' (default) for single component (e.g. 2m),
 *                  'full' for down to seconds (e.g. 2m 30s) - though for now we'll stick to simple logic.
 */
export function formatRelativeTime(timestamp: string | number | Date | undefined): string {
    if (!timestamp) return "Never";

    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "Invalid date";

    const now = Date.now();
    const diffInSeconds = Math.floor((date.getTime() - now) / 1000);
    const isFuture = diffInSeconds > 0;
    const absSeconds = Math.abs(diffInSeconds);

    if (absSeconds < 60) {
        return isFuture ? `in ${absSeconds}s` : `${absSeconds}s ago`;
    }

    const diffInMinutes = Math.floor(absSeconds / 60);
    if (diffInMinutes < 60) {
        const remainingSeconds = absSeconds % 60;
        const text = remainingSeconds > 0 ? `${diffInMinutes}m ${remainingSeconds}s` : `${diffInMinutes}m`;
        return isFuture ? `in ${text}` : `${text} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return isFuture ? `in ${diffInHours}h` : `${diffInHours}h ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
        return isFuture ? `in ${diffInDays}d` : `${diffInDays}d ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return isFuture ? `in ${diffInMonths}mo` : `${diffInMonths}mo ago`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return isFuture ? `in ${diffInYears}y` : `${diffInYears}y ago`;
}
