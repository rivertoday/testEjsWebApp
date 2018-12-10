var request = require("request");
var express = require('express');
var myconst = require("./const");
var router = express.Router();

/* GET login page. */
router.get('/', function (req, res, next) {
    console.log(">>>Clear all cookies");
    res.clearCookie('userinfo');
    res.clearCookie('usertoken');
    res.clearCookie('prj001token');
    res.render('login', {title: 'Chinese Clinical Investigation Center'});
});

/* GET projects list page. */
router.get('/home', function (req, res, next) {
    console.log(">>>Visting home page!");
    if (req.cookies.usertoken) {
        var url = myconst.apiurl + "users/";
        var authstring = req.cookies.usertoken.access_token;
        var useremail = req.cookies.userinfo.email;
        console.log(">>>user access_token in cookie: " + authstring);

        var options = {
            url: url,
            headers: {
                'Authorization': 'Bearer ' + authstring
            }
        };

        //第一步请求的回调处理
        function callback(error, response, body) {
            if (!error && response.statusCode == 200) {
                var userobjs = JSON.parse(body);
                var userurl = "";

                //从所有用户列表中找到与当前用户email信息匹配的，获取其用户详情的url
                for(var i=0,l=userobjs.count;i<l;i++){
                    /*for(var key in userobjs.results[i]){
                        console.log(key+':'+userobjs.results[i][key]);
                    }*/
                    if (userobjs.results[i]['email'] == useremail ) {
                        console.log(">>>Found the user! " + userobjs.results[i]['url']);
                        userurl = userobjs.results[i]['url'];
                        //回写cookie一个用户id，即owner_id
                        res.cookie("userid", {
                            "id": userobjs.results[i]['id']
                        }, {maxAge: 1000 * 60 * 60 * 4, httpOnly: true});//cookie 4小时有效时间
                        break;
                    }
                }

                //2. 根据用户详情的接口url发起新的请求，获取用户详情，里面包含该用户能访问的项目列表
                var newoptions = {
                    url: userurl,
                    headers: {
                        'Authorization': 'Bearer ' + authstring
                    }
                };
                request(newoptions, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var userobj = JSON.parse(body);
                        res.render('home', {title: '临床流调项目中心', prjs: userobj.myprojects});
                    }
                    else {
                        console.log(">>>Getting user details met unknown error. "+err.error_description);
                        res.redirect("login");
                    }
                });
            }
        }

        //1.发起请求，获取所有用户列表，然后比对cookie里面的email，来确定当前用户的接口访问url
        request(options, callback);
    } else {
        console.log(">>>Failed to find cookie with access token");
        res.redirect("login");
    }

});

module.exports = router;
