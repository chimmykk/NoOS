//for now this is how it opens or closes windows
function openWindow(whichWindow){
    $(`#${whichWindow}`).css("display", "block");
    $(`#${whichWindow}`).addClass("animated zoomIn");
    setTimeout(() => {
        $(`#${whichWindow}`).removeClass("animated zoomIn");
    },800);
}

function closeWindow(whichWindow) {
    $(`#${whichWindow}`).addClass("animated zoomOut");
    setTimeout(() => {
        $(`#${whichWindow}`).removeClass("animated zoomOut");
        $(`#${whichWindow}`).css("display", "none");
    },800);
}

$("#browserTab").attr("onclick",`openWindow('browser')`);

// Get initial WiFi list
window.api.invoke('wifi:list').then(wifi => {
    if(wifi && wifi.length !== 0){
        for(i = 0; i < wifi.length; i++){
            $("#wifi").append(`<div class="inner-wifi">${wifi[i].ssid}<br><span>${wifi[i].authentication} &nbsp; ${Math.round(Number(wifi[i].signal)*100)}%</span></div>`);
        }
    }
});

// Get initial volume level
window.api.invoke('volume:get').then(level => {
    $("#level").html(Math.round(Number(level)*100));
    $("#volumeRange").val(Math.round(Number(level)*100));
});

// Update time
function updateTime() {
    window.api.invoke('time:get').then(timeData => {
        $("#time").html(`${timeData.day} &nbsp;${timeData.time}`);
    });
}

updateTime();
setInterval(updateTime, 60000);

$("#task_wifi").click((e) => {
    e.stopPropagation();
    $("#volume").addClass("animated zoomOut");
    $("#wifi").css("display","inherit");
    $("#wifi").addClass("animated zoomIn");
    setTimeout(() => {
        $("#wifi").removeClass("animated zoomIn");
        $("#volume").removeClass("animated zoomOut");
        $("#volume").css("display","none");
    },800);
});

$("#task_vol").click((e) => {
    e.stopPropagation();
    $("#wifi").addClass("animated zoomOut");
    $("#volume").css("display","inherit");
    $("#volume").addClass("animated zoomIn");
    setTimeout(() => {
        $("#volume").removeClass("animated zoomIn");
        $("#wifi").css("display","none");
        $("#wifi").removeClass("animated zoomOut");
    },800);
});

// Volume control
$("#volumeRange").on("click , mousemove", (e) => {
    e.stopPropagation();
    var nowVolume = $("#volumeRange").val();
    window.api.send('volume:set', nowVolume/100);
    $("#level").html(nowVolume);
});

