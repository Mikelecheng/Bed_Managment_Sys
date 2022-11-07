const router = require('koa-router')()

router.get('/', async (ctx, next) => {
  await ctx.render('index', {
    title: 'Login'
  })
})
router.get('/dashboard', async (ctx, next) => {
  await ctx.render('dashboard', {
    title: 'dashboard'
  })
})

module.exports = router
