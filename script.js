// Add this to your existing script or create a new script.js file
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in (you'll need to implement this based on your authentication system)
    function checkLoginStatus() {
        // This is a placeholder - replace with actual login check
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const username = localStorage.getItem('username');
        
        const authDefault = document.querySelector('.auth-default');
        const userAccount = document.querySelector('.user-account');
        const usernameElement = document.querySelector('.username');
        
        if (isLoggedIn) {
            authDefault.style.display = 'none';
            userAccount.style.display = 'block';
            usernameElement.textContent = username || 'User';
        } else {
            authDefault.style.display = 'block';
            userAccount.style.display = 'none';
        }
    }

    // Handle logout
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Clear login status
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('username');
            // Redirect to login page
            window.location.href = 'login.html';
        });
    }

    // Check login status when page loads
    checkLoginStatus();

    // In your frontend JavaScript
    fetch('http://localhost:8000/earthquakes?days=7&min_magnitude=4.0')
      .then(response => response.json())
      .then(data => console.log(data));

    // Get latest earthquake
    fetch('http://localhost:8000/earthquakes/latest')
      .then(response => response.json())
      .then(data => console.log(data));

    // Initialize map if we're on the peta.html page
    if (document.getElementById('map')) {
        initializeMap();
    }

    // Initialize earthquake list if we're on index.html or riwayat.html
    if (document.querySelector('.earthquake-list')) {
        loadEarthquakeData();
    }
});

function initializeMap() {
    // Initialize map centered on Indonesia
    const map = L.map('map').setView([-2.5489, 118.0149], 5);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Load earthquake data and add markers
    fetch('http://localhost:8000/earthquakes?days=7&min_magnitude=4.0')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                data.data.forEach(quake => {
                    addEarthquakeMarker(map, quake);
                });
                updateCurrentEarthquakes(data.data);
            }
        })
        .catch(error => console.error('Error fetching earthquake data:', error));
}

function addEarthquakeMarker(map, quake) {
    const circle = L.circle([quake.coordinates.latitude, quake.coordinates.longitude], {
        color: getQuakeColor(quake.magnitude),
        fillColor: getQuakeColor(quake.magnitude),
        fillOpacity: 0.5,
        radius: quake.magnitude * 10000
    }).addTo(map);

    circle.bindPopup(`
        <strong>Magnitude:</strong> ${quake.magnitude}<br>
        <strong>Location:</strong> ${quake.location}<br>
        <strong>Depth:</strong> ${quake.depth} km<br>
        <strong>Time:</strong> ${quake.time}
    `);
}

function getQuakeColor(magnitude) {
    if (magnitude >= 6.0) return '#FF0000';  // Strong
    if (magnitude >= 5.0) return '#FFA500';  // Moderate
    if (magnitude >= 4.0) return '#FFFF00';  // Light
    return '#00FF00';  // Minor
}

function loadEarthquakeData() {
    fetch('http://localhost:8000/earthquakes?days=7&min_magnitude=4.0')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                updateEarthquakeList(data.data);
            }
        })
        .catch(error => console.error('Error fetching earthquake data:', error));
}

function updateEarthquakeList(earthquakes) {
    const earthquakeList = document.querySelector('.earthquake-list');
    earthquakeList.innerHTML = '';

    earthquakes.forEach(quake => {
        const severityClass = quake.severity;
        const html = `
            <div class="earthquake-item">
                <div class="eq-magnitude ${severityClass}">${quake.magnitude}</div>
                <div class="eq-details">
                    <h4>${quake.location}</h4>
                    <p><i class="fas fa-calendar-alt"></i> ${quake.time}</p>
                    <p><i class="fas fa-arrows-alt-v"></i> Kedalaman: ${quake.depth} km</p>
                </div>
            </div>
        `;
        earthquakeList.insertAdjacentHTML('beforeend', html);
    });
}

function updateCurrentEarthquakes(earthquakes) {
    const currentEarthquakes = document.getElementById('current-earthquakes');
    if (currentEarthquakes) {
        currentEarthquakes.innerHTML = '';
        
        // Show only the 5 most recent earthquakes
        earthquakes.slice(0, 5).forEach(quake => {
            const severityClass = quake.severity;
            const html = `
                <div class="earthquake-item">
                    <div class="eq-magnitude ${severityClass}">${quake.magnitude}</div>
                    <div class="eq-details">
                        <h4>${quake.location}</h4>
                        <p><i class="fas fa-calendar-alt"></i> ${quake.time}</p>
                        <p><i class="fas fa-arrows-alt-v"></i> Kedalaman: ${quake.depth} km</p>
                    </div>
                </div>
            `;
            currentEarthquakes.insertAdjacentHTML('beforeend', html);
        });
    }
}

// Filter handling for the interactive map
document.addEventListener('DOMContentLoaded', function() {
    const magnitudeFilter = document.getElementById('magnitude-filter');
    const timeFilter = document.getElementById('time-filter');
    const applyFilterBtn = document.querySelector('.btn-apply');

    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', function() {
            const magnitude = magnitudeFilter.value;
            const days = timeFilter.value.replace(/\D/g, '');
            
            let minMagnitude;
            switch(magnitude) {
                case 'minor': minMagnitude = 0; break;
                case 'light': minMagnitude = 4.0; break;
                case 'moderate': minMagnitude = 5.0; break;
                case 'strong': minMagnitude = 6.0; break;
                default: minMagnitude = 0;
            }

            fetch(`http://localhost:8000/earthquakes?days=${days}&min_magnitude=${minMagnitude}`)
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        // Clear existing markers and add new ones
                        map.eachLayer((layer) => {
                            if (layer instanceof L.Circle) {
                                map.removeLayer(layer);
                            }
                        });
                        data.data.forEach(quake => addEarthquakeMarker(map, quake));
                        updateCurrentEarthquakes(data.data);
                    }
                })
                .catch(error => console.error('Error applying filters:', error));
        });
    }
});