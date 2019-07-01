# CatBoy-Bot
This is a discord bot that can send catboys! Witten 100% in typescript, using a sqlite3 db. This bot is meant to run on heroku, and exports the DB file to a discord channel on exit, and imports it on boot. This is to get past heroku nuking the filesystem every 24 hours.


### It pulls the catboys from 3 sources:

searches: `danbooru.donmai.us`, `konachan.com`, `gelbooru.com` and `safebooru.org` by using the `booru` module on npm.

searches 4chan.org/cm for catboy threads that match a regex, and grabs all the images from the thread(s).

searches bing for a few different terms, find them in `src/lib/tools/bing.ts`.


People can pick a favorite cat by reacitng with :cat: and get it sent back with `<prefix>mycatboy` and can report a bad cat by reacting with `:pouty_cat:`
The admin can filter cats by reacting with `F`.
The bot has a built in anti-spam timer of 1.5 seconds.

to run this bot, populate the `.env.example`, rename it to just `.env`, then run `npm run config`, then run `npm run makedb`
note: this will only make the production files, if you wanna use `npm run dev` you'll need to make a copy of the db and config files. Then rename them to whatever your dev names are, and send them manually to your db channel.

this bot isnt meant to be used by anyone but me.
