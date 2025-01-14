const express = require('express');
const axios = require('axios');
const ical2json = require("ical2json");

const app = express();
const port = process.env.PORT || 3000;

app.get('/old', (req, res) => {
    axios.get('https://cloud.timeedit.net/be_kuleuven/web/public/s.ics?sid=7&type=student&field=student.schedule.id&value=DDCDECA0F2D01EEEB5EAE634F510D029')
        .then(response => {
            const icsIN = response.data;
            const url = new URL('https://cloud.timeedit.net/be_kuleuven/web/public/s.ics?sid=7&type=student&field=student.schedule.id&value=DDCDECA0F2D01EEEB5EAE634F510D029');
            const value = url.searchParams.get('value'); // Extracted dynamically from the URL
            const dateTime = new Date().toISOString().replace(/[:.]/g, '-'); // Format date and time
            const fileName = `ToledoAgenda_${value}_${dateTime}.ics`;
            let icsOUT = icsIN

            // Deletes all groep 2 events
            {
                let done = false
                let lastIndex = 0
                while (!done) {
                    let iGROEP = icsOUT.indexOf('Groep 2', lastIndex)
                    let iBEGIN = icsOUT.lastIndexOf('BEGIN:VEVENT', iGROEP)
                    let iEND = icsOUT.indexOf('BEGIN:VEVENT', iGROEP)
                    lastIndex = iEND + 1
                    if (iGROEP == -1) {
                        done = true
                    } else {
                        icsOUT = icsOUT.substr(0, iBEGIN) + "\n" + icsOUT.substr(iEND)
                    }
                }
            }

            // Clean up location
            {
                let done = false
                let lastIndex = 0
                while (!done) {
                    let iGROEP = icsOUT.indexOf('Groep 2', lastIndex)
                    let iBEGIN = icsOUT.lastIndexOf('BEGIN:VEVENT', iGROEP)
                    let iEND = icsOUT.indexOf('BEGIN:VEVENT', iGROEP)
                    lastIndex = iEND + 1
                    if (iGROEP == -1) {
                        done = true
                    } else {
                        icsOUT = icsOUT.substr(0, iBEGIN) + "\n" + icsOUT.substr(iEND)
                    }
                }
            }

            // Deletes V5R360 chars
            {
                let done = false
                let lastIndex = 0
                while (!done) {
                    let iSUM = icsOUT.indexOf('SUMMARY:', lastIndex)
                    let iSTART = iSUM + 8
                    let iEND = iSTART + 7
                    //let iBEGIN = icsOUT.lastIndexOf('BEGIN:VEVENT', iGROEP)
                    //let iEND = icsOUT.indexOf('BEGIN:VEVENT', iGROEP)
                    lastIndex = iSUM + 1
                    if (iSUM == -1) {
                        done = true
                    } else {
                        icsOUT = icsOUT.substr(0, iSTART) + icsOUT.substr(iEND)
                    }
                }
            }


            let regex = / \(MW\)/g;
            icsOUT = icsOUT.replace(regex, "")

            // Makes all sumaries more readable and compact
            {
                let done = false
                let lastIndex = 0
                while (!done) {
                    let iSUM = icsOUT.indexOf('SUMMARY:', lastIndex)
                    let iSLASH = icsOUT.indexOf('\\', iSUM)
                    let iEND = icsOUT.indexOf('LOCATION:', iSLASH)
                    lastIndex = iSUM + 1
                    if (iSUM == -1) {
                        done = true
                    } else {
                        icsOUT = icsOUT.substr(0, iSLASH) + "\n" + icsOUT.substr(iEND)
                    }
                }
            }

            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            console.log("Sending ICS file");
            res.send(icsOUT);
        })
        .catch(error => {
            console.error('Error fetching the ICS file:', error);
            res.status(500).send('Error fetching the ICS file');
        });
});

app.get('/:urlId', (req, res) => {
    axios.get('https://cloud.timeedit.net/be_kuleuven/web/public/s.ics?sid=7&type=student&field=student.schedule.id&value=' + req.params.urlId /*DDCDECA0F2D01EEEB5EAE634F510D029*/)
        .then(response => {
            const icsIN = response.data;
            const value = req.params.urlId;
            const dateTime = new Date().toISOString().replace(/[:.]/g, '-'); // Format date and time
            const fileName = `ToledoAgenda_${value}_${dateTime}.ics`;
            let output = ical2json.convert(icsIN);

            //FILTER OUT GROEP 2 EVENTS
            output.VCALENDAR[0].VEVENT = output.VCALENDAR[0].VEVENT.filter(event => !event.SUMMARY.includes('Groep 2'));

            output.VCALENDAR[0].VEVENT.forEach(event => {
                //BACKUP TO DESCRIPTION
                event.DESCRIPTION = event.SUMMARY + "\n\n" + event.LOCATION + "\n\n" + event.DESCRIPTION;

                //CLEAN UP SUMMARY
                event.SUMMARY = event.SUMMARY.replace(' (MW)', '');
                event.SUMMARY = event.SUMMARY.substring(7, event.SUMMARY.indexOf('\\')).trim();

                //CLEAN UP LOCATION
                if (event.LOCATION.indexOf('.') !== -1) {
                    event.LOCATION = event.LOCATION.substring(0, event.LOCATION.indexOf(" ", event.LOCATION.indexOf('.'))).trim();
                }
                event.LOCATION = event.LOCATION.replace('- ', '');
            });

            let icsOutput = ical2json.revert(output);
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            console.log("Sending ICS file");
            res.send(icsOutput);
        })
});

app.get('/new', (req, res) => {
    axios.get('https://cloud.timeedit.net/be_kuleuven/web/public/s.ics?sid=7&type=student&field=student.schedule.id&value=DDCDECA0F2D01EEEB5EAE634F510D029')
        .then(response => {
            const icsIN = response.data;
            const url = new URL('https://cloud.timeedit.net/be_kuleuven/web/public/s.ics?sid=7&type=student&field=student.schedule.id&value=DDCDECA0F2D01EEEB5EAE634F510D029');
            const value = url.searchParams.get('value'); // Extracted dynamically from the URL
            const dateTime = new Date().toISOString().replace(/[:.]/g, '-'); // Format date and time
            const fileName = `ToledoAgenda_${value}_${dateTime}.ics`;
            let output = ical2json.convert(icsIN);

            //FILTER OUT GROEP 2 EVENTS
            output.VCALENDAR[0].VEVENT = output.VCALENDAR[0].VEVENT.filter(event => !event.SUMMARY.includes('Groep 2'));

            output.VCALENDAR[0].VEVENT.forEach(event => {
                //BACKUP TO DESCRIPTION
                event.DESCRIPTION = event.SUMMARY + " |Location: " + event.LOCATION + " |Description: " + event.DESCRIPTION;

                //CLEAN UP SUMMARY
                event.SUMMARY = event.SUMMARY.replace(' (MW)', '');
                event.SUMMARY = event.SUMMARY.substring(7, event.SUMMARY.indexOf('\\')).trim();

                //CLEAN UP LOCATION
                if (event.LOCATION.indexOf('.') !== -1) {
                    event.LOCATION = event.LOCATION.substring(0, event.LOCATION.indexOf(" ", event.LOCATION.indexOf('.'))).trim();
                }
                event.LOCATION = event.LOCATION.replace('- ', '');
            });

            let icsOutput = ical2json.revert(output);
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            console.log("Sending ICS file");
            res.send(icsOutput);
        })
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
