const { parse } = require('querystring');
const { addLootbox } = require('../db');
const recentlyReceived = new Set();

module.exports = (app, config) =>
  app.post('/dblistwebhook', async (req, res) => {
    const [ auth, timestamp ] = req.headers['x-dbl-signature']
      ? req.headers['x-dbl-signature'].split(/\s+/)
      : [ null ];

    if (
      auth === config.dblcom_webhook_secret &&
      (Date.now() - 1000 * 120) < timestamp
    ) {
      const body = parse(req.body);

      if (recentlyReceived.has(body.id)) {
        console.log('received duplicate', body.id); // temporary so we can find out whether this is actually real
        return res.status(425).send({ status: 425 });
      }

      recentlyReceived.add(body.id);
      setTimeout(() => {
        recentlyReceived.remove(body.id);
      }, 60 * 60 * 1000);
  
      await addLootbox(body.id);
      res.status(200).send({ status: 200 });
    } else {
      res.status(401).send({ status: 401 });
    }
  });
