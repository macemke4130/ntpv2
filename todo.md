# To Do

- Wait until DOMContentLoaded to add film strip animation?
- Move fetchpriority="high" to first image in dom tree, and reorder with flex so the browser will see this image first?
- Write overflow catch for game_seconds tinyint column. 65_535 maximum
- Create UUID Backup for non-secure testing
- Create media specific CSS files
- Device info click opens information in modal
- When someone makes the scoreboard, send me an email https://nodemailer.com/
- track referring site
- Wizard Mode
  - 10 possible answers
  - One image only
  - 10 seconds per part
- Rookie - "You'll get your results after the game" during gameplay
- Veteran Mode Countdown clock animation?
- Dynamic import for game ending code
- Admin

  - Remove ID from admin tables. Just keep it in an attribute. I don't care.
  - Make users' UUID an <a> and link to all their stats and games
  - Admin section has games per day SVG chart

- Add ?s=1 or similar to URL of share API
  Different color lines for veteran games and rookie games
- Highlight tie games in the scoreboard
- Move all appendChild() calls inside for loops to build an element outside of the dom, then update the dom after the loop
- Move all "data-game-over" "data-game-mode" attributes to <body>
- Delay import of gameWin instructions to further along in the game.
- Add "Time Out" to time out game over "Game Over" text
- Users table need "last_visited" column
- Feature sponsored bonus parts brought to you by companies.

  - Bonus part, brought to you by Microshift
  - Is all Microshift answers
  - Getting it right adds 500 points to your score, plus the timer points remaining
  - Wrong answers don't end the game
  - Keep track of sponsored parts seen with the stats table

- Need loading / inactive state animation for some fetch calls.

  - Submit name button
  - Wrong answer
  - Final part / Win game

- How to submit parts page. Tutorial on taking photos and submitting fake answer suggestions.
- Write audit to remove local_time stats that have been pushed off the scoreboard by higher scores.

# Done

- Update readme.md
- Remove CORS
- Add exception for local development in 301 redirect
- Move critical css to style tag
- validAnswers[] should be a set.
- Admin: JWT
- Admin: Split up games and users
- Defer offscreen images in film strip for index and about
- Make state an object. Would make it more clear that I'm updating state with state.gameMode = ...
- Scoreboard
- Dashboard
- Remove all possible correct answers from wrongAnswers[] with a comparison algorithm
- "Play in veteran mode to get on the scoreboard" after every rookie game
- Turn "share" feature back on
- Open Graph meta data
- Progress bar for both game modes. x of y numbers and a <progress> element.
- Show which answers were wrong after the game, but do not give correct answers.
- Toggle button on Home Page for "Veteran or Rookie". Default to rookie.
- Turn existing gameplay into "Veteran Mode" and create version of game that will play all the way through. Call it "Rookie Mode"
- After a rookie game, prompt user "Play in Veteran mode to get on the scoreboard!"
- Add games_played to users table for UUID
- localStorage to determine mode. URL parameter would potentially lead to someone sharing veteran mode to a rookie.
- "How to play" on homepage
- "Which part is this?" (or something) text over the buttons
- Put gameMode into stats table
- Footer with links and copywrite
- Perfect score "x out of y" is off by 1
- Display random motivational message for score below a new first place.
- Put IP address and device info in users table instead of stats table
- Show total games played underneath scoreboard
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
- X of Y on play screen to give user idea of how far along they are in the game.
- Scoreboard page in footer so folks can see scores without playing a game
- Mobile footer menu

## Nevermind

- Share your score
- shop_name column in database
  - Display this in scoreboard
- Name That Part certificate of perfect game for interveiws? So dumb.
