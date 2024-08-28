# To Do

- Sort player names alphabetically
- For stats/scoreboard endpoint: limit columns returned. Don't use wildcard.
- API utility function
  - Post, Get...
  - Body, Params...
- X out of Y correct printout after game end
- Show total games played underneath scoreboard
- Write audit to remove local_time stats that have been pushed off the scoreboard by higher scores.
- Point api/stats to most recent games up to 100 per page
- Human readable all stats page behind password
- Put IP address and device info in users table instead of stats table
- How to submit parts page. Tutorial on taking photos and submitting fake answer suggestions.
- Display random motivational message for score below a new first place.
- Users at this device
- Users table contains UUID, Player Names, and IP Address
- Share your score
  - Uses navigator.share function to share score.
  - Canvas for photo?
  - build datajpg string?

## Done

- Separate DOM possile points update from actual possiblePoints state variable.
- Combine Create and Destroy listener functions to one with "create" | "destroy" parameters
- Only record game_end_local_time if user reached the scoreboard
- If gameEnd.type !== "w", log which part the player lost on
- Change api endpoint api/stats to api/scoreboard
- Migrate all SQLite to MySQL - Dang it.
- .env
- local_time column in database
  - This is the data that gets displayed in the scoreboard for the public
- Countdown to start timer

## Nevermind

- shop_name column in database
  - Display this in scoreboard
- Name That Part certificate of perfect game for interveiws? So dumb.
