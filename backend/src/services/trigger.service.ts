import axios from "axios";
import Screen from "../models/screen.model";
import { emitToScreen } from "./socket.service";
import { format, getHours } from "date-fns";

/**
 * Get current weather for a location
 * @param {string} location
 * @returns {Promise<any>}
 */
const getCurrentWeather = async (location: string) => {
    try {
        const apiKey = process.env.OPENWEATHER_API_KEY;
        if (!apiKey) return null;

        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`
        );
        return {
            condition: response.data.weather[0].main, // e.g., 'Rain', 'Clear'
            temp: response.data.main.temp,
        };
    } catch (error) {
        console.error("Weather API error:", error);
        return null;
    }
};

/**
 * Check if the current date is a holiday
 * @returns {boolean}
 */
const isHoliday = () => {
    const today = format(new Date(), "MM-dd");
    const fixedHolidays = [
        "01-01", // New Year's Day
        "07-04", // Independence Day
        "12-25", // Christmas
        "12-31", // New Year's Eve
    ];
    return fixedHolidays.includes(today);
};

/**
 * Get the current daypart
 * @returns {string}
 */
const getDaypart = () => {
    const hour = getHours(new Date());
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 21) return "evening";
    return "night";
};

/**
 * Evaluate triggers for a screen
 * @param {any} screen
 * @returns {Promise<any>}
 */
const evaluateTriggers = async (screen: any) => {
    const now = new Date();
    const results: any = {
        time: format(now, "HH:mm"),
        day: format(now, "EEEE"),
        daypart: getDaypart(),
        isHoliday: isHoliday(),
    };

    if (screen.location) {
        results.weather = await getCurrentWeather(screen.location);
    }

    return results;
};

/**
 * Execute a generic webhook/API trigger
 * @param {string} url
 * @param {string} method
 * @param {any} headers
 * @returns {Promise<any>}
 */
const executeWebhook = async (url: string, method: string = "GET", headers: any = {}) => {
    try {
        const response = await axios({
            url,
            method,
            headers,
        });
        return response.data;
    } catch (error) {
        console.error("Webhook trigger failed:", error);
        return null;
    }
};

/**
 * Start periodic polling for all screens
 */
const startPolling = () => {
    setInterval(async () => {
        try {
            const screens = await Screen.find({ location: { $exists: true } });
            for (const screen of screens) {
                const triggers = await evaluateTriggers(screen);
                emitToScreen(screen.id, "trigger_update", triggers);
            }
        } catch (error) {
            console.error("Trigger polling failed:", error);
        }
    }, 15 * 60 * 1000); // 15 minutes
};

export default {
    getCurrentWeather,
    evaluateTriggers,
    executeWebhook,
    startPolling,
};
