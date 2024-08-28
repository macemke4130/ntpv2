# Name That Part

...is a game for bicycle nerds.

https://www.namethatpart.com - Still Version 1

This is version 2 of the game. The original version was created as I was learning React and GraphQL. The game does not require that aggresive of a toolset, so I wanted to rewrite the whole project from scratch using vanilla TypeScript,a simple REST API, JSON and a MySQL database.

Special attention is being paid to user experience.

- Buttons are now keyboard friendly. Users may use the TAB and ENTER keys to play.
- The timer for the next part won't begin counting down until both part images have finished loading completely.
- A countdown to start timer suggested by some user feedback.
- The scoreboard will give feedback based on the current score and state of the scoreboard. This will hopefully promote more repeat games, something I've seen plenty of already.
  - "x Points from the scoreboard!"
  - "x Points from first place!"
  - "x Points from the next best score" (To do)
- Instead of points dropping by 25 every 1 second, points now drop by 1 every 40 milliseconds. This will eliminate the scoreboard being all perfect scores.
  - I was extremely impressed with the multitude of users who were eventually able to score 100%, all without a single point drop.
  - This will hopefully stoke more competition and excitement among friends.

Moving the parts information from a MySQL table to a JSON document will make adding new parts much more simple and quick, so users will get to experience new parts on a more regular basis.

This project is funded and maintained completely by myself in my free time so if you play and enjoy it, please share with your friends.

https://www.namethatpart.com - Still Version 1
