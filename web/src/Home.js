import React, { Component } from 'react';
import Chromecast from "./Chromecast";
import axios from 'axios';
import SocketIO from 'socket.io-client';

class Home extends Component {
    constructor(props) {
        super(props);

        this.state = {
            chromecasts: [],
            videos: [],
            video: {
                chunkLength: 0,
                downloaded: 0,
                total: 0
            }
        }

        this.socket = new SocketIO('/');
    }

    async fetchChromecasts() {
        try {
            const response = await axios('/api/devices');
            const data = response.data;

            this.setState({ chromecasts: data.data });
        } catch (e) {
            console.log(e);
        }
    }

    async fetchVideos() {
        try {
            const response = await axios('/api/videos');
            const data = response.data;

            this.setState({ videos: data.data });
        } catch (e) {
            console.log(e);
        }
    }

    renderChromecast(data) {
        return <Chromecast key={data.id} data={data} />;
    }

    renderOption(name, id) {
        return <option key={id} value={id}>{name}</option>;
    }

    async playVideo(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const videoId = formData.get('video');
        const chromecastId = formData.get('chromecast');

        try {
            await axios(`/api/devices/${chromecastId}/play/${videoId}`);

            document.location.reload();
        } catch (e) {
            console.log(e);
        }
    }

    async processVideo(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const videoUrl = formData.get('video');

        try {
            await axios(`/api/videos/process?url=${videoUrl}`);

            document.location.reload();
        } catch (e) {
            console.log(e);
        }
    }

    componentWillMount() {
        this.fetchChromecasts();
        this.fetchVideos();

        this.socket.on('videoProgress', (data) => {
            this.setState({
                video: data
            });

            //if (data.downloaded === data.total) document.location.reload();
        });
    }

    calculateProgressBar(current, total) {
        return (current / total) * 100;
    }

    render() {
        return (
            <div className="bg-gray-900">
                <div className="w-full min-h-screen max-w-4xl mx-auto py-10 px-3">
                    <div>
                        <label className="font-bold text-white text-md">Chromecasts</label>

                        <div className="grid grid-cols-1 gap-3 mt-3">
                            {this.state.chromecasts.map(chromecast => this.renderChromecast(chromecast))}
                        </div>
                    </div>

                    <div className="mt-10">
                        <label className="font-bold text-white text-md mt-10">Play Videos</label>

                        <div className="bg-gray-800 rounded-lg p-3 w-full justify-between flex flex-col sm:flex-row">
                            <form onSubmit={this.playVideo}>
                                <div className="flex flex-col sm:w-1/2 sm:mr-1">
                                    <label className="text-white font-bold">Select a Video</label>

                                    <select name="video">
                                        {this.state.videos.map(video => this.renderOption(`${video.title} - ${video.author}`, video.id))}
                                    </select>
                                </div>

                                <div className="flex flex-col sm:w-1/2 sm:ml-1 mt-2">
                                    <label className="text-white font-bold">Select a Chromecast</label>

                                    <select name="chromecast">
                                        {this.state.chromecasts.map(chromecast => this.renderOption(chromecast.name, chromecast.id))}
                                    </select>
                                </div>

                                <button type="submit" className="bg-green-500 rounded-lg w-full font-bold text-white p-2 mt-2">Play</button>
                            </form>
                        </div>
                    </div>

                    <div className="mt-10">
                        <label className="font-bold text-white text-md mt-10">Current Video Processing</label>

                        <div className="bg-gray-800 rounded-lg p-3 w-full justify-between flex flex-col sm:flex-row">
                            {this.state.video.total === 0 ? <form onSubmit={this.processVideo}>
                                <div className="flex flex-col sm:w-1/2 sm:mr-1">
                                    <label className="text-white font-bold">YouTube URL</label>

                                    <input name="video" placeholder="Video URL" className="rounded-md p-2" />
                                </div>

                                <button type="submit" className="bg-green-500 rounded-lg w-full font-bold text-white p-2 mt-2">Process</button>
                            </form> :
                                <div className="w-full">
                                    <label className="font-bold text-white text-md">Video Transcoding</label>
                                    <div className="relative pt-1">
                                        <div className="overflow-hidden h-2 text-xs flex rounded bg-red-200">
                                            <div style={{ width: `${this.calculateProgressBar(this.state.video.downloaded, this.state.video.total)}%`, transition: 'width 2s' }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500"/>
                                        </div>
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Home;