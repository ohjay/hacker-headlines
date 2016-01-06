/**
 * Background
 * This code will run in the background, checking Hacker News for updates either 
 * every 20 minutes or when the user clicks on the extension icon.
 * 
 * @license MIT license
 */

const NEWS_URL = 'https://news.ycombinator.com/';
const PT_BENCHMARK = 70;
const NOTIF_SOUND_PATH = 'sounds/waterSplashing.mp3';
const STD_ALARM_NAME = 'c.alarm'; // "check" alarm
const STD_PERIOD = 20; // this (in minutes) is how often the check should happen
const NOTIF_DELAY = 15000; // ms until we close the notification automatically
const NOTIF_ICON_PATH = 'images/hacker_news.png';

var notifId = 0; // the id for each notification
var day = (new Date()).getDay();
var links = []; /* links, indexed by notification id. Dually serves as an set of identifiers
                 * for headlines that have already been displayed */

/* Gets the biggest news that hasn't been seen before, by parsing the page data
 * given as NEWS. "Biggest news" refers to the highest-scoring news on the front page 
 * (i.e. the one with the most upvotes). 
 * 
 * Returns an array of size 3 containing the title as the first element [0],
 * the link as second element [1], and the score as the third element [2]. 
 */
function getBiggestNews(news) {
    // Parse: link/title/score chunks
    var data = news.match(/class="title".*<a href=".*">.*<\/a>.*sitebit comhead".*\n.*id="score_\d+">\d+ points/g);
    var dtLength = data.length;
    
    var topLink, topTitle, topScore = -1; // vars for keeping track of the biggest news
    for (var i = 0; i < dtLength; i++) {
        var dataRe = /class="title".*<a href="(.*)">(.*)<\/a>.*sitebit comhead.*\n.*>(\d+)\spoints/g;
        var filteredData = dataRe.exec(data[i]).slice(1, 4);
        var link = filteredData[0], title = filteredData[1], score = filteredData[2];
        
        if (window.links.indexOf(link) == -1 && parseInt(score) > topScore) {
            // i.e. we haven't seen the link before, and of this pool the score is the biggest
            // update our "best of show" attributes!
            topLink = link;
            topTitle = title;
            topScore = score;
        }
    }

    window.links[notifId] = topLink; // the news we return is now old news
    return [topTitle, topLink, topScore];
}

/* Checks Hacker News for new topics that have over PT_BENCHMARK points.
 * ON_CLICK is a boolean value that specifies whether or not this check
 * originated from a click. */
function checkForUpdates(onClick) {   
    // Send an HTTP GET request to Hacker News
    var xhr = new XMLHttpRequest();
    xhr.open('GET', NEWS_URL, true);
    xhr.responseType = 'text';
    xhr.onload = function(e) {
        bigNews = getBiggestNews(this.responseText);

        /* If a hot topic was found, throw out a notification! However, 
         * if the user clicked on the icon and there is nothing over 
         * PT_BENCHMARK points, then we'll settle for the highest-rated news. */
        if (onClick || bigNews[2] >= PT_BENCHMARK) {
            createNotification(bigNews[0], "Click to view article!");
            makeSound();
        }
    };
    
    xhr.send(); // go request go!
}

// Generates the sound that is specified by NOTIF_SOUND_PATH.
function makeSound() {
    var sound = new Audio(NOTIF_SOUND_PATH);
    sound.play();
}

function startAlarm() {
    chrome.alarms.create(STD_ALARM_NAME, {
        delayInMinutes: STD_PERIOD,
        periodInMinutes: STD_PERIOD
    });
}

// Creates a notification with TITLE as the title and LINK as the message.
function createNotification(title, link) {
    chrome.notifications.create(notifId.toString(), {
        type: 'basic',
        title: title, // the name of the article
        message: link, // a link to the article
        iconUrl: NOTIF_ICON_PATH
    }, function() {});
    
    // Close the notification after 20 seconds
    timer = setTimeout(function() {
        chrome.notifications.clear(notifId.toString(), function() {});
    }, NOTIF_DELAY);
    
    notifId++; // now that we're done with this iteration of the notification id, update it
}

// We'll check for updates and start the first alarm
chrome.runtime.onInstalled.addListener(function() {
    checkForUpdates(false);
    startAlarm();
});

// Every time an alarm rings, look for hot topics that we haven't seen before
chrome.alarms.onAlarm.addListener(function() {
    // The oldNews set should be cleared by the day
    if (Date.prototype.getDay() != day) { // meaning: is it a new day?
        oldNews = Object.create(null);
        day = Date.prototype.getDay();
    }
    
    checkForUpdates(false);
});

// When the icon is clicked, check for updates and reset the alarm timer
chrome.browserAction.onClicked.addListener(function() {
    checkForUpdates(true);
    
    // Reset el alarm (because we just checked!)
    chrome.alarms.clear(STD_ALARM_NAME);
    startAlarm();
});

// Have the notification take you to the article on click
chrome.notifications.onClicked.addListener(function(notificationId) {
    window.open(links[parseInt(notificationId)]);
});