// Browser search
function search(e){
    if(e.keyCode == 13){
        e.preventDefault();
        const urlString = e.target.value;
        var url =  /^(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/;
        if (url.test(urlString)){
            $("#reload").addClass("wheel");
            window.api.send('browser:load-url', urlString);
        } else {
            $("#reload").addClass("wheel");
            window.api.send('browser:search', urlString);
        }
    }
}

$("#reload").click(function(){
    $("#reload").attr("disable",true);
    $("#reload").addClass("wheel");
    setTimeout(function(){
        $("#reload").attr("disable",false);
        $("#reload").removeClass("wheel");
    },1000);
    window.api.send('browser:reload');
});

$('body,html').click(function(e){
    $("#wifi").addClass("animated zoomOut");
    $("#volume").addClass("animated zoomOut");
    setTimeout(() => {
        $("#wifi").removeClass("animated zoomIn");
        $("#volume").removeClass("animated zoomIn");
        $("#wifi").removeClass("animated zoomOut");
        $("#volume").removeClass("animated zoomOut");
        $("#wifi").css("display","none");
        $("#volume").css("display","none");
    },800);
});

// Wrap app icon listeners in DOMContentLoaded to ensure elements exist
document.addEventListener('DOMContentLoaded', () => {
    setupAppIconListeners();
    setupSystemControls();

    // Function to set up event listeners for app icons
    function setupAppIconListeners() {
        document.getElementById('terminal-icon').addEventListener('click', () => {
            console.log('Terminal icon clicked');
            window.api.send('open:terminal');
        });

        document.getElementById('chrome-icon').addEventListener('click', () => {
            console.log('Chrome icon clicked');
            window.api.send('open:browser');
        });

        document.getElementById('synth-icon').addEventListener('click', () => {
            console.log('Synth icon clicked');
            window.api.send('open:synth');
        });

        document.getElementById('minesweeper-icon').addEventListener('click', () => {
            console.log('Minesweeper icon clicked');
            window.api.send('open:minesweeper');
        });

        document.getElementById('shapeapps-icon').addEventListener('click', () => {
            console.log('ShapeApps icon clicked');
            window.api.send('open:shapeapps');
        });

        document.getElementById('ipod-icon').addEventListener('click', () => {
            console.log('iPod icon clicked');
            window.api.send('open:ipod');
        });

        document.getElementById('chat-icon').addEventListener('click', () => {
            console.log('Chat icon clicked');
            window.api.send('open:chat');
        });
    }

    // Function to set up system controls (volume, wifi, etc.)
    function setupSystemControls() {
        // Volume control
        const volumeRange = document.getElementById('volumeRange');
        const level = document.getElementById('level');
        
        if (volumeRange && level) {
            // Get initial volume level
            window.api.invoke('volume:get').then(volLevel => {
                level.textContent = Math.round(volLevel * 100);
                volumeRange.value = Math.round(volLevel * 100);
            });

            volumeRange.addEventListener('input', (e) => {
                const value = e.target.value;
                level.textContent = value;
                window.api.send('volume:set', value / 100);
            });
        }

        // WiFi and Volume UI controls
        const taskWifi = document.getElementById('task_wifi');
        const taskVol = document.getElementById('task_vol');
        const wifi = document.getElementById('wifi');
        const volume = document.getElementById('volume');

        if (taskWifi && taskVol && wifi && volume) {
            // Get initial WiFi list
            window.api.invoke('wifi:list').then(wifiList => {
                if (wifiList && wifiList.length > 0) {
                    wifiList.forEach(network => {
                        wifi.innerHTML += `
                            <div class="inner-wifi">
                                ${network.ssid}<br>
                                <span>${network.authentication} &nbsp; ${Math.round(network.signal * 100)}%</span>
                            </div>
                        `;
                    });
                }
            });

            taskWifi.addEventListener('click', (e) => {
                e.stopPropagation();
                volume.classList.add('animated', 'zoomOut');
                wifi.style.display = 'inherit';
                wifi.classList.add('animated', 'zoomIn');
                setTimeout(() => {
                    wifi.classList.remove('animated', 'zoomIn');
                    volume.classList.remove('animated', 'zoomOut');
                    volume.style.display = 'none';
                }, 800);
            });

            taskVol.addEventListener('click', (e) => {
                e.stopPropagation();
                wifi.classList.add('animated', 'zoomOut');
                volume.style.display = 'inherit';
                volume.classList.add('animated', 'zoomIn');
                setTimeout(() => {
                    volume.classList.remove('animated', 'zoomIn');
                    wifi.style.display = 'none';
                    wifi.classList.remove('animated', 'zoomOut');
                }, 800);
            });
        }

        // Close dropdowns when clicking outside
        document.body.addEventListener('click', () => {
            if (wifi && volume) {
                wifi.classList.add('animated', 'zoomOut');
                volume.classList.add('animated', 'zoomOut');
                setTimeout(() => {
                    wifi.classList.remove('animated', 'zoomIn');
                    volume.classList.remove('animated', 'zoomIn');
                    wifi.classList.remove('animated', 'zoomOut');
                    volume.classList.remove('animated', 'zoomOut');
                    wifi.style.display = 'none';
                    volume.style.display = 'none';
                }, 800);
            }
        });

        // Browser search functionality
        const searchInput = document.getElementById('search');
        const reloadButton = document.getElementById('reload');
        const browserData = document.getElementById('browser_data');

        if (searchInput && reloadButton && browserData) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const urlString = e.target.value;
                    const urlPattern = /^(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/;
                    
                    if (urlPattern.test(urlString)) {
                        window.api.send('browser:load-url', urlString);
                    } else {
                        window.api.send('browser:search', urlString);
                    }
                }
            });

            reloadButton.addEventListener('click', () => {
                reloadButton.setAttribute('disabled', true);
                reloadButton.classList.add('wheel');
                setTimeout(() => {
                    reloadButton.removeAttribute('disabled');
                    reloadButton.classList.remove('wheel');
                }, 1000);
                window.api.send('browser:reload');
            });
        }

        // Update time every minute
        function updateTime() {
            window.api.invoke('time:get').then(timeData => {
                const timeElement = document.getElementById('time');
                if (timeElement) {
                    timeElement.innerHTML = `${timeData.day} &nbsp;${timeData.time}`;
                }
            });
        }

        updateTime();
        setInterval(updateTime, 60000);
    }
});
