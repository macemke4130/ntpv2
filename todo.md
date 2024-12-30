# To Do

- Add games_played to users table for UUID
- Remove filmstrip header, replace with static montage image.
  - Make montage image in photoshop.
- Turn existing gameplay into "Veteran Mode" and create version of game that will play all the way through unless the time runs out. Call it "Rookie Mode"

  - After a rookie game, prompt user "Play in Veteran mode to get on the scoreboard!"
  - Turn rookie mode score printout into table. Make accessable.
  - Wrong answer will continue gameplay. Keep track of wrong answers.
    - Score[] equal to the length of Parts[]?
      - Score[] has info about time per turn, number of mouse hovers per turn, correctAnswer boolean, points earned for each part.
        - Could get "'whatever part' gives an average of X points to a user" data
      - Build Score[] with Parts[].fill and populate blank score objects? Update Score[currentPart] after answer selection?
  - Eliminate answer button animations for rookie mode
  - Toggle button on Home Page for "Veteran or Rookie". Default to rookie.
  - New field in database for game mode
  - Veteran mode is the only way onto the scoreboard!
    - "Play in veteran mode to get on the scoreboard" after every rookie game
  - Show which answers were wrong after the game above the scoreboard, but do not give correct answers.

- Scoreboard shows top 100
  - Overflow <div> window scrolls to the player's score
  - 75vh or similar
- Need loading / inactive state animation for some fetch calls.
  - Submit name button
  - Wrong answer
  - Final part / Win game
- Turn points color back to white from red on next part.
- Point api/stats to most recent games up to 100 per page

## To Do Post Launch

- Do I care about Object.freeze() for totalPoints? Maybe.
  - Does this mean I change all of the state variables into an object named State?
- Progress bar for both game modes. x of y numbers and a <progress> element.
- Human readable all stats page behind password
- How to submit parts page. Tutorial on taking photos and submitting fake answer suggestions.
- Write audit to remove local_time stats that have been pushed off the scoreboard by higher scores.
- If a user plays on Rookie a multiple of 10 times in a row, prompt "Try in Expert Mode?"
  - Keep track with localStorage
  - Clear numberOfRookieGames with the home page toggle.

# Done

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

## Nevermind

- Mode: Veteran | Rookie toggle located between scores during play.
- Share your score
- shop_name column in database
  - Display this in scoreboard
- Name That Part certificate of perfect game for interveiws? So dumb.
