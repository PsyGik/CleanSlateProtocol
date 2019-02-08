const puppeteer = require('puppeteer');
var fs = require('fs');

async function main() {

    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 100
    });
    page = await browser.newPage();

    await page.goto('https://mbasic.facebook.com/');
    await page.$eval('input[id=m_login_email]', (el, user) => el.value = user, 'ENTER USER NAME');
    await page.$eval('input[name=pass]', ((el, pass) => el.value = pass), 'ENTER PASSWORD');
    await page.$eval('input[name=login]', button => button.click());
    await page.goto('https://mbasic.facebook.com/');
    await followLinkByContent('Profile');
    await followLinkByContent('Activity log');
    navigateRecursive();
}

function navigateRecursive() {
    page.waitForNavigation({
        timeout: 0,
        waitUntil: 'networkidle2'
    }).then(async () => {
        console.log('Navigated');
        await deletePosts();
    });
}

async function followLinkByContent(content) {
    var link = await page.evaluate((text) => {
        const aTags = document.querySelectorAll('a');
        for (let aTag of aTags) {
            if (aTag.innerText === text) {
                return aTag.href;
            }
        }
    }, content);
    console.log('Opening link', link);
    await page.goto(link);
}

async function deletePosts() {
    // get all "allactivity/delete" and "allactivity/removecontent" links on page
    var deleteLinks = await page.evaluate(() => {
        var links = [];
        // const deleteElements = document.querySelectorAll('a[href*="allactivity/delete"]');
        const aTags = document.querySelectorAll('a');
        // remove all deleteable posts an unlikeable posts
        const deleteElements = Array.from(aTags).filter(tag => tag.innerText === 'Delete' || tag.innerText === 'Unlike');
        console.log('Delete Links', deleteElements);
        for (const el of deleteElements) {
            links.push(el.href);
        }
        return links;
    });
    console.log('Total Links to delete', deleteLinks.length);
    // visit them all to delete content
    for (links of deleteLinks) {
        console.log('Deleting link #', deleteLinks.indexOf(links));
        await page.goto(links);
    }
    navigateRecursive();
}
main();
