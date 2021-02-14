import React, { Component } from 'react';
import axios from 'axios';

class Chromecast extends Component {
    constructor(props) {
        super(props);

        this.stopVideo = this.stopVideo.bind(this);
    }

    calculateProgressBar(current, total) {
        return (current / total) * 100;
    }

    convertTime(milliseconds) {
        let seconds = (milliseconds / 1000).toFixed(0);
        let minutes = Math.floor(seconds / 60);
        let hours = "";

        if (minutes > 59) {
            hours = Math.floor(minutes / 60);
            hours = (hours >= 10) ? hours : "0" + hours;
            minutes = minutes - (hours * 60);
            minutes = (minutes >= 10) ? minutes : "0" + minutes;
        }

        seconds = Math.floor(seconds % 60);
        seconds = (seconds >= 10) ? seconds : "0" + seconds;

        if (hours !== "") return hours + ":" + minutes + ":" + seconds;

        return minutes + ":" + seconds;
    }

    async stopVideo() {
        try {
            const response = await axios(`/api/devices/${this.props.data.id}/stop`);
            //const data = response.data;

            document.location.reload();
        } catch (e) {
            console.log(e);
        }
    }

    render() {
        const currentTime = this.props.data.status?.currentTime;
        const totalTime = this.props.data.status?.media?.duration;

        return (
            <div className="bg-gray-800 shadow-lg rounded-lg p-3">
                <div className="flex flex-row">
                    {this.props.data.video ? <div className="flex flex-col mr-2">
                        <img src={this.props.data.video?.thumbnail} className="rounded-lg w-24"  alt=""/>
                    </div> : null}

                    <div className="flex flex-row justify-between w-full items-center">
                        <div className="flex flex-col">
                            <h1 className="text-white font-bold text-xl">{this.props.data.video?.title ? this.props.data.video.title : "Nothing playing"}</h1>
                            <h1 className="text-white font-semibold text-sm">{this.props.data.video?.author ? this.props.data.video.author : "No author"}</h1>
                        </div>

                        <div className="flex flex-col text-right">
                            <h1 className="text-white font-bold text-xl">{this.props.data.name}</h1>
                            <h1 className="text-gray-500 font-semibold text-sm">{this.props.data.id}</h1>
                        </div>
                    </div>
                </div>

                <div className="mt-2 flex flex-col">
                    <div className="flex flex-row justify-between">
                        <label className="text-white font-semibold">{currentTime ? this.convertTime(currentTime * 1000) : '0:00'}</label>

                        <label className="text-white font-semibold">{currentTime ? this.convertTime(totalTime * 1000) : '0:00'}</label>
                    </div>

                    <div className="relative pt-1">
                        <div className="overflow-hidden h-2 text-xs flex rounded bg-red-200">
                            <div style={{ width: `${this.calculateProgressBar(currentTime, totalTime)}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500"/>
                        </div>
                    </div>

                    <div className="flex flex-row">
                        {this.props.data.video !== null ? <button onClick={this.stopVideo} className="bg-red-500 rounded-md py-1 px-2 font-semibold text-white mt-3">Stop</button> : null}
                    </div>
                </div>
            </div>
        );
    }
}

export default Chromecast;