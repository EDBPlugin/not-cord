const fs = require('fs');
const { execSync } = require('child_process');

async function fetchPlugins() {
    const query = `topic:edbp-plugin`;
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}`;
    
    console.log(`Searching for: ${url}`);
    const response = JSON.parse(execSync(`gh api "${url}"`).toString());
    const repos = response.items;

    const readmeJson = []; // README.md がない
    const pluginsJson = []; // plugin.js がない
    const manifestJson = []; // manifest.json がない

    for (const repo of repos) {
        const fullName = repo.full_name;
        const contentsUrl = `https://api.github.com/repos/${fullName}/contents/`;
        
        try {
            const contents = JSON.parse(execSync(`gh api "${contentsUrl}"`).toString());
            const fileNames = contents.map(f => f.name.toLowerCase());

            const hasReadme = fileNames.includes('readme.md');
            const hasPluginJs = fileNames.includes('plugin.js');
            const manifestJson = fileNames.includes('manifest.json');

            const repoData = {
                name: repo.name,
                full_name: repo.full_name,
                html_url: repo.html_url,
                description: repo.description
            };

        } catch (e) {
            console.error(`Error checking ${fullName}: ${e.message}`);
        }
    }

    fs.writeFileSync('readme.json', JSON.stringify(readmeJson, null, 2));
    fs.writeFileSync('plugins.json', JSON.stringify(pluginsJson, null, 2));
    fs.writeFileSync('manifest.json', JSON.stringify(manifestJson, null, 2));
    
    console.log('Update complete!');
}

fetchPlugins();
