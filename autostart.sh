# Here's an autostart script file!
# requires pm2. pathing is specific for the location of the app.js file
# for some reason, pm2 works when in the working directory, otherwise it sucks
# use cron for start up: "crontab -e" and add "@reboot /path/to/script"

cd /home/astigmatism/expressjs-crazyerics/
pm2 start app.js --name crazyerics -i -1 --env production