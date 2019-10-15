# Catboy Bot
A Discord bot written in typescript, to send catboys, because who doesn't love catboys?
This bot uses a Sqlite3 db, and runs on heroku, which wipes the filesystem every day, so it has some cool stuff to deal with that.
Also this bot really isnt meant to be used by anyone else, as the scripts to create the initial db are very outdated.

## Current Features:
- FileLoader system, which has functions to import/export a given file to a discord channel
   - This bot is meant to be run on heroku, which completely wipes the filesystem every 24 hours
   - To get past this, on boot we download the *.db file from a given discord channel
   - We export the *.db file every 5 minutes to a given discord channel
   - Only on SIGTERM, we archive the db, aka sending the db to a given (archive only) discord channel + exporting the db like normal
   - On SIGINT, we only export the db like normal. SIGINT is only sent to the bot during testing and 
- A 4chan scraper, a booru scraper, and a bing image search scraper.
- Sqlite3 as a database, to store a whole lotta data
- A system for users to report bad (aka not catboy) images by them reacting with a :pouty_cat:
- Favorites system, users can save their favorite catboy by reacting with :cat:, they can see this catboy with `-mycatboy`
- An Admin system, where you can add admins with -addadmin `snowflake_id`and remove them with -removeadmin `snowflake_id`
- Filter system, Any admins can filter a catboy by reacting with `F`
   - Filter system works with any URL, and inserts bad URLs into their own table
   - Useful because the db is scraper only, you cannot enter your own catboy urls, so sometimes offtopic images get entered into the db
- A Command handler, that grabs all the command files in `./src/commands/`, and uses their default export as the actual command function
   - Commands have a help object, which stores their timeOut, their commandName, and their help text
   - the commandName is the name used when running the command, aka `-commandName` runs that commandName
- User-action system
   - Bot Actions are commands such as `-hug @user` and `-slap @user` 
   - Actions can be added with -addaction `actionName $imageUrl`, and removed with -deleteaction `$imageUrl`
   - Multiple user actions can be added with the same name, when an action is used, if there is more than 1 action, a random one is selected.
- A system to create the `-help` command on boot
   - Pulls in all the help text from the command files and adds that to a Discord embed
   - If the command file doesn't have help text, it leaves it out of the help message (aka admin only commands)
   - Lists all Possible user actions in the embed, aka lists `-hug` if available, etc
- Antispam system
   - Commands are limited per user, per individual command. So a user can run the command `-sayd` even when they're currently timed out from the command `-catboy`
   - the cooldown amount is in milliseconds, and is set in each command file's help object, as timeOut. If no timeOut is specified, it defaults to 1 second
   - Basically, if 1 user tries to run `-say` before the specified cooldown in `-say`'s help object, the bot will react with a :clock:
   - We store the last time a user has run a command in an inmemory-only sqlite3 db, which is seperate from our main db. (which means the antispam system is VERY fast)
- A Logger
- NPM Scripts for Dev mode and Prod mode
   - dev mode changes the db and config files to dev files, and outputs all sqlite commands that are executed
- Handling for a `*prefix` command, where * can be anything, so you can find out the current prefix by using any random prefix
- User-stats system
   - For every catboy you get, a colomn in the userstats table is updated
   - contains information about how many catboys you've gotten from bing/booru/4chan, which also means total amount of catboys you've sent
- A system to set the current game the botUser is playing
   - When given just text, it sets the status to `Playing $text`
   - When given a gamestate (PLAYING, STREAMING, WATCHING, LISTENING), after the command, it uses that game state
   - For example, `-game watching movies` sets the bot to `Watching movies`
   - The gamestate `STREAMING` is supported, the 2nd command argument should be a twitch.tv url, and flavor text after. This sets the bot's dot to Purple and says `STREAMING $flavor_text`
- Prefix system, to change the bots global prefix 

## Notable Commands (not all of them)
- Admin
   - Update the bing/booru/4chan databases
   - update the version of the config/db files that are exported to your db channel with local versions
   - a checkHealth function
   - a way to dump the config/db file (aka send the file as a discord message)
   - Add/Delete User-actions and Bot admins, and a way to List all bot-actions
- Catboy
   - the odds of picking a 4chan/booru/bing catboy are calculated every 5 minutes using the total amount of catboys in each table, so the chances are evenly distributed
   - Everytime you use this command, the table the cat is from is recorded and logged in the userstats table with your `snowflake_id` as the index
   - Stores the number of catboys in each table in their own *Count variables
   - We generate a random number between 0 and *Count, using that number as an OFFSET to get a random catboy, as sqlite is VERY slow at grabbing random rows by itself
- Catboydump
   - Calls the default function in `catboy.ts` 5 times, joins all returned links into one message, aka sending 5 catboy image urls in 1 message when discord embeds the images
- Mycatboy
   - Sends your own personal favorite catboy, select a favorite by reacting with :cat: to a catboy
- Game
   - Used to change the current game and playing state
- Mystats 
   - Sends a message about your current statistics, aka how many bing cats you've sent and total catboys you've sent etc
- Prefix
   - Used to change the global prefix of the bot
- Reports 
   - Used to view all currently reported catboys, sends them as in their own message so they can be easily filtered with an `F` react
- Thread
   - Command that lists the current active catboy 4chan threads, and archived catboy threads that have yet to 404
- Why
   - 2nd Argument is a url which is in the db, the command then returns results about why a given url is in the db, and everything we know about that url (aka the other columns in the db, height, md5, etc)

enjoy