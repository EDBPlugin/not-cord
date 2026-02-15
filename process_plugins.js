const { execSync } = require('child_process');
const fs = require('fs');

/**
 * topic:edbp-plugin が付いたリポジトリを検索
 */
function fetchPlugins() {
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
 * リポジトリ内の特定のファイルをチェックする
 */
function checkFileExists(repoFullName, filePath) {
    try {
        // gh api でファイル情報を取得。存在しないとエラー(404)を投げる
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
    const repos = fetchPlugins();
    const resultList = [];

    console.log(`Found ${repos.length} repositories. Checking files...\n`);

    for (const repo of repos) {
        const missingFiles = [];
        
        // 1. manifest.json のチェック
        if (!checkFileExists(repo.full_name, 'manifest.json')) {
            missingFiles.push('manifest.json');
        }

        // 2. plugins.js のチェック
        if (!checkFileExists(repo.full_name, 'plugins.js')) {
            missingFiles.push('plugins.json');
        }

        // 3. README.md のチェック
        if (!checkFileExists(repo.full_name, 'README.md')) {
            missingFiles.push('readme.json');
        }

        // 不足がある場合のみリストに追加
        if (missingFiles.length > 0) {
            console.log(`❌ ${repo.full_name}: Missing [${missingFiles.join(', ')}]`);
            resultList.push({
                repo: repo.full_name,
                url: repo.html_url,
                missing: missingFiles
            });
        } else {
            console.log(`✅ ${repo.full_name}: OK`);
        }
    }

    // 結果をJSON形式で保存
    if (resultList.length > 0) {
        fs.writeFileSync('missing_files_list.json', JSON.stringify(resultList, null, 2));
        console.log(`\nDone! Created missing_files_list.json with ${resultList.length} items.`);
    } else {
        console.log("\nAll repositories are complete!");
    }
}

main();
