const express = require('express');
const cors = require('cors');
const { handleAuthRequest } = require('./auth');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.post('/auth/nonce', async (req, res) => {
    try {
        const { app_id, code } = req.body;
        const result = await handleAuthRequest(null, { appId: app_id, oneTimeCode: code });
        
        if (result.error) {
            res.status(400).json({ error: result.error });
        } else {
            res.json({ auth_token: result.auth_token });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

function startServer() {
    app.listen(PORT, () => {
        console.log(`Auth server running on port ${PORT}`);
    });
}

module.exports = { startServer }; 