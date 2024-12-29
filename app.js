// app.js
document.addEventListener("DOMContentLoaded", () => {
    // Get references to DOM elements
    const repoUrlInput = document.getElementById('repoUrl');
    const urlError = document.getElementById('urlError');
    const repoInfo = document.getElementById('repoInfo');
    const repoDetails = document.getElementById('repoDetails');
    const contentTree = document.getElementById('contentTree');
    const treeContainer = document.getElementById('treeContainer');
    const combineButton = document.getElementById('combineButton');
    const combinedContent = document.getElementById('combinedContent');
    const combinedOutput = document.getElementById('combinedOutput');

    // Data structures to hold the file tree and selected files
    let fileTree = {};
    let selectedFiles = new Set();
    let cachedFileContents = {};

    // Event listeners
    repoUrlInput.addEventListener('input', handleUrlInput);
    combineButton.addEventListener('click', combineSelectedFiles);

    // Function to parse GitHub repository URL
    function parseGitHubUrl(url) {
        try {
            const parsedUrl = new URL(url);
            if (!parsedUrl.hostname.includes('github.com')) return null;
            const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
            if (pathParts.length < 2) return null;
            return { owner: pathParts[0], repo: pathParts[1] };
        } catch {
            return null;
        }
    }

    // Handle URL input
    async function handleUrlInput() {
        const inputUrl = repoUrlInput.value.trim();
        urlError.textContent = '';
        repoInfo.classList.add('hidden');
        contentTree.classList.add('hidden');
        combineButton.classList.add('hidden');
        combinedContent.classList.add('hidden');
        treeContainer.innerHTML = '';
        selectedFiles.clear();
        fileTree = {};

        if (!inputUrl) return;

        const parsed = parseGitHubUrl(inputUrl);
        if (!parsed) {
            urlError.textContent = 'Invalid GitHub repository URL.';
            return;
        }

        repoDetails.textContent = `${parsed.owner}/${parsed.repo}`;
        repoInfo.classList.remove('hidden');

        try {
            const contents = await fetchRepoContents(parsed.owner, parsed.repo);
            fileTree = buildFileTree(contents);
            displayFileTree(fileTree, treeContainer);
            contentTree.classList.remove('hidden');
        } catch (error) {
            urlError.textContent = 'Error accessing repository: ' + error.message;
        }
    }

    // Fetch repository contents recursively
    async function fetchRepoContents(owner, repo, path = '') {
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch repository contents');
        }

        const items = Array.isArray(data) ? data : [data];
        const filteredItems = items.filter(item => !item.name.startsWith('.') && item.name !== 'node_modules');

        for (const item of filteredItems) {
            if (item.type === 'dir') {
                item.children = await fetchRepoContents(owner, repo, item.path);
            }
        }

        return filteredItems;
    }

    // Build file tree structure
    function buildFileTree(contents) {
        const tree = {};
        for (const item of contents) {
            tree[item.name] = {
                ...item,
                selected: false,
                children: item.type === 'dir' ? buildFileTree(item.children) : null,
            };
        }
        return tree;
    }

    // Display file tree
    function displayFileTree(tree, container) {
        for (const key in tree) {
            const item = tree[key];

            // Create elements
            const itemDiv = document.createElement('div');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';

            const label = document.createElement('label');
            label.textContent = ` ${item.name}`;

            const icon = document.createElement('i');
            icon.className = item.type === 'dir' ? 'fas fa-folder' : 'fas fa-file';
            icon.style.marginLeft = '5px';
            label.prepend(icon);

            if (item.type === 'dir') {
                const toggleIcon = document.createElement('i');
                toggleIcon.className = 'fas fa-chevron-right toggle-icon';
                toggleIcon.style.cursor = 'pointer';
                toggleIcon.style.marginRight = '5px';

                const headerDiv = document.createElement('div');
                headerDiv.appendChild(toggleIcon);
                headerDiv.appendChild(checkbox);
                headerDiv.appendChild(label);
                headerDiv.style.display = 'flex';
                headerDiv.style.alignItems = 'center';

                itemDiv.appendChild(headerDiv);

                const childrenContainer = document.createElement('div');
                childrenContainer.style.display = 'none';
                childrenContainer.style.marginLeft = '20px';
                itemDiv.appendChild(childrenContainer);

                toggleIcon.addEventListener('click', () => {
                    const isVisible = childrenContainer.style.display === 'block';
                    childrenContainer.style.display = isVisible ? 'none' : 'block';
                    toggleIcon.className = isVisible ? 'fas fa-chevron-right' : 'fas fa-chevron-down';
                });

                displayFileTree(item.children, childrenContainer);

                checkbox.addEventListener('change', () => {
                    item.selected = checkbox.checked;
                    selectAllChildren(item.children, checkbox.checked);
                    updateSelectedFiles();
                    updateChildCheckboxes(childrenContainer, checkbox.checked);
                });
            } else {
                itemDiv.appendChild(checkbox);
                itemDiv.appendChild(label);
                itemDiv.style.display = 'flex';
                itemDiv.style.alignItems = 'center';

                checkbox.addEventListener('change', () => {
                    item.selected = checkbox.checked;
                    updateSelectedFiles();
                });
            }

            container.appendChild(itemDiv);
        }
    }

    // Helper functions for checkbox selection
    function selectAllChildren(children, isSelected) {
        for (const key in children) {
            const child = children[key];
            child.selected = isSelected;
            if (child.type === 'dir') {
                selectAllChildren(child.children, isSelected);
            }
        }
    }

    function updateChildCheckboxes(container, isSelected) {
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = isSelected;
        });
    }

    function updateSelectedFiles() {
        selectedFiles.clear();
        collectSelectedFiles(fileTree);
        combineButton.classList.toggle('hidden', selectedFiles.size === 0);
    }

    function collectSelectedFiles(tree) {
        for (const key in tree) {
            const item = tree[key];
            if (item.selected && item.type === 'file') {
                selectedFiles.add(item.path);
            }
            if (item.children) {
                collectSelectedFiles(item.children);
            }
        }
    }

    // Combine selected files
    async function combineSelectedFiles() {
        combinedContent.classList.remove('hidden');
        combinedOutput.value = '';

        const inputUrl = repoUrlInput.value.trim();
        const parsed = parseGitHubUrl(inputUrl);
        if (!parsed) return;

        for (const filePath of selectedFiles) {
            let content;
            if (cachedFileContents[filePath]) {
                content = cachedFileContents[filePath];
            } else {
                content = await fetchFileContent(parsed.owner, parsed.repo, filePath);
                cachedFileContents[filePath] = content;
            }
            combinedOutput.value += `\n\n# File: ${filePath}\n\n${content}`;
        }
        combinedOutput.value = combinedOutput.value.trim();
    }

    // Fetch individual file content
    async function fetchFileContent(owner, repo, path) {
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch file content');
        }

        const content = atob(data.content);
        return content;
    }
});