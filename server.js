const express = require('express');
const axios = require('axios');
const qs = require('querystring');
const app = express();

const {
  IG_APP_ID,
  IG_APP_SECRET,
  IG_REDIRECT_URI,
  PORT = 3000
} = process.env;

// Step 1: Redirect user to Instagram login
app.get('/auth/instagram', (req, res) => {
  const url = 'https://api.instagram.com/oauth/authorize' +
    '?client_id=' + IG_APP_ID +
    '&redirect_uri=' + encodeURIComponent(IG_REDIRECT_URI) +
    '&scope=user_profile,user_media' +
    '&response_type=code';
  res.redirect(url);
});

// Step 2: Handle callback & exchange code for access token
app.get('/auth/instagram/callback', async (req, res) => {
  const code = req.query.code;
  try {
    // Exchange code for short-lived token
    const tokenRes = await axios.post(
      'https://api.instagram.com/oauth/access_token',
      qs.stringify({
        client_id: IG_APP_ID,
        client_secret: IG_APP_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: IG_REDIRECT_URI,
        code
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const shortToken = tokenRes.data.access_token;

    // Exchange for long-lived token
    const longTokenRes = await axios.get(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${IG_APP_SECRET}&access_token=${shortToken}`
    );
    const access_token = longTokenRes.data.access_token;

    // Send access token to browser (you can later store it securely)
    res.send(`Access Token: ${access_token}`);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send('Auth failed');
  }
});

// Start the server
app.listen(PORT, () => console.log('Server running on port', PORT));
