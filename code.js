const GIST_ID = "74fde4e913229c28fd532ed2fc8a759f";  
const access_1 = "ghp_VZ1vl6Jmj9t7R1Zb";
const access_2 = "qqnqXdRWmnj32d4G6hHd";
const ACCESS_TOKEN = access_1 + access_2;

const GIST_URL = `https://api.github.com/gists/${GIST_ID}`;
const input = document.getElementById('url');
const iframe = document.getElementById('videoFrame');
const button = document.getElementById('reloadButton');


function reloadVideo() {
    const videoId = input.value.trim();
    const extractedString = videoId.substring(32, 32 + 11);
    
    if (!videoId.includes("youtube.com/watch")) { return; }

    iframe.src = `https://www.youtube.com/embed/${extractedString}`;
    setAmbientColor(extractedString);
    updateVideoInfo(extractedString);

    setTimeout(() => {

        addVideoToHistory(videoId);
    }, 5000);
}

async function addVideoToHistory(videoUrl) {
    // 1. get current gist
    const response = await fetch(GIST_URL + "?t=" + new Date().getTime());
    const data = await response.json();

    // 2. read history.json if exists, otherwise start fresh
    let history = [];
    if (data.files["history.json"]) {
        try {
            history = JSON.parse(data.files["history.json"].content);
        } catch (e) {
            console.warn("Failed to parse history.json, starting fresh.");
        }
    }

    await new Promise(resolve => setTimeout(resolve, 10000)); //basically wait(10)

    const videoTitle = document.getElementById("ytTitle").innerText;

    // 3. add new entry
    const newEntry = {
        url: videoUrl,
        title: videoTitle,
        watchedAt: new Date().toISOString()
    };
    history.push(newEntry);

    // Optional: limit history size (e.g., 50 entries)
    if (history.length > 50) history.shift();

    // 4. upload new history
    const updateData = {
        files: {
            "history.json": {
                content: JSON.stringify(history, null, 2)
            }
        }
    };

    await fetch(GIST_URL, {
        method: "PATCH",
        headers: {
            "Authorization": `token ${ACCESS_TOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(updateData)
    });

    console.log("Video added to history:", videoUrl);
}

document.getElementById("reloadButton").addEventListener("click", reloadVideo);

document.addEventListener("keydown", async (event) => {

    if (event.key === "Enter") {
        const searchBox = document.getElementById("searchBox");
        const isSearchVisible = getComputedStyle(searchBox).display !== "none";

        if (isSearchVisible) {
            searchVideos();
        } else {
            reloadVideo();
        }
    }
});
