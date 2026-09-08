(function () {
    "use strict";

    const EVENTS = {
        noel: { startMonth: 12, startDay: 1, endMonth: 1, endDay: 5 },
        valentin: { startMonth: 2, startDay: 1, endMonth: 2, endDay: 20 },
        paques: { startMonth: 3, startDay: 15, endMonth: 4, endDay: 20 }
    };

    function isDateInRange(now, startMonth, startDay, endMonth, endDay) {
        const m = now.getMonth() + 1;
        const d = now.getDate();

        const start = { m: startMonth, d: startDay };
        const end = { m: endMonth, d: endDay };

        if (start.m < end.m || (start.m === end.m && start.d <= end.d)) {
            if (m < start.m || m > end.m) return false;
            if (m === start.m && d < start.d) return false;
            if (m === end.m && d > end.d) return false;
            return true;
        }

        if (m > start.m || m < end.m) return true;
        if (m === start.m && d >= start.d) return true;
        if (m === end.m && d <= end.d) return true;
        return false;
    }

    function isEventActive(eventId, date = new Date()) {
        const evt = EVENTS[eventId];
        if (!evt) return false;
        return isDateInRange(date, evt.startMonth, evt.startDay, evt.endMonth, evt.endDay);
    }

    window.EventManager = {
        isEventActive
    };
})();
