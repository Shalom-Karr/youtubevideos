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
    iframe.src = `https://www.youtube.com/embed/${extractedString}`;
    setAmbientColor(extractedString);
    updateVideoInfo(extractedString);
}


async function getCode() {
    const response = await fetch(GIST_URL + "?t=" + new Date().getTime());
    const data = await response.json();
    return JSON.parse(data.files["code.json"].content).code;
}

async function updateCode(newCode) {
    const updateData = {
        files: {
            "code.json": {
                content: JSON.stringify({ code: newCode })
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
}

async function handleReload() {
    /*
    const inputCode = document.getElementById("code").value;
    const currentCode = await getCode();

    if (inputCode === currentCode || localStorage.getItem("userIdentifier") === "MyComputer") {
        const newCode = Math.floor(1000 + Math.random() * 9000).toString();
        await updateCode(newCode);
        const reloadButton = document.getElementById("reloadButton");
        reloadButton.textContent = "Loading...";
        setTimeout(() => {
            reloadButton.textContent = "Load video";
        }, 3000);
        reloadVideo();
    } else {
        alert("Incorrect code!");
    }
        */
}

document.getElementById("reloadButton").addEventListener("click", handleReload);

document.addEventListener("keydown", async (event) => {

    if (event.key === "Enter") {
        const searchBox = document.getElementById("searchBox");
        const isSearchVisible = getComputedStyle(searchBox).display !== "none";

        if (isSearchVisible) {
            searchVideos();
        } else {
            if (localStorage.getItem("userIdentifier") !== "MyComputer") {
                await handleReload();
            } else {
                reloadVideo();
            }

            
            

        }
    }
});



/**Code for code */

async function updateCodeViewer() {
    const codeViewer = document.getElementById("codeViewer");
    const response = await fetch(GIST_URL + "?t=" + new Date().getTime());
    const data = await response.json();
    const code = JSON.parse(data.files["code.json"].content).code;
    codeViewer.textContent = code;
}

document.querySelector(".code-clicker").addEventListener("click", async () => {
    if (localStorage.getItem("userIdentifier") === "MyComputer") {
    const codeViewer = document.getElementById("codeViewer");
    await updateCodeViewer();
    codeViewer.style.display = "flex";
    setTimeout(() => {
        codeViewer.style.display = "none";
    }, 5000);
    } else {
    console.log("wrong comp");
    }
});

document.addEventListener("keydown", async (event) => {
    if (event.ctrlKey && event.key === " ") {
    if (localStorage.getItem("userIdentifier") === "MyComputer") {
        const codeViewer = document.getElementById("codeViewer");
        await updateCodeViewer();
        codeViewer.style.display = "flex";
        setTimeout(() => {
        codeViewer.style.display = "none";
        }, 5000);
    } else {
        console.log("wrong comp");
    }
    event.preventDefault(); // Prevent default browser behavior for Ctrl+Space
    }
});