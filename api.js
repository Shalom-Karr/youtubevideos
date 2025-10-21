const YOUTUBE_API_KEY = 'AIzaSyAoA6-FpWFCF_vpPREQjxcJ6A7suZlYM-w'; // Unified API Key

function timeAgo(date) {
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    const intervals = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'week', seconds: 604800 },
        { label: 'day', seconds: 86400 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 },
        { label: 'second', seconds: 1 },
    ];

    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) {
            return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
        }
    }
    return 'just now';
}

async function searchVideos() {
    const query = document.getElementById('searchInput').value;
    if (!query) return;

    const videoResultsDiv = document.getElementById('videoResults');
    const channelResultsDiv = document.getElementById('channelResults');
    videoResultsDiv.innerHTML = 'Searching...';
    channelResultsDiv.innerHTML = 'Searching...';

    try {
        // VIDEO search
        const videoUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`;
        const videoResponse = await fetch(videoUrl);
        const videoData = await videoResponse.json();
        if (videoData.error) throw new Error(`Video Search Error: ${videoData.error.message}`);
        videoResultsDiv.innerHTML = '';
        videoData.items.forEach(item => {
            const videoId = item.id.videoId;
            const title = item.snippet.title;
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            const thumbnailUrl = item.snippet.thumbnails.high.url;
            const creator = item.snippet.channelTitle;
            const publishedAt = item.snippet.publishedAt;

            const div = document.createElement('div');
            div.className = 'video';
            div.innerHTML = `
                <img src="${thumbnailUrl}" alt="${title}">
                <div class="video-info">
                    <div class="video-title">${title}</div>
                    <div class="video-creator">By: ${creator}</div>
                    <div class="video-time">${timeAgo(new Date(publishedAt))}</div>
                </div>
            `;
            div.onclick = () => {
                window.saveVideo(videoUrl);
                document.getElementById("searchBox").style.display = "none";
            };
            videoResultsDiv.appendChild(div);
        });

        // CHANNEL search
        const channelUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=10&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`;
        const channelResponse = await fetch(channelUrl);
        const channelData = await channelResponse.json();
        if (channelData.error) throw new Error(`Channel Search Error: ${channelData.error.message}`);
        channelResultsDiv.innerHTML = '';
        channelData.items.forEach(item => {
            const channelId = item.id.channelId;
            const title = item.snippet.title;
            const thumbnailUrl = item.snippet.thumbnails.high.url;
            const description = item.snippet.description;

            const div = document.createElement('div');
            div.className = 'channel-result';
            const titleWOspaces = title.replace(/\s/g, '');

            div.innerHTML = `
                <img src="${thumbnailUrl}" alt="${title}">
                <div class="channel-info">
                    <div class="channel-title">${title}</div>
                    <div class="channel-description">${description}</div>
                </div>
                <button class="follow-btn">${channels[titleWOspaces] ? 'Unfollow' : 'Follow'}</button>
            `;

            div.querySelector('.follow-btn').onclick = (e) => {
                e.stopPropagation();
                if (channels[titleWOspaces]) {
                    removeYoutubeChannel(titleWOspaces);
                    e.target.textContent = 'Follow';
                } else {
                    addYoutubeChannel(titleWOspaces, title, channelId, thumbnailUrl);
                    e.target.textContent = 'Unfollow';
                }
            };
            channelResultsDiv.appendChild(div);
        });

    } catch (error) {
        console.error("YouTube Search Error:", error);
        videoResultsDiv.innerHTML = `<p style="color:red;">${error.message}</p>`;
        channelResultsDiv.innerHTML = `<p style="color:red;">${error.message}</p>`;
    }
}

function showTab(tab) {
    document.getElementById('videoResults').style.display = tab === 'videos' ? 'block' : 'none';
    document.getElementById('channelResults').style.display = tab === 'channels' ? 'block' : 'none';
    document.getElementById('videosTab').classList.toggle('filter-selected', tab === 'videos');
    document.getElementById('channelsTab').classList.toggle('filter-selected', tab === 'channels');
}

async function getLatestVideos(channelId) {
    try {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=5&order=date&type=video&key=${YOUTUBE_API_KEY}`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        if (searchData.error) throw new Error(`Latest Videos Error: ${searchData.error.message}`);
        return searchData.items.map(item => ({ id: item.id.videoId, snippet: item.snippet }));
    } catch (err) {
        console.error(`Error fetching latest videos for ${channelId}:`, err);
        return [];
    }
}
