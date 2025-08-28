function formatNumbers(number, text) {
    let numberText;
    if (number >= 1000000) {
        numberText = (number / 1000000).toFixed(1).replace(/\.0$/, "") + "M " + text;
    } else if (number >= 1000) {
        numberText = (number / 1000).toFixed(1).replace(/\.0$/, "") + "K " + text;
    } else {
        numberText = number + " " + text;
    }

    return numberText;
}

function formatDate(date) {
    const created = new Date(date);
    const now = new Date();
    const diffMs = now - created;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    let timeText;
    if (diffDay >= 365) {
        timeText = Math.floor(diffDay / 365) + " year" + (Math.floor(diffDay / 365) > 1 ? "s" : "") + " ago";
    } else if (diffDay >= 30) {
        timeText = Math.floor(diffDay / 30) + " month" + (Math.floor(diffDay / 30) > 1 ? "s" : "") + " ago";
    } else if (diffDay >= 1) {
        timeText = diffDay + " day" + (diffDay > 1 ? "s" : "") + " ago";
    } else if (diffHr >= 1) {
        timeText = diffHr + " hour" + (diffHr > 1 ? "s" : "") + " ago";
    } else if (diffMin >= 1) {
        timeText = diffMin + " minute" + (diffMin > 1 ? "s" : "") + " ago";
    } else {
        timeText = diffSec + " second" + (diffSec > 1 ? "s" : "") + " ago";
    }

    return timeText;
}
