const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const OUTPUT_BASE = path.join(__dirname, 'output');

/**
 * Sanitize folder name
 */
function sanitizeName(name) {
    return name
        .replace(/[^a-zA-Z0-9\s\-_]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50);
}

/**
 * Parse Radiopaedia URL to extract case ID and study ID
 */
function parseRadiopaediaUrl(url) {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const caseId = pathParts[pathParts.indexOf('cases') + 1];
    const studyId = pathParts[pathParts.indexOf('studies') + 1];
    return { caseId, studyId, baseUrl: `${urlObj.origin}${urlObj.pathname}` };
}

/**
 * Fetch series data from Radiopaedia API
 */
async function fetchSeriesData(page, studyId) {
    const apiUrl = `https://radiopaedia.org/studies/${studyId}/annotated_viewer_json?c=${Date.now()}&lang=us&only_findings=true`;

    const apiData = await page.evaluate(async (url) => {
        const response = await fetch(url);
        return await response.json();
    }, apiUrl);

    return apiData.study;
}

/**
 * Get image URL with hash for series that use hash-based URLs
 */
function getImageUrl(series, frameIndex) {
    const frame = series.frames[frameIndex];
    if (!frame) return null;

    // Check if series has encodings with hash
    if (series.encodings && series.encodings.thumbnailed_files && series.encodings.thumbnailed_files.length > frameIndex) {
        const encoding = series.encodings.thumbnailed_files[frameIndex];
        if (encoding.original) {
            // Use hash-based URL
            return `https://prod-images-static.radiopaedia.org/images/${frame.id}/${encoding.original}`;
        }
    }

    // Fall back to dr-original.jpg format
    return `https://prod-images-static.radiopaedia.org/images/${frame.id}/dr-original.jpg`;
}

/**
 * Extract protocol names from sidebar thumbnails
 */
async function extractProtocolNames(page) {
    return await page.evaluate(() => {
        const protocols = [];

        // Find thumbnail containers by their specific dimensions and position
        document.querySelectorAll('div').forEach(div => {
            const text = (div.textContent || '').trim();
            const rect = div.getBoundingClientRect();

            // Thumbnail-like dimensions (consistent with sidebar protocol thumbnails)
            if (rect.width >= 100 && rect.width <= 150 && rect.height >= 100 && rect.height <= 200) {
                // Check if text looks like a protocol name
                if (text.length > 3 && text.length < 50) {
                    // Exclude case info, rID, etc.
                    if (!text.includes('rID:') && !text.includes('Robertson Beasley')) {
                        // Add space between plane/type and sequence
                        let protocolName = text
                            // Add space after plane names followed by uppercase (e.g., "AxialFLAIR" -> "Axial FLAIR")
                            .replace(/^(Axial|Coronal|Sagittal|Oblique)([A-Z])/i, '$1 $2')
                            // Add space after common DSA/angiography views followed by uppercase
                            .replace(/^(Frontal|Lateral)([A-Z])/i, '$1 $2')
                            // Add space in other common patterns
                            .replace(/(T1|T2|FLAIR|DWI|ADC)(fat)/i, '$1 $2')
                            // Add space between lowercase and uppercase (e.g., "initialIntrathecal" -> "initial Intrathecal")
                            .replace(/([a-z])([A-Z])/g, '$1 $2')
                            // Add space after numbers followed by letters
                            .replace(/(\d)([a-zA-Z])/g, '$1 $2')
                            // Add space after "non-" (e.g., "non-contrast" -> keep, "non- contrast" -> "non-contrast")
                            .replace(/non-\s*/g, 'non-')
                            // Add space before "post" (e.g., "secondspost" -> "seconds post")
                            .replace(/([a-z])(post)/gi, '$1 $2')
                            // Add space after "post" if followed by non-space (e.g., "postinjection" -> "post injection")
                            .replace(/(post)([a-z])/gi, '$1 $2')
                            // Add space between "initial" and "intrathecal" (lowercase followed by lowercase after 't')
                            .replace(/(initial)(intrathecal)/gi, '$1 $2')
                            // Normalize multiple spaces
                            .replace(/\s+/g, ' ')
                            .trim();

                        if (protocolName.length > 3 && protocolName.length < 50) {
                            // Store with position to allow same name at different positions
                            protocols.push({
                                name: protocolName,
                                positionKey: `${Math.round(rect.left)}-${Math.round(rect.top)}`
                            });
                        }
                    }
                }
            }
        });

        // Deduplicate by position (same name at same position = duplicate)
        const seen = new Set();
        return protocols
            .filter(p => {
                if (seen.has(p.positionKey)) return false;
                seen.add(p.positionKey);
                return true;
            })
            .map(p => p.name);
    });
}

