const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const LAST_CHECK_KEY = 'lastChannelCheck';
/*
const stored = localStorage.getItem('followedChannels');
const channels = stored ? JSON.parse(stored) : {};
*/

document.addEventListener('DOMContentLoaded', function() {
    for (const [internalName, channelData] of Object.entries(channels)) {
        // channelData can be either a string (channelId) or an object with id, displayName, thumbnailUrl
        let channelId, displayName, thumbnailUrl;
    
        channelId = channelData.id;
        displayName = channelData.displayName || internalName;
        thumbnailUrl = channelData.thumbnailUrl || "";
        
        const channelsContainer = document.getElementById('channels');
        const channelDiv = document.createElement('div');
        channelDiv.className = 'channel';
        channelDiv.dataset.channel = `${internalName}`;

        channelDiv.innerHTML = `
            <span class="expandChannel" onclick="toggleChannel('${displayName}', this)">&#xe5df;</span>
            <div class="channelInfo">
                <img class="channelPicture" src="${thumbnailUrl}">
                <span class="creator">${displayName}</span>
                <span class="notification-dot" id="notif-${internalName}" style="display: none;"></span>
            </div>
            <div class="videoDropdown" id="dropdown-${internalName}" style="display: none;"></div>
        `;

        channelsContainer.appendChild(channelDiv);
    }
});

/*

old channels array:

"Airrack": "UCyps-v4WNjWDnYRKmZ4BUGw",
"MrBeast": "UCX6OQ3DkcsbYNE6H8uQQuVA",
"MarkRober": "UCY1kMZp36IQSyNx_9h4mpCg",
"Mrwhosetheboss": "UCMiJRAwDNSNzuYeN2uWa0pA",
"DudePerfect": "UCRijo3ddMTht_IHyNSNXpNQ"

*/



restoreVideosFromStorage()

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
        const channelId = channelData.id;
        const channelDiv = document.querySelector(`.channel[data-channel="${name}"]`);

        try {
            const videos = await getLatestVideos(channelId, name);

            if (videos && videos.length > 0) {
                const lastWatchedKey = `lastWatched-${name}`;

                // sort videos oldest → newest
                const sortedVideos = videos.sort(
                    (a, b) => new Date(a.snippet.publishedAt) - new Date(b.snippet.publishedAt)
                );

                for (const video of sortedVideos) {
                    addVideoToDropdown(name, video);
                }

                // update last watched with newest video timestamp
                const newestVideo = sortedVideos[sortedVideos.length - 1];
                localStorage.setItem(lastWatchedKey, newestVideo.snippet.publishedAt);
            }

            // ✅ highlight green
           if (channelDiv) {
                channelDiv.classList.remove("highlight-red", "highlight-green");
                void channelDiv.offsetWidth; // restart animation
                channelDiv.classList.add("highlight-green"); // or "highlight-red"

                // remove the highlight class once animation is done
                channelDiv.addEventListener("animationend", () => {
                    channelDiv.classList.remove("highlight-green", "highlight-red");
                }, { once: true }); // "once" makes sure it only runs one time
            }
        } catch (err) {
            console.error(`Error checking ${name}:`, err);

            // ❌ highlight red
            if (channelDiv) {
                channelDiv.classList.remove("highlight-red", "highlight-green");
                void channelDiv.offsetWidth; // restart animation
                channelDiv.classList.add("highlight-red"); // or "highlight-red"

                // remove the highlight class once animation is done
                channelDiv.addEventListener("animationend", () => {
                    channelDiv.classList.remove("highlight-green", "highlight-red");
                }, { once: true }); // "once" makes sure it only runs one time
            }
        }
    }
}

