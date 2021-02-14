const path = require('path');
const fs = require('fs');

const getVideos = () => {
    const videosFile = fs.readFileSync(path.join(__dirname, 'videos.json'), { encoding: 'utf-8' });

    return JSON.parse(videosFile);
}

const addVideo = video => {
    const videos = getVideos();
    videos.push(video);

    fs.writeFileSync(path.join(__dirname, 'videos.json'), JSON.stringify(videos), { encoding: 'utf-8' });

    return videos;
}

module.exports = { addVideo, getVideos }