const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const LAST_CHECK_KEY = 'lastChannelCheck';

document.addEventListener('DOMContentLoaded', function() {
    renderFollowedChannels();
    if (shouldCheckChannels()) {
        checkAllChannels();
        updateLastCheckTime();
    }
});

function renderFollowedChannels() {
    const channelsContainer = document.getElementById('channels');
    channelsContainer.innerHTML = '';
    for (const [internalName, channelData] of Object.entries(channels)) {
        const channelDiv = document.createElement('div');
        channelDiv.className = 'channel';
        channelDiv.dataset.channel = internalName;
        channelDiv.innerHTML = `
            <img class="channelPicture" src="${channelData.thumbnailUrl}" alt="${channelData.displayName}">
            <span class="creator">${channelData.displayName}</span>
            <span class="notification-dot" id="notif-${internalName}"></span>
            <div class="videoDropdown" id="dropdown-${internalName}" style="display: none;"></div>
        `;
        channelDiv.onclick = () => toggleChannel(internalName);
        channelsContainer.appendChild(channelDiv);
        restoreVideosFromStorage(internalName);
    }
}

function shouldCheckChannels() {
    const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
    if (!lastCheck) return true;
    return Date.now() - parseInt(lastCheck) > CHECK_INTERVAL_MS;
}

function updateLastCheckTime() {
    localStorage.setItem(LAST_CHECK_KEY, Date.now().toString());
}

async function checkAllChannels() {
    for (const [name, channelData] of Object.entries(channels)) {
        const videos = await getLatestVideos(channelData.id);
        if (videos && videos.length > 0) {
            const lastWatchedKey = `lastWatched-${name}`;
            const lastWatchedDate = localStorage.getItem(lastWatchedKey);
            const newVideos = videos.filter(v => !lastWatchedDate || new Date(v.snippet.publishedAt) > new Date(lastWatchedDate));

            if (newVideos.length > 0) {
                newVideos.forEach(video => addVideoToDropdown(name, video));
                const newestVideo = newVideos.sort((a, b) => new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt))[0];
                localStorage.setItem(lastWatchedKey, newestVideo.snippet.publishedAt);
            }
        }
    }
}

function addVideoToDropdown(channelName, video) {
    const container = document.getElementById(`dropdown-${channelName}`);
    if (!container) return;

    const videoId = video.id;
    const title = video.snippet.title;
    const publishedAt = new Date(video.snippet.publishedAt);
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    const videoHTML = `
        <div class="dropdown-video" onclick="handleVideoClick(event, '${videoUrl}', '${channelName}', '${videoId}')">
            <div class="dropdown-title">${title}</div>
            <div class="dropdown-time">${timeAgo(publishedAt)}</div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', videoHTML);
    document.getElementById(`notif-${channelName}`).style.display = 'block';

    const storageKey = `videos-${channelName}`;
    let storedVideos = JSON.parse(localStorage.getItem(storageKey)) || [];
    if (!storedVideos.some(v => v.id === videoId)) {
        storedVideos.push({ id: videoId, title, publishedAt: publishedAt.toISOString() });
        localStorage.setItem(storageKey, JSON.stringify(storedVideos));
    }
}

function restoreVideosFromStorage(channelName) {
    const storageKey = `videos-${channelName}`;
    const storedVideos = JSON.parse(localStorage.getItem(storageKey)) || [];
    const container = document.getElementById(`dropdown-${channelName}`);
    if (!container) return;

    storedVideos.forEach(video => {
        const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
        const videoHTML = `
            <div class="dropdown-video" onclick="handleVideoClick(event, '${videoUrl}', '${channelName}', '${video.id}')">
                <div class="dropdown-title">${video.title}</div>
                <div class="dropdown-time">${timeAgo(new Date(video.publishedAt))}</div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', videoHTML);
        document.getElementById(`notif-${channelName}`).style.display = 'block';
    });
}

function handleVideoClick(event, videoUrl, channelName, videoId) {
    event.stopPropagation();
    window.saveVideo(videoUrl);

    const storageKey = `videos-${channelName}`;
    let storedVideos = JSON.parse(localStorage.getItem(storageKey)) || [];
    storedVideos = storedVideos.filter(video => video.id !== videoId);
    localStorage.setItem(storageKey, JSON.stringify(storedVideos));

    renderFollowedChannels();
    if (storedVideos.length === 0) {
        document.getElementById(`notif-${channelName}`).style.display = 'none';
    }
}

function addYoutubeChannel(internalName, displayName, channelId, thumbnailUrl) {
    channels[internalName] = { id: channelId, displayName, thumbnailUrl };
    localStorage.setItem('followedChannels', JSON.stringify(channels));
    renderFollowedChannels();
}

function removeYoutubeChannel(channelName) {
    delete channels[channelName];
    localStorage.setItem('followedChannels', JSON.stringify(channels));
    localStorage.removeItem(`videos-${channelName}`);
    localStorage.removeItem(`lastWatched-${channelName}`);
    renderFollowedChannels();
}

function toggleChannel(channelName) {
    const dropdown = document.getElementById(`dropdown-${channelName}`);
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
}

document.getElementById('checkVideosBtn').addEventListener('click', async () => {
    checkAllChannels();
    updateLastCheckTime();
});
