// === Firebase Config ===
const firebaseConfig = {
    apiKey: "AIzaSyCAf0ToxAxIYguZ7LzS-LISprbuixHZEmk",
    authDomain: "yt-embed-dc96e.firebaseapp.com",
    databaseURL: "https://yt-embed-dc96e-default-rtdb.firebaseio.com",
    projectId: "yt-embed-dc96e",
    storageBucket: "yt-embed-dc96e.firebasestorage.app",
    messagingSenderId: "770819327631",
    appId: "1:770819327631:web:8af2fab2607c0793efd2fa"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const requestsRef = db.ref('requests');

const isMyComputer = localStorage.getItem('userIdentifier') === 'MyComputer';
const reloadButton = document.getElementById('reloadButton');
const urlInput = document.getElementById('url');
const vidIframe = document.getElementById('videoFrame');

reloadButton.addEventListener('click', loadVideo);

async function loadVideo() {
    const link = urlInput.value;
    if (!link.includes("youtube.com/watch")) {
        reloadButton.innerText = "Invalid Link";
        setTimeout(() => {
            reloadButton.innerText = "Request access";
        }, 5000);
        return;
    }

    if (isMyComputer) {
        reloadVideo();
    } else {
        
        const div = document.createElement('div');
        div.className = 'toast';
        div.innerHTML = `
            <strong>Request sent.</strong> 
            <span class="toast-close material-icons" style="cursor:pointer;">close</span>
        `;

        
        div.querySelector('.toast-close').addEventListener('click', function () {
            div.remove();
            console.log("Toast closed");
        });

        
        document.getElementById('toastArea').prepend(div);
                

        const ref = requestsRef.push();
        await ref.set({
            link: link,
            status: 'pending',
            timestamp: Date.now()
        });

        ref.on('value', snapshot => {
            const data = snapshot.val();
            if (!data) return;
            if (data.status === 'approved') {
                playVideo(data.link);
                
                const div = document.createElement('div');
                div.className = 'toast';
                div.innerHTML = `
                    <strong>Approved.</strong> 
                    <span class="toast-close material-icons" style="cursor:pointer;">close</span>
                `;
                
                div.querySelector('.toast-close').addEventListener('click', function () {
                    div.remove();
                    console.log("Toast closed");
                });


                document.getElementById('toastArea').prepend(div);
                
            } else if (data.status === 'denied') {
                
                const div = document.createElement('div');
                div.className = 'toast';
                div.innerHTML = `
                    <strong>Denied.</strong> 
                    <span class="toast-close material-icons" style="cursor:pointer;">close</span>
                `;
                
                div.querySelector('.toast-close').addEventListener('click', function () {
                    div.remove();
                    console.log("Toast closed");
                });
            }
        });
    }
}

function playVideo(link) {
    const embed = link.replace("watch?v=", "embed/");
    vidIframe.src = embed;
    const videoId = link.split("watch?v=")[1].split("&")[0];
    setAmbientColor(videoId);
    updateVideoInfo(videoId);
}

// === Admin Listener for Requests ===
if (isMyComputer) {
    requestsRef.on('child_added', snapshot => {
        const data = snapshot.val();
        const key = snapshot.key;
        if (data.status === 'pending') {
            showToast(data.link, key);
        }
    });
}

function showToast(link, key) {
    const div = document.createElement('div');
    div.className = 'toast';
    div.innerHTML = `
        <strong>New request:</strong><span class="toast-close material-icons" style="cursor:pointer;">close</span>
        <a href='${link}'>this video</a><br>
        <button onclick="approve('${key}')">✅ Approve</button>
        <button onclick="deny('${key}')">❌ Deny</button>
    `;
    
    div.querySelector('.toast-close').addEventListener('click', function () {
        div.remove();
        console.log("Toast closed");
    });

    document.getElementById('toastArea').prepend(div);
}



function approve(key) {
    db.ref('requests/' + key).update({ status: 'approved' });
    const toast = document.querySelector('.toast');
    if (toast) {
        toast.remove();
    }
}

function deny(key) {
    db.ref('requests/' + key).update({ status: 'denied' });
    const toast = document.querySelector('.toast');
    if (toast) {
        toast.remove();
    }
}
