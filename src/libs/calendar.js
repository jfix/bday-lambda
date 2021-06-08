import { google } from 'googleapis';
import { googleAuth } from './auth';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(localizedFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Europe/Paris");

const getRandomEmoji = () =>  ["🎂", "🥳", "🍾", "🥂", "🎇", "🎉", "🎁"][7 * Math.random() | 0];

const formatBirthdays = async (arr) => {
    let res = ""
    arr.forEach((b) => {
        res = `${res}${getRandomEmoji()} ${dayjs(b.date).format('D MMMM')}: ${b.person} · `
    })
    return res.substring(0, res.length - 2);
};

const byPeople = (a, b) => {
    const _a = a.person.toUpperCase()
    const _b = b.person.toUpperCase()
    if (_a < _b) return -1
    if (_a > _b) return 1
    return 0
};

// /**
//  * Retrieves a list of birthdays
//  * @param {JWT} auth - JWTClient instance
//  * @param {number} maxItems - number of items to return, default is 250 which corresponds to the max
//  * number of items in a page returned by the `list` method.
//  * @returns {Array} - an array containing objects with `person` and `date` keys, order alphabetically
//  * by the person's name.
//  */
const getBirthdays = async (opts) => {
    try {
        const calendar = google.calendar({
            version: 'v3',
            auth: googleAuth()
        })

        let res = []

        const { data: { items } } = await calendar.events.list({
            calendarId: process.env.CALENDAR_ID,
            timeMin: opts.timeMin,
            timeMax: opts.timeMax,
            maxResults: opts.maxItems,
        })
        // extract only the name and the date
        items.map((e) => res.push({person: e.summary, date: e.start.date}))
        return res;
    } catch (error) {
        console.log('ERROR in getBirthdays: ' + error)
    }
}
const findBirthdayChildByDate = async (opts) => {
    try {
        if (!opts.date) throw Error("Missing 'date' value");
        if (!(opts.date || Object.prototype.toString.call(opts.date) !== "[object Date]")) throw Error("Wrong type, expected Date object");
        opts.timeMin = dayjs(opts.date).startOf('day').format();
        opts.timeMax = dayjs(opts.date).endOf('day').format();

        const arr =  await getBirthdays(opts);
        return arr;
    } catch (error) {
        console.log(`ERROR in findBirthdayChildByDate: ${error}`);  
    }
};

const findBirthdayChildByName = async (name) => {
    try {
        const n = name.toLowerCase();
        const all = await getBirthdays({});
        const matched = all.filter((b) => {
            const nn = b.person.toLowerCase();
            return (nn.includes(n))
        })
        return matched;
    } catch (error) {
        console.log(`ERROR in findBirthdayChildByName: ${error}`);
    }
};

/**
 * Return a Markdown string of one or more people
 * @param {*} opts 
 * @returns String
 */
const findEvent = async (opts) => {
    try {
        if (!opts.date) throw Error("Missing 'date' value");
        if (!(opts.date || Object.prototype.toString.call(opts.date) !== "[object Date]")) throw Error("Wrong type, expected Date object");
        opts.timeMin = dayjs(opts.date).tz("Europe/Paris").startOf('day').format();
        opts.timeMax = dayjs(opts.date).tz("Europe/Paris").endOf('day').format();

        console.log(`FINDEVENT: ${opts.timeMin} - ${opts.timeMax}`);

        const arr =  await getBirthdays(opts);
        let birthdayChildren = '';
        if (arr.length < 1) {
            return;
        } else if (arr.length === 2) {
            birthdayChildren = arr.map((p) => `*${p.person}*`).join(' and ');
        } else {
            birthdayChildren = arr.map((p) => `*${p.person}*`).join(', ');
        }
        return birthdayChildren;
    } catch (error) {
        console.log(`ERROR in findEvent: ${error}`)
    }
}

/**
 * 
 * @param {Object} data containing person and date
 * date must use this format: 2021-12-31 
 * @returns 
 */
const addBirthday = async (data) => {
    try {
        const calendar = google.calendar({
            version: 'v3', 
            auth: googleAuth()
        });
        await calendar.events.insert({
            calendarId: process.env.CALENDAR_ID,
            requestBody: {
                summary: data.person,
                recurrence: ['RRULE:FREQ=YEARLY'],
                start: {
                    date: data.date
                },
                end: {
                    date: data.date
                }
            }
        });
        return true;
    } catch (error) {
        console.log('ERROR in addBirthday: ' + error)
        return false;
    }
};

module.exports = {
    getBirthdays,
    formatBirthdays,
    findBirthdayChildByName,
    findBirthdayChildByDate,
    byPeople,
    addBirthday,
    findEvent
}