const bodyParser = require('koa-bodyparser');
const logger = require('koa-logger');

const Koa = require('koa');
const db = require('./models');

const app = new Koa();

app.use(bodyParser());
app.use(logger());

app.use(async(ctx) => {
  const { method, url } = ctx.request;
  const { redirectTarget, redirectToken } = ctx.request.body;
  const token = url.replace(/\/\//g, '/').split('/')[1].split('?')[0];

  ctx.set('Content-Type', 'application/json');

  if (method === 'GET' && token) {
    const result = await db.shorturl.findOne({ where: { redirectToken: token } });

    if (result) {
      return ctx.redirect(`${/(http(s?)):\/\//i.test(result.redirectTarget) ? '' : 'http://'}${result.redirectTarget}`);
    }

    ctx.status = 404;
    ctx.body = { status: 404, message: 'Not Found' };
  } else if (method === 'POST' && token === 'new') {
    if (redirectTarget) {
      try {
        if (redirectToken) {
          const [result, created] = await db.shorturl.findOrCreate({
            where: { redirectToken },
            defaults: { redirectTarget, redirectToken }
          });

          if (created) {
            ctx.body = {
              status: 200,
              message: 'OK',
              data: { redirectTarget, redirectToken: result.redirectToken }
            };
          } else {
            ctx.status = 400;
            ctx.body = { status: 400, message: 'Bad Request', error: 'Token already exists' };
          }
        } else {
          const result = await db.shorturl.create({ redirectTarget });

          ctx.body = {
            status: 200,
            message: 'OK',
            data: { redirectTarget, redirectToken: result.redirectToken }
          };
        }
      } catch (e) {
        ctx.status = 400;
        ctx.body = { status: 400, message: 'Bad Request', error: 'Database query failed' };
      }
    } else {
      ctx.status = 400;
      ctx.body = { status: 400, message: 'Bad Request', error: 'No redirectTarget specified' };
    }
  } else if (method === 'POST' && token === 'clear') {
    try {
      if (redirectToken) {
        const affectedRows = await db.shorturl.destroy({ where: { redirectToken } });

        if (affectedRows) {
          ctx.body = { status: 200, message: 'OK', data: { redirectToken } };
        } else {
          ctx.status = 400;
          ctx.body = { status: 400, message: 'Bad Request', error: 'Token does not exist' };
        }
      } else {
        ctx.status = 400;
        ctx.body = { status: 400, message: 'Bad Request', error: 'No redirectToken specified' };
      }
    } catch (e) {
      ctx.status = 400;
      ctx.body = {
        status: 400,
        message: 'Bad Request',
        error: 'Database query failed'
      };
    }
  } else {
    ctx.status = 404;
    ctx.body = { status: 404, message: 'Not Found' };
  }

  return true;
});

app.listen(3000, () => {
  db.sequelize.sync();
});
