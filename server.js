const express = require('express');
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from the root directory

app.post('/generate-csv', async (req, res) => {
    try {
        const {
            start_date,
            end_date,
            month_data,
            order_total,
            line_item_1,
            session_entry,
            platforms
        } = req.body;

        // Prepare social media links based on selected platforms
        const social_media_links = [];
        if (platforms.instagram === 'yes') {
            social_media_links.push('https://l.instagram.com/');
        }
        if (platforms.facebook === 'yes') {
            social_media_links.push('https://l.facebook.com/');
        }
        if (platforms.google === 'yes') {
            social_media_links.push('https://www.google.com/');
        }

        // Spawn Python process to run the CSV generator
        const pythonProcess = spawn('python3', [
            'scripts/csv_generator.py',
            '--start-date', start_date,
            '--end-date', end_date,
            '--month-data', JSON.stringify(month_data),
            '--total-price', order_total.toString(),
            '--line-item', line_item_1,
            '--session-entry', session_entry,
            '--social-links', JSON.stringify(social_media_links)
        ]);

        let output = '';
        let error = '';

        // Collect output from Python process
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            error += data.toString();
        });

        // Handle process completion
        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error('Python script error:', error);
                res.status(500).json({
                    success: false,
                    message: 'Error generating CSV file: ' + error
                });
                return;
            }

            // Send success response
            res.json({
                success: true,
                message: 'CSV file generated successfully',
                filePath: '/output/generated_data.csv'
            });
        });

    } catch (error) {
        console.error('Error generating CSV:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating CSV file'
        });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 