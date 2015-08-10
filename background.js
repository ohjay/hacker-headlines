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
const STD_PERIOD = 20; // this is how often the check should happen
const STD_NOTIF_NAME = 'u.notification'; // "update" notification
const NOTIF_DELAY = 15000; // ms until we close the notification automatically
const NOTIF_ICON_PATH = 'images/hacker_news.png';
var id = 0; // the id for each notification

// Checks Hacker News for topics that have over PT_BENCHMARK points
function checkForUpdates() {
    /* INSERT UPDATE-CHECKING LOGIC HERE */
    /* presumably AFTER my final on Thursday */
    
    // If it finds a hot topic, throw out a notification!
    if (true) { // (testing notifications atm)
        createNotification();
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

function createNotification() {
    chrome.notifications.create(STD_NOTIF_NAME + id, {
        type: 'basic',
        title: '[HACKER NEWS TITLE]',
        message: '[link]',
        iconUrl: NOTIF_ICON_PATH
    }, function() {});
    
    // Close the notification after 20 seconds
    timer = setTimeout(function() {
        chrome.notifications.clear(STD_NOTIF_NAME + id, function() {});
    }, NOTIF_DELAY);
    
    id++; // now that we're done with this iteration of the notification id, update it
}

// When the icon is clicked, check for updates and reset the alarm timer
chrome.browserAction.onClicked.addListener(function() {
    checkForUpdates();
    
    // Reset el alarm (because we just checked!)
    chrome.alarms.clear(STD_ALARM_NAME);
    startAlarm();
});

// We'll check for updates and start the first alarm
chrome.runtime.onLaunched.addListener(function() {
    checkForUpdates();
    startAlarm();
});
