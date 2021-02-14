const ytdl = require('ytdl-core');
const fs = require('fs')
const youtubedl = require('youtube-dl')
const { v4: uuid } = require('uuid');
const path = require('path');
const { EventEmitter } = require('events');
const db = require('./db.js');

class VideoProcessor extends EventEmitter {
    constructor() {
        super();

        this.state = { downloaded: 0, total: 0 }
    }

    async processVideo(url) {
        return new Promise(async resolve => {
            const videoId = uuid();
            const videoInfo = await ytdl.getInfo(url);
            let size = 0;
            let downloaded = 0;

            const video = youtubedl(url,
                ['--format=best'],
                { cwd: __dirname });

            const { title, author, videoId: youtubeId } = videoInfo.player_response.videoDetails;

            db.addVideo({ id: videoId, title, author, thumbnail: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` });

            video.on('info', function(info) {
                size = info.size;
            });

            video.on('data', chunk => {
                downloaded += chunk.length;

                this.state = { downloaded, total: size }
            });

            video.pipe(fs.createWriteStream(path.join('videos', `${videoId}.mp4`)));

            video.on('end', () => {
                this.state = { downloaded: 0, total: 0 }

                resolve();
            });
        });
    }
}

module.exports = VideoProcessor;