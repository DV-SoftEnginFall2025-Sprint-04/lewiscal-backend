const express = require('express');
const fetch = require('node-fetch');
const { parseICS } = require('../utils/parseICS');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const calendarURL = req.query.url;

        if (!calendarURL) {
            return res.status(400).json({
                error: "No calendar URL provided."
            });
        }

        // fetch the ics file while supporting redirects
        let response;
        try {
            response = await fetch(calendarURL, {
                method: "GET",
                redirect: "follow",   
                headers: {
                    "User-Agent": "Mozilla/5.0",  
                    "Accept": "text/calendar, text/plain, */*" 
                }
            });
        } catch (err) {
            return res.status(500).json({
                error: "Network error while attempting to fetch the ICS URL.",
                details: err.message,
                attemptedURL: calendarURL
            });
        }

        if (!response.ok) {
            return res.status(400).json({
                error: "Failed to fetch the provided ICS URL.",
                status: response.status,
                statusText: response.statusText,
                attemptedURL: calendarURL
            });
        }

        // raw ics text
        let icsText = await response.text();

        // catch for invalid ics files
        if (!icsText.includes("BEGIN:VEVENT")) {
            return res.status(400).json({
                error: "The downloaded file is not a valid ICS calendar.",
                sample: icsText.substring(0, 200)
            });
        }

        //parse icss
        let events = [];
        try {
            events = parseICS(icsText);
        } catch (err) {
            return res.status(500).json({
                error: "Failed to parse ICS calendar.",
                details: err.message
            });
        }

        //success
        return res.json({
            updated: true,
            eventCount: events.length,
            events
        });

    } catch (err) {
        console.error("Unexpected refresh error:", err);
        return res.status(500).json({
            error: "Unexpected server error.",
            details: err.message
        });
    }
});

module.exports = router;
