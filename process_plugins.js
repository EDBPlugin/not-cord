const fs = require('fs');
const { execSync } = require('child_process');

async function fetchPlugins() {
    const topic = 'edbp-plugin';
    const query = `topic:${topic}`;
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}`;
    
    console.log(`Searching for: ${url}`);
    
    // GitHub CLI (gh) を使って認証済みのリクエストを投げる
    const response = JSON.parse(execSync(`gh api "${url}"`).toString());
    const repos = response.items;

    const readmeJson = []; // README.md がない
    const pluginJson = []; // plugin.js がない
    const notCordList = []; // 両方またはコードがない

    for (const repo of repos) {
        const fullName = repo.full_name;
        const contentsUrl = `https://api.github.com/repos/${fullName}/contents/`;
        
        try {
            const contents = JSON.parse(execSync(`gh api "${contentsUrl}"`).toString());
            const fileNames = contents.map(f => f.name.toLowerCase());

            const hasReadme = fileNames.includes('readme.md');
            const hasPluginJs = fileNames.includes('plugin.js');

            const repoData = {
                name: repo.name,
                full_name: repo.full_name,
                html_url: repo.html_url,
                description: repo.description
            };

            if (!hasReadme) readmeJson.push(repoData);
            if (!hasPluginJs) pluginJson.push(repoData);
            
            // いずれかが欠けている、あるいは「コードがない」とみなす場合
            if (!hasReadme || !hasPluginJs) {
                notCordList.push(repoData);
            }
        } catch (e) {
            console.error(`Error checking ${fullName}: ${e.message}`);
        }
    }

    // ファイル書き出し
    fs.writeFileSync('readme.json', JSON.stringify(readmeJson, null, 2));
    fs.writeFileSync('plugin.json', JSON.stringify(pluginJson, null, 2));
    fs.writeFileSync('plugins.json', JSON.stringify(notCordList, null, 2));
    
    console.log('Update complete!');
}

fetchPlugins();
