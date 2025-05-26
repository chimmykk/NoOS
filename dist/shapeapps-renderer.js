document.addEventListener('DOMContentLoaded', async () => {
    const projectListContainer = document.getElementById('project-list');

    // Prevent duplicate listeners by checking if already initialized
    if (projectListContainer.dataset.initialized) {
        console.log('Project list already initialized, skipping...');
        return;
    }
    projectListContainer.dataset.initialized = 'true';

    // Check if project list container exists
    if (!projectListContainer) {
        console.error('Project list container not found!');
        return;
    }

    // Handle window controls with fallback if window.shapeapps is unavailable
    const minimizeBtn = document.querySelector('.window-controls .minimize');
    const maximizeBtn = document.querySelector('.window-controls .maximize');
    const closeBtn = document.querySelector('.window-controls .close');

    if (minimizeBtn) {
        minimizeBtn.addEventListener('click', () => {
            if (window.shapeapps && typeof window.shapeapps.minimize === 'function') {
                window.shapeapps.minimize();
            } else {
                console.log('Minimize not supported');
            }
        });
    }

    if (maximizeBtn) {
        maximizeBtn.addEventListener('click', () => {
            if (window.shapeapps && typeof window.shapeapps.maximize === 'function') {
                window.shapeapps.maximize();
            } else {
                console.log('Maximize not supported');
            }
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (window.shapeapps && typeof window.shapeapps.close === 'function') {
                window.shapeapps.close();
            } else {
                console.log('Close not supported');
            }
        });
    }

    try {
        // Fetch project data
        console.log('Fetching projects.json...');
        const response = await fetch('./projects.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch projects.json: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Fetched projects:', data.projects);
        const projects = data.projects;

        // Clear any existing content
        projectListContainer.innerHTML = '';

        // Create and append project elements
        projects.forEach(project => {
            const projectElement = document.createElement('div');
            projectElement.classList.add('sub-app-icon');

            // Create img element for the icon
            const iconImage = document.createElement('img');
            iconImage.src = project.iconPath || 'https://res.cloudinary.com/deapg3k8f/image/upload/v1747353085/round_bwj588.png'; // Default fallback
            iconImage.alt = `${project.name} Icon`;
            iconImage.style.width = '60px';
            iconImage.style.height = '60px';
            iconImage.style.objectFit = 'contain';
            iconImage.onerror = () => {
                console.warn(`Failed to load icon: ${project.iconPath}`);
                iconImage.src = 'https://res.cloudinary.com/deapg3k8f/image/upload/v1747353085/round_bwj588.png'; // Cloudinary fallback
            };

            // Create span for the project name
            const projectNameSpan = document.createElement('span');
            projectNameSpan.textContent = project.name;

            // Create project info container
            const projectInfo = document.createElement('div');
            projectInfo.classList.add('project-info');

            // Create website link
            if (project.website && project.website !== '#') {
                const websiteLink = document.createElement('a');
                websiteLink.href = '#';
                websiteLink.classList.add('website-link');
                websiteLink.innerHTML = `<i class="fas fa-globe"></i> ${project.website.replace(/^https?:\/\//, '')}`;
                websiteLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.shapeapps.openBrowserWithUrl(project.website);
                });
                projectInfo.appendChild(websiteLink);
            }

            // Create GitHub link
            if (project.github && project.github !== '#') {
                const githubLink = document.createElement('a');
                githubLink.href = '#';
                githubLink.classList.add('github-link');
                githubLink.innerHTML = `<i class="fab fa-github"></i> ${project.github.replace(/^https?:\/\//, '')}`;
                githubLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.shapeapps.openBrowserWithUrl(project.github);
                });
                projectInfo.appendChild(githubLink);
            }

            projectElement.appendChild(iconImage);
            projectElement.appendChild(projectNameSpan);
            projectElement.appendChild(projectInfo);

            // Add click listener to open website in Chrome browser
            projectElement.addEventListener('click', (e) => {
                // Don't trigger if clicking on project info links
                if (e.target.closest('.project-info')) {
                    return;
                }
                
                console.log(`Clicked on project: ${project.name}`);
                // Log both website and github links to console
                console.log(`Website: ${project.website}`);
                console.log(`GitHub: ${project.github}`);

                // Open website in Chrome browser
                if (project.website && project.website !== '#') {
                    window.shapeapps.openBrowserWithUrl(project.website);
                } else {
                    console.log('No website URL available for this project.');
                }
            });

            projectListContainer.appendChild(projectElement);
        });

    } catch (error) {
        console.error('Error fetching or rendering projects:', error);
        const errorElement = document.createElement('p');
        errorElement.style.color = 'red';
        errorElement.textContent = 'Error loading projects.';
        projectListContainer.appendChild(errorElement);
    }
});