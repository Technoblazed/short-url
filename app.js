const _ = require('lodash');
const db = require('./models');
const bodyParser = require('koa-bodyparser');
const logger = require('koa-logger');

const Koa = require('koa');
const app = new Koa();

app.use(bodyParser());
app.use(logger());

app.use(async(ctx) => {
  const method = ctx.request.method;
  const url = ctx.request.url;
  const token = url.replace(/\/\//g, '/').split('/')[1].split('?')[0];

  if (method === 'GET' && token) {
    const result = await db.shorturl.findOne({
      where: {
        redirectToken: token
      }
    });

    if (result) {
      return ctx.redirect(`${/(http(s?)):\/\//i.test(result.redirectTarget) ? '' : 'http://'}${result.redirectTarget}`);
    } else {
      ctx.body = {
        status: 404,
        message: 'Not Found'
      };
    }
  } else if (method === 'POST' && token === 'new') {
    const redirectTarget = ctx.request.body.redirectTarget;

    if (redirectTarget) {
      const result = await db.shorturl.create({
        redirectTarget
      });

      ctx.body = {
        status: 200,
        message: 'OK',
        data: {
          redirectTarget,
          redirectToken: result.redirectToken
        }
      };
    } else {
      ctx.body = {
        status: 400,
        message: 'Bad Request',
        error: 'No redirectTarget specified'
      };
    }
  } else {
    ctx.redirect('http://mythicleague.com');
  }
});

app.listen(3000, () => {
  db.sequelize.sync();
});
