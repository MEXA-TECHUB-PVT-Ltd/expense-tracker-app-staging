// src/utils/DateFormatter.js

export const formatDateSql = (date) => {
    let parsedDate = new Date(date);

    // If the parsed date is invalid (NaN), manually parse the string into a valid date
    if (isNaN(parsedDate.getTime())) {
        const parts = date.split(" "); // Split by space: ["Nov", "1,", "2024"]
        const monthNames = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];

        const month = monthNames.indexOf(parts[0]); // Get the month index
        const day = parseInt(parts[1].replace(",", ""), 10); // Parse the day (remove comma)
        const year = parseInt(parts[2], 10); // Parse the year

        parsedDate = new Date(year, month, day); // Create a new Date object
    }

    // Get the year, month, and day, ensuring the format is 'YYYY-MM-DD'
    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;  // Return the formatted date
};
