import { chromium } from 'playwright';
import fs from 'fs';

const BASE_URL = 'http://localhost:8080';
const visitedUrls = new Set();
const urlsToVisit = [BASE_URL];
const errors = [];

(async () => {
    console.log('Initiating Playwright comprehensive test...');
    const browser = await chromium.launch({ headless: true });
    
    while (urlsToVisit.length > 0) {
        const url = urlsToVisit.pop();
        if (visitedUrls.has(url)) continue;
        visitedUrls.add(url);
        
        console.log(`\nTesting page: ${url}`);
        const context = await browser.newContext();
        const page = await context.newPage();

        page.on('console', msg => {
            if (msg.type() === 'error' || msg.type() === 'warning') {
                errors.push(`[Console ${msg.type().toUpperCase()}] [${url}] ${msg.text()}`);
            }
        });

        page.on('pageerror', err => {
            errors.push(`[Page Error] [${url}] ${err.message}`);
        });

        page.on('response', response => {
            if (response.status() >= 400 && response.url().startsWith(BASE_URL)) {
                errors.push(`[HTTP ${response.status()}] [${url}] URL: ${response.url()}`);
            }
        });

        try {
            await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        } catch (e) {
            errors.push(`[Navigation Error] Failed to load ${url}: ${e.message}`);
            await context.close();
            continue;
        }

        // Collect new links to visit
        const links = await page.$$eval('a', anchors => anchors.map(a => a.href));
        for (const href of links) {
            // strip fragments and query parameters for identical routes
            const cleanHref = href.split('#')[0];
            if (cleanHref.startsWith(BASE_URL) && !visitedUrls.has(cleanHref) && !urlsToVisit.includes(cleanHref)) {
                urlsToVisit.push(cleanHref);
            }
        }

        // Find and click all buttons for this URL
        const buttons = await page.$$('button');
        console.log(`Found ${buttons.length} buttons on ${url}. Clicking them...`);
        for (let i = 0; i < buttons.length; i++) {
            try {
                const b = buttons[i];
                if (await b.isVisible() && !(await b.isDisabled())) {
                    const val = await b.evaluate(node => node.innerText || node.id || 'Unknown Button');
                    console.log(`  Clicking: ${val.substring(0, 30).replace(/\\n/g, ' ')}...`);
                    await b.click({ timeout: 2000, noWaitAfter: true });
                    // Wait briefly for effects
                    await page.waitForTimeout(500);
                }
            } catch (err) {
                // Button might become detached or disappear, ignore the error
            }
        }
        
        await context.close();
    }

    await browser.close();
    
    console.log('\\n--- COMPREHENSIVE TEST REPORT ---');
    console.log(`Pages Visited: ${visitedUrls.size}`);
    
    // Filter duplicates
    const uniqueErrors = [...new Set(errors)];
    
    if (uniqueErrors.length === 0) {
        console.log('✅ No errors found. The application appears solid.');
    } else {
        console.log(`❌ Found ${uniqueErrors.length} unique errors/warnings:`);
        uniqueErrors.forEach((err, idx) => {
            console.log(`${idx + 1}. ${err}`);
        });
    }
    
    const reportStr = `--- COMPREHENSIVE TEST REPORT ---\\nPages Visited: ${visitedUrls.size}\\n` + 
        (uniqueErrors.length === 0 ? 'No errors found. The application appears solid.' : 
        `Found ${uniqueErrors.length} unique errors/warnings:\\n` + uniqueErrors.map((e, idx) => `${idx + 1}. ${e}`).join('\\n'));
        
    fs.writeFileSync('browser-test-report.txt', reportStr);
    console.log('\\nReport written to browser-test-report.txt');

})();
