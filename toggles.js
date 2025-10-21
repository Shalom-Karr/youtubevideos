function toggleSearch() {
    const box = document.getElementById('searchBox');
    const input = box.querySelector('.search-input');
    const isVisible = box.style.display === 'flex';

    box.style.display = isVisible ? 'none' : 'flex';
    if (!isVisible) {
        setTimeout(() => input.focus(), 100); // slight delay to ensure rendering
    }
}

document.addEventListener('click', (event) => {
    const searchBox = document.getElementById('searchBox');
    const searchIcon = document.querySelector('.icon');
    
    if (!searchBox.contains(event.target) && !searchIcon.contains(event.target)) {
        searchBox.style.display = 'none';
    }
});

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const expandButton = document.querySelector('.expand');
    
    // Toggle the "collapsed" class to animate the sidebar
    sidebar.classList.toggle('collapsed');
    
    // Change the icon when the sidebar is expanded or collapsed
    if (sidebar.classList.contains('collapsed')) {
        expandButton.innerHTML = '&#xe5df;'; // Right arrow
    } else {
        expandButton.innerHTML = '&#xe5de;'; // Left arrow
    }
}

function toggleChannel(channelName, arrowElement) {

    console.log("function called!")
    const dropdown = document.getElementById(`dropdown-${channelName.replace(/\s/g, '')}`);
    const isVisible = dropdown.style.display === "block";

    document.addEventListener('DOMContentLoaded', () => {
        // Ensure the dropdown starts off as invisible
        if (!dropdown.style.display) {
            dropdown.style.display = "none";
        }
    });

    // Toggle visibility
    dropdown.style.display = isVisible ? "none" : "block";

    // Rotate the arrow icon (Material icon: expand_more ↔ expand_less)
    arrowElement.innerHTML = isVisible ? "&#xe5df;" : "&#xe5c5;";
    console.log("twisted arrow")

    if (!isVisible) {
        const parentChannel = dropdown.parentElement;
        parentChannel.classList.add('dropdown-open'); // Add the class
    } else {
        const parentChannel = dropdown.parentElement;
        parentChannel.classList.remove('dropdown-open'); // Add the class
    }
}

