const db = require('./db.js');

const express = require('express');
const app = express();

const http = require('http').Server(app);
const io = require('socket.io')(http);

const mdns = require('mdns');
const browser = mdns.createBrowser(mdns.tcp('googlecast'));

mdns.Browser.defaultResolverSequence[1] = 'DNSServiceGetAddrInfo' in mdns.dns_sd ? mdns.rst.DNSServiceGetAddrInfo() : mdns.rst.getaddrinfo({families:[4]});

const ChromecastDevice = require('./ChromecastDevice');

const VideoProcessor = require('./VideoProcessor');
const videoProcessor = new VideoProcessor();

let connections = [];
setInterval(() => {
    connections.forEach(connection => connection.emit('videoProgress', videoProcessor.state));
}, 1000);

io.on('connection', connection => {
    connections.push(connection);

    connection.on('disconnect', () => connections = connections.filter(conn => conn.id !== connection));
});

const DEVICE_NAME_STRATEGY = 'Basement TV';
let devices = [];

browser.on('serviceUp', async service => {
    const recordData = service.txtRecord;
    const displayName = recordData.fn;

    const isValidCast = displayName.startsWith(DEVICE_NAME_STRATEGY);

    if (isValidCast && !devices.find(device => device.host === service.host)) {
        const chromecastWrapped = new ChromecastDevice(service.addresses[0], displayName);

        chromecastWrapped.on('destroy', () => {
            devices = devices.filter(device => device.name !== chromecastWrapped.name && device.host !== chromecastWrapped.host);
        });

        await chromecastWrapped.connect();
        devices.push(chromecastWrapped);
    }

    console.log('found device "%s" at %s:%d', service.name, service.addresses[0], service.port);
});

browser.start();

app.get('/api/devices', (req, res) => {
    res.json({ success: true, data: devices.map(device => ({ id: device.id, name: device.name, host: device.host, video: device.currentMedia ? db.getVideos().find(video => video.id === device.currentMedia) : null, status: device.status })) });
});

app.get('/api/videos', (req, res) => {
    res.json({ success: true, data: db.getVideos() });
});

app.get('/api/videos/process', (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) return;

    videoProcessor.processVideo(videoUrl);

    res.json({ success: true });
});

app.get('/api/devices/:id/stop', async (req, res) => {
    const deviceId = req.params.id;

    const foundDevice = devices.find(device => device.id === deviceId);
    if (!foundDevice) return res.json({ success: false, message: 'Device not found.' });

    try {
        await foundDevice.stopPlayer();

        res.json({ success: true });
    } catch (e) {
        res.json({success: false, message: e});
    }
});

app.get('/api/devices/:id/play/:video', async (req, res) => {
    const deviceId = req.params.id;
    const videoId = req.params.video;

    const foundDevice = devices.find(device => device.id === deviceId);
    if (!foundDevice) return res.json({ success: false, message: 'Device not found.' });

    const videos = db.getVideos();
    const foundVideo = videos.find(video => video.id === videoId);
    if (!foundVideo) return res.json({ success: false, message: 'Video not found.' });

    try {
        await foundDevice.playVideo(foundVideo.id);

        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, message: e });
    }
});

http.listen(5000);