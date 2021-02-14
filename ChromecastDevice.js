const config = require('./config.json');
const { EventEmitter } = require('events');
const { Client, DefaultMediaReceiver } = require('castv2-client');
const { v4: uuid } = require('uuid');

class ChromecastDevice extends EventEmitter {
    constructor(host, name) {
        super();

        this.id = uuid();
        this.name = name;
        this.host = host;

        this.client = new Client();
        this.player = null;

        this.connected = false;
        this.currentMedia = null;
        this.status = null;

        this.client.on('error', () => {
            this.emit('destroy');

            this.connected = false;
            this.client.close();
        });

        this.client.on('close', () => {
            this.emit('destroy');
            this.connected = false;
        });
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.client.connect(this.host, () => {
                this.connected = true;
                resolve();
            });
        });
    }

    async createMediaPlayer() {
        return new Promise((resolve, reject) => {
            this.client.launch(DefaultMediaReceiver, (err, player) => {
                if (err) return reject(err);

                this.player = player;
                this.player.on('status', this.handleStatus); // register events

                this.statusInterval = setInterval(() => {
                    if (!this.connected) return;

                    this.player.getStatus((err, status) => {
                        if (err) return console.log(err);

                        this.handleStatus(status);
                    });
                }, 2000);

                resolve(player);
            });
        });
    }

    async handleStatus(status) {
        if (!status) return;

        this.status = status;
        this.emit('playerUpdate', status);
    }

    async playVideo(id) {
        if (!this.player) {
            try {
                await this.createMediaPlayer();
            } catch (e) {
                await this.destroy();

                return;
            }
        }

        return new Promise((resolve, reject) => {
            this.player.queueLoad(
                [
                    {
                        autoplay: true,
                        preloadTime: 4,
                        media: {
                            contentId: `http://${config.host}/media/${id}.mp4`,
                            contentType: 'video/mp4',
                            streamType: 'BUFFERED'
                        }
                    }
                ],
                {
                    autoplay: true,
                    repeatMode: 'REPEAT_SINGLE'
                }, async (err, status) => {
                    if (err) return reject(err);

                    this.currentMedia = id;
                    resolve(status);
            });
        });
    }

    async stopPlayer() {
        return new Promise((resolve, reject) => {
            this.player.stop(err => {
                if (err) reject(err);

                this.currentMedia = null;
                this.status = null;
                resolve();
            });
        })
    }

    async destroy() {
        this.connected = false;
        clearInterval(this.statusInterval);

        return new Promise(resolve => {
            if (this.player) {
                this.player.stop(err => {
                    if (err) console.log(err);

                    this.client.close();
                    this.emit('destroy');
                    resolve();
                });
            } else {
                this.client.close();
                this.emit('destroy');
                resolve();
            }
        });
    }

    async seekTo(time) {
        if (!this.player) return;

        return new Promise((resolve, reject) =>  {
            this.player.seek(time, (err, status) => {
                if (err) return reject(err);

                resolve(status);
            });
        });
    }
}

module.exports = ChromecastDevice;