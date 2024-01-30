const express = require('express');
const cors = require('cors');
const axios = require('axios');
const urlParser = require('url');

// Local On-Demand Cors Proxy (LODCP)
async function StartLODCP (fullUrl, customDNSResolver, port) {
    const RunLODCP = function (fullUrl, port = 7007, customDNSResolver = '1.1.1.1') {
        const parsedUrl = urlParser.parse(fullUrl);
        const proxy = express();
        proxy.use(cors());
        proxy.options('*', cors());
        proxy.use('/', async function (req, res) {
            try {
                const axiosConfig = {
                    method: 'get',
                    url: fullUrl + req.url,
                    responseType: 'json',
                    dns: {
                        resolver: customDNSResolver
                    }
                };
                const response = await axios(axiosConfig);
                const accessControlAllowOriginHeader = response.headers['access-control-allow-origin'];
                if (accessControlAllowOriginHeader && accessControlAllowOriginHeader !== '*') {
                    response.headers['access-control-allow-origin'] = '*';
                }
                res.send(response.data);
            } catch (error) {
                console.error(`Error proxying request:`, error);
                res.status(500).send('Internal Server Error');
            }
        });
        const server = proxy.listen(port);
        return { server, url: `http://localhost:${port}` };
    };
    const { server, url } = RunLODCP(fullUrl, undefined, customDNSResolver);
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    } finally {
        server.close();
    }
};

// Example usage:
const TargetURL = 'https://www.wmtw.com/nowcast/status';

StartLODCP(TargetURL, '1.1.1.1', 7007).then(data => {console.log(data)}).catch();
