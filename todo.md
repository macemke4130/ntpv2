# To Do

- Remove filmstrip header, replace with static montage image.
  - Make montage image in photoshop.
- Turn existing gameplay into "Veteran Mode" and create version of game that will play all the way through unless the time runs out. Call it "Rookie Mode".

  - Wrong answer will continue gameplay. Keep track of wrong answers.
  - Mode: Veteran | Rookie toggle located between scores during play.
    - Score[] equal to the length of Parts[]?
      - Score[] has info about time per turn, number of mouse hovers per turn, correctAnswer boolean, points earned for each part.
        - Could get "'whatever part' gives an average of X points to a user" data
      - Build Score[] with Parts[].fill and populate blank score objects? Update Score[currentPart] after answer selection?
  - Eliminate answer button animations
  - Toggle button on Home Page for "Veteran or Rookie". Default to rookie.
  - New field in database for game mode
  - Scoreboard <table> shows which mode user played in. Or...
    - Two scoreboards? One for each mode? Scoreboard the user just played is on top?
    - Veteran mode is the only way onto the scoreboard!
      - "Play in veteran mode to get on the scoreboard" after every rookie game
  - Show which answers were wrong after the game above the scoreboard, but do not give correct answers.
  - If a user plays on Rookie a multiple of 10 times in a row, prompt "Try in Expert Mode?"
    - Keep track with localStorage
    - Clear numberOfRookieGames with the home page toggle.
  - localStorage to determine mode. URL parameter would potentially lead to someone sharing veteran mode to a rookie.

- Scoreboard shows top 100
  - Overflow <div> window scrolls to the player's score
  - 75vh or similar
- "How to play" on homepage
- Need loading / inactive state animation for some fetch calls.
  - Submit name button
  - Wrong answer
  - Final part / Win game
- "Which part is this?" (or something) text over the buttons
  - Dissapears after 5 answers.
- Turn points color back to white from red on next part.
- Write audit to remove local_time stats that have been pushed off the scoreboard by higher scores.
- Point api/stats to most recent games up to 100 per page
- Human readable all stats page behind password
- How to submit parts page. Tutorial on taking photos and submitting fake answer suggestions.

## Done

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

## Nevermind

- Share your score
- shop_name column in database
  - Display this in scoreboard
- Name That Part certificate of perfect game for interveiws? So dumb.
