const { execSync } = require('child_process');
const fs = require('fs');

/**
 * リポジトリを検索
 */
function fetchplugin() {
    console.log("Searching for: topic:edbp-plugin");
    try {
        const output = execSync('gh api "search/repositories?q=topic:edbp-plugin"', { encoding: 'utf-8' });
        const data = JSON.parse(output);
        return data.items || [];
    } catch (error) {
        console.error("Error fetching repositories:", error.message);
        return [];
    }
}

/**
 * 指定したファイルがリポジトリにあるか確認
 */
function checkFileExists(repoFullName, filePath) {
    try {
        execSync(`gh api repos/${repoFullName}/contents/${filePath}`, { stdio: 'ignore' });
        return true; 
    } catch (error) {
        return false;
    }
}

/**
 * メイン処理
 */
function main() {
    const repos = fetchplugin();
    
    // 不足分を記録するオブジェクト
    const missingData = {
        manifest: [],
        readme: []
    };

    console.log(`Found ${repos.length} repositories. Checking files...`);

    for (const repo of repos) {
        const name = repo.full_name;
        console.log(`Checking [${name}]...`);

        // 1. manifest.json のチェック
        if (!checkFileExists(name, 'manifest.json')) {
            missingData.manifest.push({ name, url: repo.html_url });
        }

        // 2. README.md のチェック
        if (!checkFileExists(name, 'README.md')) {
            missingData.readme.push({ name, url: repo.html_url });
        }
    }

    // 各JSONファイルへの書き出し
    fs.writeFileSync('manifest.json', JSON.stringify(missingData.manifest, null, 2));
    fs.writeFileSync('readme.json', JSON.stringify(missingData.readme, null, 2));

    console.log("\nUpdate complete: manifest.json, readme.json created.");
}

main();
