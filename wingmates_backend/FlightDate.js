function getRandomFutureDayAndTimes() {
    // Get the current date
    const currentDate = new Date();
  
    // Calculate the date range for the next three months
    const futureDate = new Date(currentDate);
    futureDate.setMonth(currentDate.getMonth() + 3);
  
    // Generate a random day within the next three months
    const randomDay = new Date(currentDate.getTime() + Math.random() * (futureDate.getTime() - currentDate.getTime()));
  
    // Generate two random times on the random day
    const randomTime1 = new Date(randomDay);
    const randomTime2 = new Date(randomDay);
  
    // Calculate a random time difference between 2 and 7 hours
    const timeDifference = 2 * 60 * 60 * 1000 + Math.random() * 5 * 60 * 60 * 1000;
    randomTime2.setTime(randomTime1.getTime() + timeDifference);
  
    // Format the times as strings (e.g., "HH:mm:ss")
    const formattedTime1 = randomTime1.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const formattedTime2 = randomTime2.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  
    // Return an object with the random day and times
    return {
      randomDay: randomDay.toISOString().split('T')[0], // Return the random day in 'YYYY-MM-DD' format
      randomTime1: formattedTime1,
      randomTime2: formattedTime2,
    };
  }
  
  
module.exports = getRandomFutureDayAndTimes;