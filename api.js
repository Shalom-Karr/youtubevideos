const apiKeys = [
    'AIzaSyDvk_OExE0RMk_3GxrxnLDOr9YOmGAm6ps',
    'AIzaSyB_O2s3Z5hJ_X8gCbjQSLZ8IfuygNwshBk'
];

let currentApiKeyIndex = 0; // Start with the first API key

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
    const videoResultsDiv = document.getElementById('videoResults');
    const channelResultsDiv = document.getElementById('channelResults');
    videoResultsDiv.innerHTML = '';
    channelResultsDiv.innerHTML = '';

    let success = false;

    while (!success) {
        const apiKey = apiKeys[currentApiKeyIndex];

        // VIDEO search
        const videoUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(query)}&key=${apiKey}`;
        const videoResponse = await fetch(videoUrl);
        const videoData = await videoResponse.json();

        if (videoData.error && videoData.error.code === 403 && videoData.error.errors[0].reason === 'quotaExceeded') {
            currentApiKeyIndex = (currentApiKeyIndex + 1) % apiKeys.length;
            continue;
        }

        // CHANNEL search
        const channelUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=10&q=${encodeURIComponent(query)}&key=${apiKey}`;
        const channelResponse = await fetch(channelUrl);
        const channelData = await channelResponse.json();

        success = true;

        // VIDEOS
        videoData.items.forEach(item => {
            const videoId = item.id.videoId;
            const title = item.snippet.title;
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            const thumbnailUrl = item.snippet.thumbnails.high.url;
            const creator = item.snippet.channelTitle;
            const publishedAt = item.snippet.publishedAt;

            const div = document.createElement('div');
            div.className = 'video';

            const img = document.createElement('img');
            img.src = thumbnailUrl;
            img.alt = title;

            const infoDiv = document.createElement('div');
            infoDiv.className = 'video-info';

            const videoTitle = document.createElement('div');
            videoTitle.className = 'video-title';
            videoTitle.textContent = title;

            const videoCreator = document.createElement('div');
            videoCreator.className = 'video-creator';
            videoCreator.textContent = `By: ${creator}`;

            const videoTimeAgo = document.createElement('div');
            videoTimeAgo.className = 'video-time';
            videoTimeAgo.textContent = timeAgo(new Date(publishedAt));

            infoDiv.appendChild(videoTitle);
            infoDiv.appendChild(videoCreator);
            infoDiv.appendChild(videoTimeAgo);
            div.appendChild(img);
            div.appendChild(infoDiv);

            div.onclick = () => {
                document.getElementById("url").value = videoUrl;
                document.getElementById("searchBox").style.display = "none";
                reloadVideo();
            };

            videoResultsDiv.appendChild(div);
        });

        // CHANNELS
        channelData.items.forEach(item => {
            const channelId = item.id.channelId;
            const title = item.snippet.title;
            const thumbnailUrl = item.snippet.thumbnails.high.url;
            const description = item.snippet.description;
            
            const channelUrl = `https://www.youtube.com/channel/${channelId}`;

            const div = document.createElement('div');
            div.className = 'channel-result';

            const img = document.createElement('img');
            img.src = thumbnailUrl;
            img.alt = title;

            const infoDiv = document.createElement('div');
            infoDiv.className = 'channel-info';

            const channelTitle = document.createElement('div');
            channelTitle.className = 'channel-title';
            channelTitle.textContent = title;

            const channelDesc = document.createElement('div');
            channelDesc.className = 'channel-description';
            channelDesc.textContent = description;

            const followBtn = document.createElement('button');
            followBtn.className = 'follow-btn';
            followBtn.innerHTML = `<span class="material-icons" style="vertical-align:middle;">person_add</span> Follow`;

            if (channels[title.replace(/\s/g, '')]) {
                followBtn.innerHTML = '<span class="material-icons" style="vertical-align:middle;">person_remove</span> Unfollow';
                
            }

            followBtn.onclick = (e) => {
                e.stopPropagation();
                
                const titleWOspaces = title.replace(/\s/g, '');
                
                if (followBtn.textContent.includes('Unfollow')) {
                    followBtn.innerHTML = `<span class="material-icons" style="vertical-align:middle;">person_add</span> Follow`;
                    removeYoutubeChannel(titleWOspaces);
                    return;
                }
                followBtn.innerHTML = '<span class="material-icons" style="vertical-align:middle;">person_remove</span> Unfollow';
                
                addYoutubeChannel(titleWOspaces, title, channelId, thumbnailUrl);
            };

            const followDiv = document.createElement('div');
            followDiv.className = 'follow-btn-container';
            followDiv.appendChild(followBtn);


            infoDiv.appendChild(channelTitle);
            infoDiv.appendChild(channelDesc);
            div.appendChild(img);
            div.appendChild(infoDiv);
            div.appendChild(followDiv);

            div.onclick = () => {
                window.open(channelUrl, '_blank');
            };

            channelResultsDiv.appendChild(div);
        });
    }
}

function showTab(tab) {
    document.getElementById('videoResults').style.display = tab === 'videos' ? 'block' : 'none';
    document.getElementById('channelResults').style.display = tab === 'channels' ? 'block' : 'none';

    // Toggle 'filter-selected' class on tab buttons
    document.getElementById('videosTab').classList.toggle('filter-selected', tab === 'videos');
    document.getElementById('channelsTab').classList.toggle('filter-selected', tab === 'channels');
}


const colorThief = new ColorThief();

function setAmbientColor(videoId) {
  const img = document.getElementById('thumbnail');
  img.src = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  img.onload = () => {
    const [r, g, b] = colorThief.getColor(img);
    document.getElementById('ambient-bg').style.backgroundColor = `rgba(${r},${g},${b},0.7)`;
    
  };
}

async function updateVideoInfo(videoId) {
  
    const apiKey = apiKeys[currentApiKeyIndex];
    const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`;

    try {
        const videoResponse = await fetch(videoUrl);
        const videoData = await videoResponse.json();

        if (videoData.items.length > 0) {
            const videoInfo = videoData.items[0];
            const channelId = videoInfo.snippet.channelId;


            document.getElementById("ytTitle").textContent = videoInfo.snippet.title;
            document.getElementById("ytChannel").textContent = videoInfo.snippet.channelTitle;
            document.getElementById("ytViews").textContent = `${Number(videoInfo.statistics.viewCount).toLocaleString()} views •`;
            document.getElementById("ytDate").textContent = new Date(videoInfo.snippet.publishedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric'
            });


            // Fetch channel profile image in same function
            const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${apiKey}`;
            const channelResponse = await fetch(channelUrl);
            const channelData = await channelResponse.json();

            if (channelData.items.length > 0) {
                const channelInfo = channelData.items[0];
                document.getElementById("ytChannelPicture").src = channelInfo.snippet.thumbnails.high.url;
            } else {
                console.error("Channel not found!");
            }
        } else {
            console.error("Video not found!");
        }

        document.getElementById("ytInfo").style.display = "inline-flex";
    } catch (error) {
        console.error("Error fetching video or channel data:", error);
    }
}

//printLocalStorageTags();
