# To Do

- "How to play" on homepage
- Need loading / inactive state animation for some fetch calls.
  - Submit name button
  - Wrong answer
  - Final part / Win game
- Show total games played underneath scoreboard
- Write audit to remove local_time stats that have been pushed off the scoreboard by higher scores.
- Point api/stats to most recent games up to 100 per page
- Human readable all stats page behind password
- Put IP address and device info in users table instead of stats table
- How to submit parts page. Tutorial on taking photos and submitting fake answer suggestions.
- Display random motivational message for score below a new first place.

## Done

- X out of Y correct printout after game end
- Log number of "play again" clicks in users table
- Consolidate Win and Lose sections to single section
- Sort player names alphabetically
- Scoreboard is over-fetching. Only request appropirate data.
- Users at this device
- Users table contains UUID, Player Names, and IP Address
- API utility function
- Incorrect answer / Lose game animation
- Correct answer dopamine hit animation
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

- Share your score
- shop_name column in database
  - Display this in scoreboard
- Name That Part certificate of perfect game for interveiws? So dumb.
