$("#login").on('click', function () {
    var userName = $("#userName").val()
    var password = $("#password").val()
    var data = {
      "userName": userName,
      "password": password
    }
    console.log(data)
    $.ajax({
      url: '/login',
      method:'post',
      data: data,
      success: function (res) {
        console.log(res)
        location.href = '/dashboard'
      },
      error: function(err) {
        alert('Login failed')
      }        
    })
})