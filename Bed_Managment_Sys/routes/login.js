const router = require('koa-router')()

function getLoginInfo(ctx) {
  debugger
  const userName = ctx.request.userName
  console.log(userName)
  if (userName) {
    data = {
      isLogin: true,
      userName: userInfo.userName
    }
  }
  return data
}

router.post('/login', async (ctx, next) => {
  //  debugger
  const { userName, password } = ctx.request.body

  if (ctx.request.body.userName === "user1" && ctx.request.body.password === "user1") {
    console.log(ctx.request.body.userName)
    console.log(ctx.request.body.password)    
    ctx.body = {
      'code': 1,
      'mesg': 'login success'
    }
  }
})


module.exports = router