function addVideoToDropdown(channelName, video) {
    const container = document.getElementById(`dropdown-${channelName.replace(/\s/g, '')}`);
    if (!container) return;

    const videoId = video.id;
    const title = video.snippet.title;
    const thumbnail = video.snippet.thumbnails.medium.url;
    const publishedAt = new Date(video.snippet.publishedAt);
    const timeAgo = timeSince(publishedAt);
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const notification = document.getElementById(`notif-${channelName.replace(/\s/g, '')}`);

    const videoHTML = `
        <div class="dropdown-video" onclick="handleVideoClick('${videoId}', '${channelName}')">
            <img class="dropdown-thumbnail" src="${thumbnail}" alt="${title}">
            <div class="dropdown-info">
                <div class="dropdown-title">${title}</div>
                <div class="dropdown-time">${timeAgo}</div>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', videoHTML);
    notification.style.display = "block";

    // Save to localStorage
    const storageKey = `videos-${channelName}`;
    let storedVideos = JSON.parse(localStorage.getItem(storageKey)) || [];

    // Avoid duplicates by checking ID
    if (!storedVideos.some(v => v.id === videoId)) {
        storedVideos.push({
            id: videoId,
            title,
            thumbnail,
            publishedAt: publishedAt.toISOString()
        });
        localStorage.setItem(storageKey, JSON.stringify(storedVideos));
    }

    const noNewVideosMessage = container.querySelector("noNewVideosMessage")
    if (noNewVideosMessage) {
        container.removeChild(noNewVideosMessage)
    }
}

async function getLatestVideos(channelId, channelName) {
    let videos = [];
    let attempts = 0;
    const maxAttempts = apiKeys.length;

    // Get the last watched date from localStorage
    const lastWatchedKey = `lastWatched-${channelName}`;
    const lastWatchedDateStr = localStorage.getItem(lastWatchedKey);
    const lastWatchedDate = lastWatchedDateStr ? new Date(lastWatchedDateStr) : null;

    while (videos.length === 0 && attempts < maxAttempts) {
        const apiKey = apiKeys[currentApiKeyIndex];
        try {
            // Step 1: Get the 5 most recent videos
            const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=5&order=date&type=video&key=${apiKey}`;
            const searchRes = await fetch(searchUrl);
            const searchData = await searchRes.json();

            if (!searchData.items || searchData.items.length === 0) {
                throw new Error("No videos found");
            }

            // Step 2: Filter videos that are newer than the saved last watched date
            const recentItems = searchData.items.filter(item => {
                const publishedAt = new Date(item.snippet.publishedAt);
                return !lastWatchedDate || publishedAt > lastWatchedDate;
            });

            if (recentItems.length === 0) {
                return []; // No new videos
            }

            // Step 3: Fetch details of those videos
            const videoIds = recentItems.map(item => item.id.videoId);
            const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds.join(',')}&key=${apiKey}`;
            const detailsRes = await fetch(detailsUrl);
            const detailsData = await detailsRes.json();

            if (!detailsData.items || detailsData.items.length === 0) {
                throw new Error("No video details found");
            }

            // Step 4: Sort by publish time (newest first)
            videos = detailsData.items.sort((a, b) => new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt));

        } catch (err) {
            console.error(`Error with API Key ${apiKeys[currentApiKeyIndex]}:`, err);
            currentApiKeyIndex = (currentApiKeyIndex + 1) % apiKeys.length;
            attempts++;
        }
    }

    return videos; // Array of new videos after last watched
}

function timeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval >= 1) {
        return Math.floor(interval) + " year" + (Math.floor(interval) === 1 ? "" : "s") + " ago";
    }
    interval = seconds / 2592000;
    if (interval >= 1) {
        return Math.floor(interval) + " month" + (Math.floor(interval) === 1 ? "" : "s") + " ago";
    }
    interval = seconds / 86400;
    if (interval >= 1) {
        return Math.floor(interval) + " day" + (Math.floor(interval) === 1 ? "" : "s") + " ago";
    }
    interval = seconds / 3600;
    if (interval >= 1) {
        return Math.floor(interval) + " hour" + (Math.floor(interval) === 1 ? "" : "s") + " ago";
    }
    interval = seconds / 60;
    if (interval >= 1) {
        return Math.floor(interval) + " minute" + (Math.floor(interval) === 1 ? "" : "s") + " ago";
    }
    return Math.floor(seconds) + " second" + (Math.floor(seconds) === 1 ? "" : "s") + " ago";
}

function restoreVideosFromStorage() {
    document.addEventListener('DOMContentLoaded', function() {
        for (const channelName of Object.keys(channels)) {
            const storageKey = `videos-${channelName}`;
            const storedVideos = JSON.parse(localStorage.getItem(storageKey)) || [];
            const container = document.getElementById(`dropdown-${channelName.replace(/\s/g, '')}`);
            const notification = document.getElementById(`notif-${channelName.replace(/\s/g, '')}`);
            if (!container) continue;
            
            storedVideos.forEach(video => {
                const timeAgo = timeSince(new Date(video.publishedAt));
                const videoHTML = `
                    <div class="dropdown-video" onclick="handleVideoClick('${video.id}', '${channelName}')">
                        <img class="dropdown-thumbnail" src="${video.thumbnail}" alt="${video.title}">
                        <div class="dropdown-info">
                            <div class="dropdown-title">${video.title}</div>
                            <div class="dropdown-time">${timeAgo}</div>
                        </div>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', videoHTML);
                container.style.display = "none";
                notification.style.display = "block";
            });
            if (notification.style.display !== "block") {
                console.log("adding message")
                const noVideosDiv = `<p class="noNewVideosMessage">There are no new videos.</p>`
                container.insertAdjacentHTML('beforeend', noVideosDiv);
            }
        }
    }); 
}

