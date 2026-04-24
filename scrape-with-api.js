const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function scrapeWithApiData() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();

    const caseUrl = 'https://radiopaedia.org/cases/231663/studies/177450?new_full_screen_viewer=true';
    const apiUrl = 'https://radiopaedia.org/studies/177450/annotated_viewer_json?c=1776736726&lang=us&only_findings=true';

    console.log('=== Step 1: Navigate and fetch API data ===\n');

    await page.goto(caseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    // Fetch API data
    const apiData = await page.evaluate(async (url) => {
        const response = await fetch(url);
        return await response.json();
    }, apiUrl);

    const seriesList = apiData.study.series.map((s, i) => ({
        index: i,
        series_id: s.series_id,
        stack_root_id: s.stack_root_id,
        frameIds: s.frames.map(f => f.id),
        firstId: s.frames[0]?.id,
        lastId: s.frames[s.frames.length - 1]?.id,
        count: s.frames.length
    }));

    console.log(`Found ${seriesList.length} series from API`);

    // Extract protocol names and their thumbnail positions
    console.log('\n=== Step 2: Extract protocol names and thumbnail positions ===\n');

    const protocols = await page.evaluate(() => {
        const found = [];

        // Find all DIV elements that look like protocol thumbnails
        document.querySelectorAll('div').forEach(div => {
            const text = (div.textContent || '').trim();
            const rect = div.getBoundingClientRect();

            // Check if this looks like a protocol thumbnail (specific size range)
            if (rect.width >= 100 && rect.width <= 150 && rect.height >= 100 && rect.height <= 200) {
                // Check if text starts with a plane name
                if (/^(Axial|Coronal|Sagittal|Oblique)/.test(text)) {
                    // Extract the full protocol name
                    const match = text.match(/^(Axial|Coronal|Sagittal|Oblique)\s*([A-Z0-9+\s]+)?/);
                    if (match) {
                        let protocolName = text.split('\n')[0].trim();
                        // Clean up the protocol name
                        protocolName = protocolName.replace(/\s+/g, ' ').trim();

                        if (protocolName.length > 3 && protocolName.length < 30) {
                            found.push({
                                name: protocolName,
                                rect: { x: rect.left, y: rect.top, width: rect.width, height: rect.height }
                            });
                        }
                    }
                }
            }
        });

        // Deduplicate by position
        const seen = new Set();
        return found.filter(p => {
            const key = `${Math.round(p.rect.x)}-${Math.round(p.rect.y)}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    });

    console.log(`Found ${protocols.length} protocol thumbnails:`);
    protocols.forEach((p, i) => {
        console.log(`  ${i + 1}. "${p.name}" at (${p.rect.x}, ${p.rect.y})`);
    });

    // Now click each thumbnail and capture the displayed image IDs
    console.log('\n=== Step 3: Map protocols to series by clicking thumbnails ===\n');

    const protocolMapping = [];

    for (let i = 0; i < protocols.length; i++) {
        const protocol = protocols[i];
        console.log(`\nClicking protocol: "${protocol.name}"...`);

        // Click the thumbnail
        await page.mouse.click(protocol.rect.x + protocol.rect.width / 2, protocol.rect.y + protocol.rect.height / 2);
        await page.waitForTimeout(2000);

        // Get all image IDs currently displayed
        const displayedImageIds = await page.evaluate(() => {
            const ids = new Set();
            document.querySelectorAll('img').forEach(img => {
                const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
                const match = src.match(/images\/(\d+)\//);
                if (match && match[1]) {
                    ids.add(parseInt(match[1]));
                }
            });
            return Array.from(ids).sort((a, b) => a - b);
        });

        console.log(`  Displayed ${displayedImageIds.length} images: ${displayedImageIds[0]} - ${displayedImageIds[displayedImageIds.length - 1]}`);

        // Find matching series
        let bestMatch = null;
        let bestOverlap = 0;

        for (const series of seriesList) {
            const overlap = series.frameIds.filter(id => displayedImageIds.includes(id)).length;
            if (overlap > bestOverlap) {
                bestMatch = series;
                bestOverlap = overlap;
            }
        }

        if (bestMatch && bestOverlap >= 3) {
            console.log(`  → Matches Series ${bestMatch.index + 1} (${bestMatch.count} frames, ${bestOverlap} overlap)`);
            protocolMapping.push({
                protocolName: protocol.name,
                seriesIndex: bestMatch.index,
                seriesId: bestMatch.series_id,
                stackRootId: bestMatch.stack_root_id,
                frameCount: bestMatch.count,
                frameIds: bestMatch.frameIds,
                overlap: bestOverlap
            });
        } else {
            console.log(`  → No matching series found`);
        }

        await page.waitForTimeout(500);
    }

    console.log('\n=== Final Protocol Mapping ===\n');
    console.log(JSON.stringify(protocolMapping, null, 2));

    // Generate download URLs for each protocol
    console.log('\n=== Generating Download URLs ===\n');

    const baseUrl = 'https://radiopaedia.org/cases/231663/studies/177450?new_full_screen_viewer=true#t=im&v1i=';
    const urlSuffix = '&v1z=1&v2i=74440476&v2z=1&v3i=74442783&v3z=1&v4i=74442869&v4z=1';

    const results = {
        study: apiData.study,
        protocolMapping: protocolMapping,
        downloadUrls: {}
    };

    for (const mapping of protocolMapping) {
        const urls = mapping.frameIds.map(id => `${baseUrl}${id}${urlSuffix}`);
        results.downloadUrls[mapping.protocolName] = urls;
        console.log(`${mapping.protocolName}: ${urls.length} URLs generated`);
    }

    // Save results
    const outputPath = path.join(__dirname, 'output', 'protocol-mapping-full.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to: ${outputPath}`);

    // Show sample URLs for first two protocols
    console.log('\n=== Sample URLs for first 2 protocols ===\n');
    const firstTwoProtocols = protocolMapping.slice(0, 2);
    for (const mapping of firstTwoProtocols) {
        console.log(`${mapping.protocolName}:`);
        const urls = results.downloadUrls[mapping.protocolName];
        console.log(`  First URL: ${urls[0]}`);
        console.log(`  Last URL: ${urls[urls.length - 1]}`);
        console.log(`  Total: ${urls.length} images\n`);
    }

    await browser.close();
}

scrapeWithApiData().catch(console.error);