/**
 * Extract study description/tag (e.g., "MRI - Initial MRI brain")
 */
async function extractStudyTag(page, modality) {
    return await page.evaluate((modality) => {
        const allText = document.body.innerText;

        // Try to find study tag pattern: "MODALITY - description"
        const patterns = [
            new RegExp(`(${modality})\\s*-\\s*([^.\n\r]+?)(?=\\n|$)`, 'i'),
            new RegExp(`(${modality})\\s*-\\s*([^.\n\r]+?)(?=MRI|CT|DSA|X-RAY|ANGIO|rID:)`, 'i')
        ];

        for (const pattern of patterns) {
            const match = allText.match(pattern);
            if (match && match[0]) {
                const tag = match[0].trim();
                // Clean up and limit length
                if (tag.length > 5 && tag.length < 100) {
                    return tag;
                }
            }
        }

        // For DSA/angiography, look for different patterns
        if (modality === 'DSA' || modality === 'angiography') {
            const dsaPattern = /(DSA|Angiography)\s*[^.\n\r]*?/i;
            const dsaMatch = allText.match(dsaPattern);
            if (dsaMatch && dsaMatch[0] && dsaMatch[0].length > 5 && dsaMatch[0].length < 100) {
                return dsaMatch[0].trim();
            }
        }

        // Fallback: just return modality if no tag found
        return null;
    }, modality);
}

/**
 * Download an image from URL using axios (fast, no browser overhead)
 */
async function downloadImage(imageUrl, destPath) {
    try {
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 30000
        });
        if (response.status === 404) {
            return { success: false, error: '404', imageUrl };
        }
        fs.writeFileSync(destPath, response.data);
        return { success: true, imageUrl };
    } catch (error) {
        return { success: false, error: error.message, imageUrl };
    }
}

/**
 * Download multiple images in parallel batches
 */
async function downloadImagesParallel(page, frameIds, imagesFolder, seriesData, totalFrames) {
    const batchSize = 16; // Download 16 images concurrently
    const results = { downloaded: 0, broken: 0, imageUrls: [], brokenImages: [] };

    for (let i = 0; i < frameIds.length; i += batchSize) {
        const batch = frameIds.slice(i, i + batchSize);
        const batchPromises = batch.map(async (imageId, batchIdx) => {
            const imageIndex = i + batchIdx;
            const series = seriesData;
            const imageUrl = getImageUrl(series, imageIndex);
            const destPath = path.join(imagesFolder, `img_${String(imageIndex + 1).padStart(4, '0')}.jpg`);

            const result = await downloadImage(imageUrl, destPath);
            if (result.success) {
                results.imageUrls.push(imageUrl);
                results.downloaded++;
            } else {
                results.broken++;
                results.brokenImages.push({ imageId, error: result.error, imageUrl });
                try { if (fs.existsSync(destPath)) fs.unlinkSync(destPath); } catch {}
            }

            // Progress logging
            const totalDone = results.downloaded + results.broken;
            if (totalDone % 50 === 0 && totalDone > 0) {
                console.log(`    Downloaded ${results.downloaded}/${totalFrames} images...`);
            }
        });

        await Promise.all(batchPromises);
    }

    return results;
}

/**
 * Main scraper function - supports multiple modalities
 */
