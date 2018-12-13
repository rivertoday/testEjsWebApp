var request = require("request");
var express = require('express');
var mutipart= require('connect-multiparty');
var fs = require("fs");
var math = require("mathjs");
var url = require("url");

var myconst = require("./const");
var router = express.Router();
var mutipartMiddeware = mutipart();

/* GET prj001 home page. */
router.get('/', function (req, res, next) {
    console.log(">>>Visting prj001 page!");

    //如果cookie里面有prj001的access_token，那么可以直接获取该项目案例
    if (req.cookies.prj001token) {
        //直接发起数据请求，获取prj001项目指定页面的案例
        console.log(">>> req url: " + req.url);
        var params = url.parse(req.url, true).query;
        console.log(">>> req url params: " + params["page"]);
        var workurl = "";
        if (params["page"] == undefined) {
            workurl = myconst.apiurl + "prj001/geninfo/";
        }
        else {
            workurl = myconst.apiurl + "prj001/geninfo/?page=" + params["page"];
        }

        var authstring = req.cookies.prj001token.access_token;
        console.log(">>> prj001 access_token: " + authstring);

        var options = {
            url: workurl,
            headers: {
                'Authorization': 'Bearer ' + authstring
            }
        };

        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var archiveobjs = JSON.parse(body);
                var totalNumber = archiveobjs.count;
                var totalPageNumber = math.ceil(totalNumber/myconst.NUMER_PER_PAGE);
                var curPageNumber = 1;
                if (params["page"] == undefined) {
                    curPageNumber = 1;
                }else {
                    curPageNumber = params["page"];
                }
                var previousPage = "";
                if (archiveobjs.previous) {
                    var iIndex = archiveobjs.previous.search("=");
                    previousPage = archiveobjs.previous.substring(iIndex);
                }
                var nextPage = "";
                if (archiveobjs.next) {
                    var jIndex = archiveobjs.next.search("=");
                    nextPage = archiveobjs.next.substring(jIndex);
                }
                res.render('prj001', {title: '流调项目-排卵障碍性异常子宫出血',
                    archives: archiveobjs.results,
                    totalpagenumber: totalPageNumber,
                    curpage: curPageNumber,
                    previouspage: previousPage,
                    nextpage: nextPage
                });
            }
            else {
                console.log(">>>Getting archives met unknown error. "+err.error_description);
                res.redirect("login");
            }
        });
    }
    //初次访问该页面,cookie里面没有prj001的access_token，
    //那么需要先获取一个scope为prj001的access_token
    else {
        if (req.cookies.userinfo) {
            var workurl = myconst.apiurl + "o/token/";
            var loginData = {
                "username": req.cookies.userinfo.email,
                "password": req.cookies.userinfo.password,
                "grant_type": "password",
                "scope": myconst.scope_prj001,
                "client_id": myconst.client_id,
                "client_secret": myconst.client_secret
            };
            console.log(">>>Info used for prj001 authentication: " + JSON.stringify(loginData));
            request.post({url: workurl, form: loginData}, function (error, response, body) {
                console.log(">>>Authentication results: " + body);
                if (!error && response.statusCode == 200) {
                    var obj = JSON.parse(body); //由JSON字符串转换为JSON对象
                    // 成功后将token写入Cookie，maxAge为cookie过期时间
                    res.cookie("prj001token", {
                        "access_token": obj.access_token,
                        "refresh_token": obj.refresh_token,
                        "scope": obj.scope,
                        "expires_in": obj.expires_in
                    }, {maxAge: 1000 * 60 * 60 * 4, httpOnly: true});//cookie 4小时有效时间

                    //进一步发起数据请求，获取所有prj001项目的案例
                    workurl = myconst.apiurl + "prj001/geninfo/";
                    var authstring = obj.access_token;
                    console.log(">>> prj001 access_token: " + authstring);

                    var options = {
                        url: workurl,
                        headers: {
                            'Authorization': 'Bearer ' + authstring
                        }
                    };

                    request(options, function (error, response, body) {
                        if (!error && response.statusCode == 200) {
                            var archiveobjs = JSON.parse(body);
                            var totalNumber = archiveobjs.count;
                            var totalPageNumber = math.ceil(totalNumber/myconst.NUMER_PER_PAGE);
                            var curPageNumber = 1;
                            var previousPage = "";
                            if (archiveobjs.previous) {
                                var iIndex = archiveobjs.previous.search("=");
                                previousPage = archiveobjs.previous.substring(iIndex);
                            }
                            var nextPage = "";
                            if (archiveobjs.next) {
                                var jIndex = archiveobjs.next.search("=");
                                nextPage = archiveobjs.next.substring(jIndex);
                            }
                            res.render('prj001', {title: '流调项目-排卵障碍性异常子宫出血',
                                archives: archiveobjs.results,
                                totalpagenumber: totalPageNumber,
                                curpage: curPageNumber,
                                previouspage: previousPage,
                                nextpage: nextPage
                            });
                        }
                        else {
                            console.log(">>>Getting archives met unknown error. "+err.error_description);
                            res.redirect("login");
                        }
                    });
                }
                else {
                    console.log(">>>Invoking access token met unknown error. "+err.error_description);
                    res.redirect("login");
                }
            });
        }
        else {
            console.log(">>>Failed to find cookie with user info");
            res.redirect("login");
        }
    }

});

router.post('/file_upload', mutipartMiddeware, function (req, res, next) {
    console.log(req.files);
    /*0|cc       | { image:
            0|cc       |    { fieldName: 'image',
                0|cc       |      originalFilename: '07排卵障碍性异常子宫出血问卷_20181126.xlsx',
    0|cc       |      path: '/tmp/XXnBfHzo8n-ed_xy-bnmulGh.xlsx',
    0|cc       |      headers:
    0|cc       |       { 'content-disposition': 'form-data; name="image"; filename="07排卵障碍性异常子宫出血问卷_20181126.xlsx"',
        0|cc       |         'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    0|cc       |      size: 208063,
    0|cc       |      name: '07排卵障碍性异常子宫出血问卷_20181126.xlsx',
    0|cc       |      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' } }*/

    const formData = {
        // Pass a simple key-value pair
        name: '测试excel文件',
        // Pass data via Streams
        ivfile: fs.createReadStream(req.files.image.path),
        // Pass owner
        owner_id: req.cookies.userid.id
    };
    var authstring = req.cookies.prj001token.access_token;
    var options = {
        url: myconst.apiurl+"prj001/upload/",
        headers: {
            'Authorization': 'Bearer ' + authstring
        },
        formData: formData
    };

    request.post(options, function optionalCallback(err, response, body) {
        if (!err && response.statusCode == 200) {
            console.log('Upload successful!  Server responded with:', body);
            //给浏览器返回一个成功提示。
            res.send('Upload success!');
        }
        else {
            return console.error('upload failed:', err);
            res.send('Upload failed!');
        }
    });

});

module.exports = router;
