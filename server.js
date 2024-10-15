const express = require('express');
const axios = require('axios');

const app = express();
const port = 3000;

app.get('/', (req, res) => {
    axios.get('https://cloud.timeedit.net/be_kuleuven/web/public/s.ics?sid=7&type=student&field=student.schedule.id&value=DDCDECA0F2D01EEEB5EAE634F510D029')
        .then(response => {
            const icsIN = response.data;
            const url = new URL('https://cloud.timeedit.net/be_kuleuven/web/public/s.ics?sid=7&type=student&field=student.schedule.id&value=DDCDECA0F2D01EEEB5EAE634F510D029');
            const value = url.searchParams.get('value'); // Extracted dynamically from the URL
            const dateTime = new Date().toISOString().replace(/[:.]/g, '-'); // Format date and time
            const fileName = `ToledoAgenda_${value}_${dateTime}.ics`;

            //console.log(icsIN)

            let icsOUT = icsIN
            let done = false
            let lastIndex = 0

            while (!done) {
                let iSUM = icsOUT.indexOf('SUMMARY:', lastIndex)
                let iSLASH = icsOUT.indexOf('\\', iSUM)
                let iEND = icsOUT.indexOf('LOCATION:', iSLASH)
                icsOUT = icsOUT.substr(0, iSLASH) + "\n" + icsOUT.substr(iEND)
                lastIndex = iSUM + 1
                if (iSUM == -1) {
                    done = true
                }
            }

            console.log(icsOUT)

            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Content-Type', 'text/calendar');
            res.send(icsOUT);
        })
        .catch(error => {
            console.error('Error fetching the ICS file:', error);
            res.status(500).send('Error fetching the ICS file');
        });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