async function scrapeRadiopaediaCase(url, options = {}) {
    const { testMode = false, protocolsToTest = 2 } = options;

    console.log('=== Radiopaedia Scraper (API-based) ===\n');
    console.log('URL:', url);
    console.log('Test mode:', testMode);

    const browser = await chromium.launch({
        headless: false,
        args: ['--start-maximized']
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    try {
        // Parse URL to get case ID
        const { caseId, studyId: initialStudyId } = parseRadiopaediaUrl(url);
        console.log(`Case ID: ${caseId}, Initial Study ID: ${initialStudyId}`);

        // Navigate to page
        console.log('\nNavigating to case...');
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(5000);

        // Find all study IDs for this case
        console.log('\nFinding all studies for this case...');

        const allStudyIds = await page.evaluate(() => {
            const studyIds = new Set();

            document.querySelectorAll('a[href*="/studies/"]').forEach(a => {
                const href = a.getAttribute('href');
                const match = href.match(/studies\/(\d+)/);
                if (match) {
                    studyIds.add(match[1]);
                }
            });

            return Array.from(studyIds);
        });

        if (allStudyIds.length === 0) {
            allStudyIds.push(initialStudyId);
        }

        console.log(`Found ${allStudyIds.length} study IDs: ${allStudyIds.join(', ')}`);

        // Fetch data for each study
        console.log('\n=== Fetching Study Data ===\n');

        const studiesData = [];

        for (const studyId of allStudyIds) {
            console.log(`Fetching data for study ${studyId}...`);
            const study = await fetchSeriesData(page, studyId);

            studiesData.push({
                studyId: study.id,
                modality: study.modality,
                caseTitle: study.case_title,
                series: study.series
            });

            console.log(`  Study ${studyId}: ${study.modality} - ${study.series.length} series`);
        }

        // Create case folder
        const caseFolderName = `${caseId}_Radiology_Case_Radiopaediaorg`;
        const caseFolder = path.join(OUTPUT_BASE, caseFolderName);
        fs.mkdirSync(caseFolder, { recursive: true });

        // Save case metadata
        const caseMetadata = {
            caseId,
            caseTitle: studiesData[0]?.caseTitle || 'Unknown',
            url: url,
            modalities: studiesData.map(s => ({
                studyId: s.studyId,
                modality: s.modality,
                seriesCount: s.series.length
            })),
            scrapedAt: new Date().toISOString()
        };

        fs.writeFileSync(
            path.join(caseFolder, 'metadata.json'),
            JSON.stringify(caseMetadata, null, 2)
        );
        console.log(`\nCase metadata saved to: ${caseFolder}`);

        // Process each study/modality
        console.log('\n=== Processing Modalities ===\n');

        let totalImagesDownloaded = 0;

        for (const studyData of studiesData) {
            console.log(`\n--- Processing ${studyData.modality} (Study ${studyData.studyId}) ---`);

            // Navigate to this study to get correct protocol names
            const studyUrl = `https://radiopaedia.org/cases/${caseId}/studies/${studyData.studyId}?new_full_screen_viewer=true`;
            console.log(`Navigating to ${studyUrl}...`);
            await page.goto(studyUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await page.waitForTimeout(5000);

            // Extract study tag (e.g., "MRI - Initial MRI brain")
            const studyTag = await extractStudyTag(page, studyData.modality);
            console.log(`Study tag: ${studyTag || 'N/A'}`);

            // Extract protocol names for this specific study
            let protocolNames = await extractProtocolNames(page);

            // Fallback for studies without sidebar thumbnails (e.g., single-image Photograph studies)
            if (protocolNames.length === 0 && studyData.series.length > 0) {
                console.log(`  No protocol names found, using modality-based naming...`);
                if (studyData.modality === 'Photograph' || studyData.modality === 'X-RAY' || studyData.modality === 'Gross') {
                    protocolNames = [studyData.modality];
                } else if (studyData.series.length === 1) {
                    protocolNames = [`Series ${studyData.series[0].series_id}`];
                }
            }

            console.log(`Found ${protocolNames.length} protocols for ${studyData.modality}`);

            const modality = studyData.modality;
            const seriesList = studyData.series;

            // Map protocols to series - handle duplicate names by adding suffix
            const protocolMapping = [];
            const nameCount = {};

            for (let i = 0; i < Math.min(protocolNames.length, seriesList.length); i++) {
                const series = seriesList[i];
                const frameIds = series.frames.map(f => f.id);
                let protocolName = protocolNames[i];

                // Handle duplicate protocol names by adding suffix
                if (nameCount[protocolName] === undefined) {
                    nameCount[protocolName] = 1;
                } else {
                    nameCount[protocolName]++;
                    protocolName = `${protocolName} (${nameCount[protocolName]})`;
                }

                protocolMapping.push({
                    protocolName: protocolName,
                    seriesId: series.series_id,
                    stackRootId: series.stack_root_id,
                    frameCount: frameIds.length,
                    frameIds: frameIds
                });
            }

            console.log('Protocols:');
            protocolMapping.forEach(p => {
                console.log(`  ${p.protocolName}: ${p.frameCount} images`);
            });

            // Determine which protocols to process
            let protocolsToProcess = protocolMapping;
            if (testMode && protocolsToProcess.length > 2) {
                const shuffled = [...protocolsToProcess].sort(() => Math.random() - 0.5);
                protocolsToProcess = shuffled.slice(0, 2);
                console.log(`\nTEST MODE: Processing ${protocolsToProcess.length} protocols`);
            }

            // Download images for each protocol
            console.log('\nDownloading images...');

            for (const protocol of protocolsToProcess) {
                console.log(`  Processing: ${protocol.protocolName}...`);

                // Handle multiple studies of same modality by adding study ID to folder
                const modalityFolder = studiesData.filter(s => s.modality === modality).length > 1
                    ? `${modality}_${studyData.studyId}`
                    : modality;

                const protocolFolder = path.join(
                    caseFolder,
                    modalityFolder,
                    sanitizeName(protocol.protocolName),
                    `series_${protocol.seriesId}`
                );
                const imagesFolder = path.join(protocolFolder, 'images');
                fs.mkdirSync(imagesFolder, { recursive: true });

                // Get series data for this protocol
                const seriesData = seriesList.find(s => s.series_id === protocol.seriesId);

                // Download images in parallel batches (16 concurrent)
                console.log(`    Starting parallel download of ${protocol.frameCount} images...`);
                const startTime = Date.now();
                const results = await downloadImagesParallel(
                    null, // page not needed anymore
                    protocol.frameIds,
                    imagesFolder,
                    seriesData,
                    protocol.frameCount
                );

                const downloadTime = ((Date.now() - startTime) / 1000).toFixed(1);
                console.log(`    Completed in ${downloadTime}s (${(protocol.frameCount / downloadTime).toFixed(1)} images/sec)`);

                const downloadedCount = results.downloaded;
                const brokenCount = results.broken;
                const imageUrls = results.imageUrls;
                const brokenImages = results.brokenImages;

                // Log broken images for this protocol
                if (brokenCount > 0) {
                    console.log(`    ⚠ ${brokenCount}/${protocol.frameCount} images unavailable (404 from Radiopaedia)`);
                }

                const protocolMetadata = {
                    modality: modality,
                    studyTag: studyTag,
                    protocol: protocol.protocolName,
                    seriesId: protocol.seriesId,
                    stackRootId: protocol.stackRootId,
                    caseFolder: caseFolderName,
                    downloadedAt: new Date().toISOString(),
                    imagesDownloaded: downloadedCount,
                    imagesBroken: brokenCount,
                    imageUrls: imageUrls,
                    brokenImages: brokenImages
                };

                fs.writeFileSync(
                    path.join(protocolFolder, 'metadata.json'),
                    JSON.stringify(protocolMetadata, null, 2)
                );

                if (brokenCount === 0) {
                    console.log(`    ✓ Downloaded ${downloadedCount} images`);
                } else {
                    console.log(`    ✓ Downloaded ${downloadedCount} images (${brokenCount} unavailable)`);
                }
                totalImagesDownloaded += downloadedCount;
            }
        }

        // Update case metadata
        caseMetadata.downloadStatus = {
            completedAt: new Date().toISOString(),
            totalImagesDownloaded: totalImagesDownloaded,
            modalitiesProcessed: studiesData.map(s => s.modality),
            testMode: testMode,
            studies: studiesData.map(s => ({
                studyId: s.studyId,
                modality: s.modality,
                seriesCount: s.series.length
            }))
        };

        fs.writeFileSync(
            path.join(caseFolder, 'metadata.json'),
            JSON.stringify(caseMetadata, null, 2)
        );

        console.log('\n=== SUMMARY ===\n');
        console.log(`Case: ${caseMetadata.caseTitle}`);
        console.log(`Modalities processed: ${studiesData.map(s => s.modality).join(', ')}`);
        console.log(`Total studies: ${studiesData.length}`);
        console.log(`Total images downloaded: ${totalImagesDownloaded}`);
        console.log(`Case folder: ${caseFolder}`);

    } catch (error) {
        console.error('Error during scraping:', error.message);
        const screenshotPath = path.join(OUTPUT_BASE, 'error_screenshot.png');
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log('Error screenshot saved to:', screenshotPath);
    } finally {
        await browser.close();
    }
}

// CLI entry point
if (require.main === module) {
    const fullMode = process.argv.includes('--full');
    const testMode = !fullMode;
    const urlArg = process.argv.find(arg => arg.startsWith('http'));
    const url = urlArg || 'https://radiopaedia.org/cases/231663/studies/177450?new_full_screen_viewer=true';

    scrapeRadiopaediaCase(url, { testMode, protocolsToTest: 2 })
        .then(() => console.log('\nDone!'))
        .catch(console.error);
}

module.exports = { scrapeRadiopaediaCase, parseRadiopaediaUrl };
