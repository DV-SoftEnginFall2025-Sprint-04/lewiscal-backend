//this is a utility to parse ICS files into unified event objects

//create a unified event object
function createEventObject({
    id,
    title,
    start,
    end,
    location = "",
    description = "",
    source = "imported"
}) {
    return {
        id,
        title,
        start,
        end,
        location,
        description,
        source
    };
}

//ics parser
function parseICS(icsText) {
    const events = [];
    const lines = icsText.split(/\r?\n/);

    let currentEvent = null;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        if (!line) continue;

        //handle folded lines
        while (i + 1 < lines.length && lines[i + 1].startsWith(" ")) {
            i++;
            line += lines[i].trim();
        }

        if (line === "BEGIN:VEVENT") {
            currentEvent = {};
        }
        else if (line === "END:VEVENT") {
            if (currentEvent) {
                events.push(convertToEventObject(currentEvent));
            }
            currentEvent = null;
        }
        else if (currentEvent) {
            const colonIndex = line.indexOf(":");
            if (colonIndex === -1) continue;

            const key = line.substring(0, colonIndex).split(";")[0];
            const value = line.substring(colonIndex + 1).trim();

            switch (key) {
                case "UID": currentEvent.id = value; break;
                case "SUMMARY": currentEvent.title = value; break;
                case "DESCRIPTION": currentEvent.description = value; break;
                case "LOCATION": currentEvent.location = value; break;
                case "DTSTART": currentEvent.start = parseICSTime(value); break;
                case "DTEND": currentEvent.end = parseICSTime(value); break;
                case "RRULE": currentEvent.rrule = value; break;
            }
        }
    }

    return events;
}

//parser for various ICS time formats
function parseICSTime(dt) {
    try {
        if (dt.includes("TZID=")) {
            dt = dt.split(":")[1];
        }

        // ends with z is utc
        if (dt.endsWith("Z")) {
            return new Date(dt).toISOString();
        }

        // convert local time to ISO string
        if (dt.includes("T")) {
            const year = dt.substring(0, 4);
            const month = dt.substring(4, 6);
            const day = dt.substring(6, 8);
            const hour = dt.substring(9, 11);
            const min = dt.substring(11, 13);

            return new Date(
                `${year}-${month}-${day}T${hour}:${min}:00`
            ).toISOString();
        }

        // date only
        return new Date(
            dt.substring(0, 4) + "-" +
            dt.substring(4, 6) + "-" +
            dt.substring(6, 8)
        ).toISOString();

    } catch (err) {
        console.error("Time parse error:", dt, err);
        return null;
    }
}


//conver ics event to unified event object
function convertToEventObject(raw) {
    return createEventObject({
        id: raw.id ?? `event-${Math.random().toString(36).substring(2)}`,
        title: raw.title ?? "Untitled Event",
        start: raw.start ?? null,
        end: raw.end ?? null,
        location: raw.location ?? "",
        description: raw.description ?? "",
        source: "imported"
    });
}

module.exports = { parseICS, createEventObject };