function handleVideoClick(videoId, channelName) {
    const storageKey = `videos-${channelName}`;
    const container = document.getElementById(`dropdown-${channelName.replace(/\s/g, '')}`);
    if (!container) return;

    // Remove video from localStorage
    let storedVideos = JSON.parse(localStorage.getItem(storageKey)) || [];
    storedVideos = storedVideos.filter(video => video.id !== videoId);
    localStorage.setItem(storageKey, JSON.stringify(storedVideos));

    // Remove video from dropdown
    const videoElement = container.querySelector(`.dropdown-video[onclick*="'${videoId}'"]`);
    if (videoElement) {
        const arrowElement = videoElement.parentElement.parentElement.querySelector('.expandChannel')
        container.removeChild(videoElement);
        toggleChannel(channelName, arrowElement);
        
    } else {
        console.warn(`Video with ID ${videoId} not found in dropdown for channel ${channelName}`);
    
    }

    const urlInput = document.getElementById("url");
    const codeInput = document.getElementById("code");

    urlInput.value = `https://www.youtube.com/watch?v=${videoId}`;
    toggleSidebar();
    
    reloadVideo();

    // If no more videos are left in the dropdown, hide it
    if (storedVideos.length === 0) {
        const notification = document.getElementById(`notif-${channelName.replace(/\s/g, '')}`);
        notification.style.display = "none";

        const noVideosDiv = `<p class="noNewVideosMessage">There are no new videos.</p>`
        container.insertAdjacentHTML('beforeend', noVideosDiv);
    }
}

function addYoutubeChannel(internalName, displayName, channelId, thumbnailUrl) {
    channels[internalName] = {
        id: channelId,
        displayName: displayName,
        thumbnailUrl: thumbnailUrl
    };
    localStorage.setItem('followedChannels', JSON.stringify(channels));

    const channelsWrapper = document.getElementById('channels');
    const channelDiv = document.createElement('div');
    channelDiv.className = 'channel';
    channelDiv.dataset.channel = `${internalName}`;

    channelDiv.innerHTML = `

        <span class="expandChannel" onclick="toggleChannel('${displayName}', this)">&#xe5df;</span>
        <div class="channelInfo">
            <img class="channelPicture" src="${thumbnailUrl}">
            <span class="creator">${displayName}</span>
            <span class="notification-dot" id="notif-${internalName}" style="display: none;"></span>
        </div>
        <div class="videoDropdown" id="dropdown-${internalName}" style="display: none;"></div> <!-- Video list will be appended here -->


    `;
    
    channelsWrapper.appendChild(channelDiv);
}

function removeYoutubeChannel(channelName) {
    if (channels[channelName]) {
        delete channels[channelName]; // removes it from the object
        localStorage.setItem('followedChannels', JSON.stringify(channels)); // update storage

        const channelDiv = document.querySelector(`.channel[data-channel="${channelName}"]`);
        if (channelDiv) {
            channelDiv.remove(); // remove the channel from the DOM
        }
    } else {
        console.warn(`Channel "${channelName}" not found`);
    }
}


//if (shouldCheckChannels()) {
setTimeout(() => {
    checkAllChannels();
    updateLastCheckTime();
}, 1000);
//}

document.getElementById('checkVideosBtn').addEventListener('click', async () => {
    console.log("Manual check triggered");
    const checkVideosBtn = document.getElementById('checkVideosBtn');
    const arrowIcon = checkVideosBtn.querySelector('#arrowIcon');
    
    if (arrowIcon) {
        console.log("Arrow icon found, starting animation");
        arrowIcon.style.transition = 'transform 1s';
        arrowIcon.style.transform = 'rotate(360deg)';
        setTimeout(() => {
            arrowIcon.style.transition = 'transform 0s';
            arrowIcon.style.transform = 'rotate(0deg)';
        }, 1000);
    }
    
    await checkAllChannels();
    updateLastCheckTime();
});
