const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3001;
const AUTH_BASE_URL = 'https://api.shapes.inc/auth';
const HARDCODED_APP_ID = 'f6263f80-2242-428d-acd4-10e1feec44ee';

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.post('/auth/nonce', async (req, res) => {
    try {
        const { code } = req.body;
        const app_id = HARDCODED_APP_ID;

        if (!app_id || !code) {
            return res.status(400).json({ message: 'Missing app_id or code' });
        }

        console.log('Proxying to Shapes Inc. with:', { app_id, code }); // for /auth/nonce
        const response = await axios.post(`${AUTH_BASE_URL}/nonce`, { app_id, code });

        // Debug logs
        console.log('Shapes Inc. /nonce response status:', response.status);
        console.log('Shapes Inc. /nonce response data:', response.data);

        if (response.status === 200 && response.data.auth_token) {
            return res.status(200).json({ auth_token: response.data.auth_token });
        } else {
            return res.status(response.status).json({ message: response.data.message || 'Failed to exchange code for token.' });
        }
    } catch (error) {
        const status = error.response ? error.response.status : 500;
        const message = error.response?.data?.message || error.message || 'An unknown error occurred';
        console.error('Auth proxy error:', message);
        return res.status(status).json({ message: `Server error: ${message}` });
    }
});

app.post('/auth/generate', async (req, res) => {
    try {
        const app_id = HARDCODED_APP_ID;

        console.log('Proxying to Shapes Inc. with:', { app_id }); // for /auth/generate
        const response = await axios.post(`${AUTH_BASE_URL}/generate`, { app_id });

        // Debug logs
        console.log('Shapes Inc. /generate response status:', response.status);
        console.log('Shapes Inc. /generate response data:', response.data);

        if (response.status === 200 && response.data.code) {
            return res.status(200).json({ code: response.data.code });
        } else {
            return res.status(response.status).json({ message: response.data.message || 'Failed to generate code.' });
        }
    } catch (error) {
        const status = error.response ? error.response.status : 500;
        const message = error.response?.data?.message || error.message || 'An unknown error occurred';
        console.error('Auth proxy error:', message);
        return res.status(status).json({ message: `Server error: ${message}` });
    }
});

function startServer() {
    app.listen(PORT, () => {
        console.log(`Auth proxy server running on port ${PORT}`);
    });
}

module.exports = { startServer };

