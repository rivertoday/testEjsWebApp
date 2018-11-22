var request = require("request");
var express = require('express');
var myconst = require("./const");
var router = express.Router();


/* GET login result. */
router.post('/login', function (req, res, next) {
    console.log(">>>myconst: "+myconst.apiurl);
    var url = myconst.apiurl + "o/token/";
    var loginData = {
        "username": req.body.email,
        "password": req.body.pass,
        "grant_type": "password",
        "scope": myconst.scope_users,
        "client_id": myconst.client_id,
        "client_secret": myconst.client_secret
    };
    console.log(">>>Info used for user authentication: " + JSON.stringify(loginData));
    request.post({url: url, form: loginData}, function (error, response, body) {
        console.log(">>>Authentication results: " + body);
        if (!error && response.statusCode == 200) {
            var obj = JSON.parse(body); //由JSON字符串转换为JSON对象
            // 请求成功的处理逻辑
            // 登陆成功后将token写入Cookie，maxAge为cookie过期时间
            res.cookie("usertoken", {
                "access_token": obj.access_token,
                "refresh_token": obj.refresh_token,
                "scope": obj.scope,
                "expires_in": obj.expires_in
            }, {maxAge: 1000 * 60 * 60 * 4, httpOnly: true});//cookie 4小时有效时间

            res.cookie("userinfo", {
                "email": req.body.email,
                "password": req.body.pass
            }, {maxAge: 1000 * 60 * 60 * 4, httpOnly: true});//cookie 4小时有效时间
            //以上设置的两个cookie未来都需要以base64进行编码以防泄密

            // 返回成功代码，转到项目列表页面
            res.json({status:1, msg:"登录成功"});
            //res.render("home", {title: 'Chinese Clinical Investigation Center', prjs: 'empty'});
        }
        else {
            var err = JSON.parse(body); //由JSON字符串转换为JSON对象
            /*res.render("error", {
                message: 'Sorry, you provided wrong login information!',
                error: err.error_description
            });*/
            res.json({status:0, msg:err.error_description});
        }
    });
});

module.exports = router;
