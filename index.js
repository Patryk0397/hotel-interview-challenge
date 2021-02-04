// .env file use to not display the API key in source code
require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const Bottleneck = require('bottleneck');
const axios = require('axios');

var app = express();
const API_KEY = process.env.API_KEY;

app.use(bodyParser.json({urlencoded: true}));

// Sets a bottleneck timeout between requests made (due to API limitation of 2 requests per second)
const limiter = new Bottleneck({
    maxConcurrent: 2,
    minTime: 1000
});

const get = limiter.wrap((url)=>
{
    const axiosConfig = {
        url,
        method: 'GET'
      }
      return axios(axiosConfig)
});

const fetchResults = async (req) =>
{
    console.log(`Request to get metrics for these websites: ${req.body.urls}`);

    // Fetches the data from PageSpeed API
    const results = await Promise.all(req.body.urls.map((url)=> get(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?key=${API_KEY}&url=${url}`)));

    return (results);
}

// POST /metrics
app.post('/metrics', async (req, res) =>
{
    try
    {
        const result = await fetchResults(req);

        // Maps the result of the API into FE friendly format
        const metrics = result.map((response)=>({
            id: response.data.id,
            score: response.data.lighthouseResult.categories.performance.score
        }));

        res.send(metrics);
    }
    catch(err)
    {
        console.log(err);
        res.send(err);
    }   
});

const server = app.listen(8080, () =>
{
    console.log("Listening on port 8080")
});

module.exports = server;
module.exports = fetchResults;
