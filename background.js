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
const STD_NOTIF_NAME = 'u.notification'; // "update" notification
const NOTIF_DELAY = 15000; // ms until we close the notification automatically
const NOTIF_ICON_PATH = 'images/hacker_news.png';

var id = 0; // the id for each notification
var oldNews = Object.create(null); // set of headlines that have already been displayed
var day = Date.prototype.getDay();
var nextBigNews = []; // the newest headlines: element [0] = title, element [1] = link

// Gets the biggest news that hasn't been seen before.
function getBiggestNews() {
    var rText = this.responseText;
    console.log(rText);
    
    if (/* LABEL not in oldNews */) {
        oldNews[/* LABEL */] = true; // this news is now old news
        nextBigNews[0] = "Ask HN: I will help your startup in exchange of food and a place to stay";
        nextBigNews[1] = "https://news.ycombinator.com/item?id=10032299";
    }
}

/* Checks Hacker News for new topics that have over PT_BENCHMARK points.
 * ON_CLICK is a boolean value that specifies whether or not this check
 * originated from a click. */
function checkForUpdates(onClick) {
    // Send an HTTP request to Hacker News
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', getBiggestNews);
    xhr.open('GET', NEWS_URL, true);
    xhr.setRequestHeader('Access-Control-Allow-Origin', "*");
    xhr.send();
    
    /* If a hot topic was found, throw out a notification! However, 
     * if there is nothing over PT_BENCHMARK points AND the user 
     * clicked on the icon, then we'll settle for whatever we get. */
    if (/* score is >= PT_BENCHMARK */ || onClick) {
        createNotification(nextBigNews[0], nextBigNews[1]);
        makeSound();
    }
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
    chrome.notifications.create(STD_NOTIF_NAME + id, {
        type: 'basic',
        title: title, // the name of the article
        message: link, // a link to the article
        iconUrl: NOTIF_ICON_PATH
    }, function() {});
    
    // Close the notification after 20 seconds
    timer = setTimeout(function() {
        chrome.notifications.clear(STD_NOTIF_NAME + id, function() {});
    }, NOTIF_DELAY);
    
    id++; // now that we're done with this iteration of the notification id, update it
}

// We'll check for updates and start the first alarm
chrome.runtime.onStartup.addListener(function() {
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
