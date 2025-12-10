const express = require('express');
const fs = require('fs');
const path = require('path');

// node fetch v2 setup
const fetch = require("node-fetch");
globalThis.fetch = fetch;

const { parseICS, createEventObject } = require('../utils/parseICS');
const router = express.Router();

//scholarship events
const scholarshipEvents = [
    createEventObject({
        id: "sch-001",
        title: "Celebration of Scholarship Opening Ceremony",
        start: "2025-04-15T13:00:00.000Z",
        end: "2025-04-15T14:00:00.000Z",
        location: "Lewis University",
        description: "Opening event for the Celebration of Scholarship.",
        source: "scholarship"
    }),
    createEventObject({
        id: "sch-002",
        title: "Capstone Team Poster Session",
        start: "2025-04-15T15:00:00.000Z",
        end: "2025-04-15T17:00:00.000Z",
        location: "St. Charles Borromeo",
        description: "Students present their capstone projects.",
        source: "scholarship"
    })
];

// refresh
router.get('/', async (req, res) => {
    try {
        const calendarURL = req.query.url;
        let icsContent = "";

        // ics link provided
        if (calendarURL && calendarURL.startsWith("http")) {
            try {
                console.log("Fetching ICS from:", calendarURL);

                const response = await fetch(calendarURL, {
                    method: "GET",
                    headers: {
                        "User-Agent": "Mozilla/5.0",     
                        "Accept": "text/calendar,*/*"    
                    }
                });

                if (!response.ok) {
                    return res.status(400).json({
                        error: "Failed to fetch the provided ICS URL.",
                        status: response.status,
                        statusText: response.statusText
                    });
                }

                icsContent = await response.text();
            } catch (err) {
                console.error("ICS Fetch Error:", err);

                return res.status(500).json({
                    error: "Unable to fetch calendar URL.",
                    details: err.message
                });
            }
        }

        //fallback to local file
        else {
            const calendarPath = path.join(__dirname, '..', 'calendar.ics');

            if (!fs.existsSync(calendarPath)) {
                return res.status(404).json({
                    error: "Local calendar.ics file not found.",
                    path: calendarPath
                });
            }

            icsContent = fs.readFileSync(calendarPath, "utf-8");
        }

        // parce ic content
        const parsedEvents = parseICS(icsContent);

        // merge events
        const allEvents = [...parsedEvents, ...scholarshipEvents];

        return res.json({
            updated: true,
            totalEvents: allEvents.length,
            importedEvents: parsedEvents.length,
            scholarshipEvents: scholarshipEvents.length,
            events: allEvents
        });

    } catch (error) {
        console.error("Refresh Route Error:", error);

        return res.status(500).json({
            error: "Unable to refresh calendar.",
            details: error.message
        });
    }
});

module.exports = router;
