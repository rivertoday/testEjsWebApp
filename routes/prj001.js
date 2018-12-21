var request = require("request");
var express = require('express');
var mutipart = require('connect-multiparty');
var fs = require("fs");
var math = require("mathjs");
var url = require("url");

var myconst = require("./const");
var router = express.Router();
var mutipartMiddeware = mutipart();

request.debug = true;

/* GET prj001 home page. */
router.get('/', function (req, res, next) {
    console.log(">>>Visting prj001 page!");

    //如果cookie里面有prj001的access_token，那么可以直接获取该项目案例
    if (req.cookies.prj001token) {
        //直接发起数据请求，获取prj001项目指定页面的案例
        console.log(">>> req url: " + req.url);
        var params = url.parse(req.url, true).query;
        console.log(">>> req url params: " + params["page"] + ", " + params["keyword"]);
        var workurl = "";
        if (params["page"] == undefined) {
            workurl = myconst.apiurl + "prj001/geninfo/";
        }
        else {
            workurl = myconst.apiurl + "prj001/geninfo/?page=" + params["page"];
        }
        if (params["keyword"] == undefined) {
            workurl = workurl;
        } else {
            if (params["page"] == undefined) {
                workurl = workurl + "?search=" + params["keyword"];
            }
            else {
                workurl = workurl + "&search=" + params["keyword"];
            }
        }

        var authstring = req.cookies.prj001token.access_token;
        console.log(">>> current prj001 access_token: " + authstring);
        console.log(">>> current built api url: " + workurl);

        var enurl=encodeURI(workurl);
        var d1url=encodeURI(enurl);

        console.log(">>>d1 encoded api url: " + d1url);

        var options = {
            url: d1url,
            headers: {
                'Authorization': 'Bearer ' + authstring
            }
        };

        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var archiveobjs = JSON.parse(body);
                //var totalNumber = archiveobjs.count;
                var totalPageNumber = archiveobjs.total_pages; //math.ceil(totalNumber/myconst.NUMER_PER_PAGE);
                var curPageNumber = 1;
                if (params["page"] == undefined) {
                    curPageNumber = 1;
                } else {
                    curPageNumber = params["page"];
                    curPageNumber = parseInt(curPageNumber);
                }
                var previousPage = parseInt(curPageNumber) - 1;
                if (previousPage < 1) {
                    previousPage = 1;
                }
                /*if (archiveobjs.previous) {
                    var iIndex = archiveobjs.previous.search("=");
                    previousPage = archiveobjs.previous.substring(iIndex);
                }*/
                var nextPage = parseInt(curPageNumber) + 1;
                if (nextPage > totalPageNumber) {
                    nextPage = totalPageNumber;
                }
                /*if (archiveobjs.next) {
                    var jIndex = archiveobjs.next.search("=");
                    nextPage = archiveobjs.next.substring(jIndex);
                }*/
                var i = 0, len = archiveobjs.results.length;
                for (; i < len; i++) {
                    var tmpobj = archiveobjs.results[i];
                    console.log(">>> current retrieving results: " + tmpobj["name"]);
                }
                var retschname = "";
                if (params["keyword"] == undefined) {
                    retschname = "";
                    res.render('prj001', {
                        title: '流调项目-排卵障碍性异常子宫出血',
                        archives: archiveobjs.results,
                        totalpagenumber: totalPageNumber,
                        curpage: curPageNumber,
                        previouspage: previousPage,
                        nextpage: nextPage,
                        searchname: retschname
                    });
                } else {
                    retschname = params["keyword"];
                    res.render('prj001', {
                        title: '流调项目-排卵障碍性异常子宫出血',
                        archives: archiveobjs.results,
                        totalpagenumber: totalPageNumber,
                        curpage: curPageNumber,
                        previouspage: previousPage,
                        nextpage: nextPage,
                        searchname: retschname
                    });
                }
            }
            else {
                console.log(">>>Getting archives met unknown error. " + error);
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

                    //进一步发起数据请求，获取prj001项目满足搜索和分页条件的案例
                    var params = url.parse(req.url, true).query;
                    console.log(">>> req url params: " + params["page"] + ", " + params["keyword"]);
                    var workurl = "";
                    if (params["page"] == undefined) {
                        workurl = myconst.apiurl + "prj001/geninfo/";
                    }
                    else {
                        workurl = myconst.apiurl + "prj001/geninfo/?page=" + params["page"];
                    }
                    if (params["keyword"] == undefined) {
                        workurl = workurl;
                    } else {
                        if (params["page"] == undefined) {
                            workurl = workurl + "?search=" + params["keyword"];
                        }
                        else {
                            workurl = workurl + "&search=" + params["keyword"];
                        }
                    }
                    var authstring = obj.access_token;
                    console.log(">>> prj001 access_token: " + authstring);
                    console.log(">>> current built api url: " + workurl);

                    var enurl=encodeURI(workurl);
                    var d2url=encodeURI(enurl);

                    console.log(">>>d2 encoded api url: " + d2url);

                    var options = {
                        url: d2url,
                        headers: {
                            'Authorization': 'Bearer ' + authstring
                        }
                    };

                    request(options, function (err, response, body) {
                        if (!error && response.statusCode == 200) {
                            var archiveobjs = JSON.parse(body);
                            //var totalNumber = archiveobjs.count;
                            var totalPageNumber = archiveobjs.total_pages; //math.ceil(totalNumber/myconst.NUMER_PER_PAGE);
                            var curPageNumber = 1;
                            if (params["page"] == undefined) {
                                curPageNumber = 1;
                            } else {
                                curPageNumber = params["page"];
                                curPageNumber = parseInt(curPageNumber);
                            }
                            var previousPage = parseInt(curPageNumber) - 1;
                            if (previousPage < 1) {
                                previousPage = 1;
                            }
                            /*if (archiveobjs.previous) {
                                var iIndex = archiveobjs.previous.search("=");
                                previousPage = archiveobjs.previous.substring(iIndex);
                            }*/
                            var nextPage = parseInt(curPageNumber) + 1;
                            if (nextPage > totalPageNumber) {
                                nextPage = totalPageNumber;
                            }
                            /*if (archiveobjs.next) {
                                var jIndex = archiveobjs.next.search("=");
                                nextPage = archiveobjs.next.substring(jIndex);
                            }*/
                            var i = 0, len = archiveobjs.results.length;
                            for (; i < len; i++) {
                                var tmpobj = archiveobjs.results[i];
                                console.log(">>> retrieving results: " + tmpobj["name"]);
                            }
                            var retschname = "";
                            if (params["keyword"] == undefined) {
                                retschname = "";
                                res.render('prj001', {
                                    title: '流调项目-排卵障碍性异常子宫出血',
                                    archives: archiveobjs.results,
                                    totalpagenumber: totalPageNumber,
                                    curpage: curPageNumber,
                                    previouspage: previousPage,
                                    nextpage: nextPage,
                                    searchname: retschname
                                });
                            } else {
                                retschname = params["keyword"];
                                res.render('prj001', {
                                    title: '流调项目-排卵障碍性异常子宫出血',
                                    archives: archiveobjs.results,
                                    totalpagenumber: totalPageNumber,
                                    curpage: curPageNumber,
                                    previouspage: previousPage,
                                    nextpage: nextPage,
                                    searchname: retschname
                                });
                            }
                        }
                        else {
                            console.log(">>>Getting archives met unknown error. " + err);
                            res.redirect("login");
                        }
                    });
                }
                else {
                    console.log(">>>Invoking access token met unknown error. " + error);
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

/* Process search request by ajax. */
/* This function has been deprecated*/
router.post('/search', function (req, res, next) {
    console.log(">>>Processing search request!");

    //如果cookie里面有prj001的access_token，那么可以直接获取该项目案例
    if (req.cookies.prj001token) {
        //直接发起数据请求，获取prj001项目指定页面的案例
        var keyword = req.body.keyword;
        var page = req.body.page;
        console.log(">>> req body params: " + page + ", " + keyword);
        var workurl = "";
        if (page == null) {
            workurl = myconst.apiurl + "prj001/geninfo/";
        }
        else {
            workurl = myconst.apiurl + "prj001/geninfo/?page=" + page;
        }
        if (keyword == null) {
            workurl = workurl;
        } else {
            if (page == null) {
                workurl = workurl + "?search=" + keyword;
            }
            else {
                workurl = workurl + "&search=" + keyword;
            }
        }

        var authstring = req.cookies.prj001token.access_token;
        console.log(">>> current prj001 access_token: " + authstring);
        console.log(">>> current built api url: " + workurl);

        var enurl=encodeURI(workurl);
        var s1url=encodeURI(enurl);

        console.log(">>>s1 encoded api url: " + s1url);

        var s1options = {
            url: s1url,
            headers: {
                'Authorization': 'Bearer ' + authstring
            }
        };

        request(s1options, function (error, response, searchbody) {
            console.log(">>> 我靠，看看怎么回事1: " + searchbody);
            if (!error && response.statusCode == 200) {
                var archiveobjs = JSON.parse(searchbody);
                //var totalNumber = archiveobjs.count;
                var totalPageNumber = archiveobjs.total_pages; //math.ceil(totalNumber/myconst.NUMER_PER_PAGE);
                var curPageNumber = 1;
                if (page == null) {
                    curPageNumber = 1;
                } else {
                    curPageNumber = page;
                    curPageNumber = parseInt(curPageNumber);
                }
                var previousPage = parseInt(curPageNumber) - 1;
                if (previousPage < 1) {
                    previousPage = 1;
                }
                /*if (archiveobjs.previous) {
                    var iIndex = archiveobjs.previous.search("=");
                    previousPage = archiveobjs.previous.substring(iIndex);
                }*/
                var nextPage = parseInt(curPageNumber) + 1;
                if (nextPage > totalPageNumber) {
                    nextPage = totalPageNumber;
                }
                /*if (archiveobjs.next) {
                    var jIndex = archiveobjs.next.search("=");
                    nextPage = archiveobjs.next.substring(jIndex);
                }*/
                var i = 0, len = archiveobjs.results.length;
                for (; i < len; i++) {
                    var tmpobj = archiveobjs.results[i];
                    console.log(">>> search1 retrieving results: " + tmpobj["name"]);
                }
                var retschname = keyword;

                res.json({
                    title: '流调项目-排卵障碍性异常子宫出血',
                    archives: archiveobjs.results,
                    totalpagenumber: totalPageNumber,
                    curpage: curPageNumber,
                    previouspage: previousPage,
                    nextpage: nextPage,
                    searchname: retschname
                });
            }
            else {
                console.log(">>>Getting archives met unknown error. " + err.error_description);
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

                    //进一步发起数据请求，获取prj001项目满足搜索和分页条件的案例
                    var keyword = req.body.keyword;
                    var page = req.body.page;
                    console.log(">>> req body params: " + page + ", " + keyword);
                    var workurl = "";
                    if (page == null) {
                        workurl = myconst.apiurl + "prj001/geninfo/";
                    }
                    else {
                        workurl = myconst.apiurl + "prj001/geninfo/?page=" + page;
                    }
                    if (keyword == null) {
                        workurl = workurl;
                    } else {
                        if (page == null) {
                            workurl = workurl + "?search=" + keyword;
                        }
                        else {
                            workurl = workurl + "&search=" + keyword;
                        }
                    }
                    var authstring = obj.access_token;
                    console.log(">>> prj001 access_token: " + authstring);
                    console.log(">>> current built api url: " + workurl);

                    var enurl=encodeURI(workurl);
                    var s2url=encodeURI(enurl);

                    console.log(">>>s2 encoded api url: " + s2url);

                    var s2options = {
                        url: s2url,
                        headers: {
                            'Authorization': 'Bearer ' + authstring
                        }
                    };

                    request(s2options, function (error, response, searchbody) {
                        console.log(">>> 我靠，看看怎么回事2: " + searchbody);
                        if (!error && response.statusCode == 200) {
                            var archiveobjs = JSON.parse(searchbody);
                            //var totalNumber = archiveobjs.count;
                            var totalPageNumber = archiveobjs.total_pages; //math.ceil(totalNumber/myconst.NUMER_PER_PAGE);
                            var curPageNumber = 1;
                            if (page == null) {
                                curPageNumber = 1;
                            } else {
                                curPageNumber = page;
                                curPageNumber = parseInt(curPageNumber);
                            }
                            var previousPage = parseInt(curPageNumber) - 1;
                            if (previousPage < 1) {
                                previousPage = 1;
                            }
                            /*if (archiveobjs.previous) {
                                var iIndex = archiveobjs.previous.search("=");
                                previousPage = archiveobjs.previous.substring(iIndex);
                            }*/
                            var nextPage = parseInt(curPageNumber) + 1;
                            if (nextPage > totalPageNumber) {
                                nextPage = totalPageNumber;
                            }
                            /*if (archiveobjs.next) {
                                var jIndex = archiveobjs.next.search("=");
                                nextPage = archiveobjs.next.substring(jIndex);
                            }*/
                            var i = 0, len = archiveobjs.results.length;
                            for (; i < len; i++) {
                                var tmpobj = archiveobjs.results[i];
                                console.log(">>> search2 retrieving results: " + tmpobj["name"]);
                            }
                            var retschname = keyword;
                            res.json({
                                title: '流调项目-排卵障碍性异常子宫出血',
                                archives: archiveobjs.results,
                                totalpagenumber: totalPageNumber,
                                curpage: curPageNumber,
                                previouspage: previousPage,
                                nextpage: nextPage,
                                searchname: retschname
                            });
                        }
                        else {
                            console.log(">>>Getting archives met unknown error. " + err.error_description);
                            res.redirect("login");
                        }
                    });
                }
                else {
                    console.log(">>>Invoking access token met unknown error. " + err.error_description);
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

//for ajax request
router.post('/geninfo', function (req, res, next) {
    //如果cookie里面有prj001的access_token，那么可以直接获取该项目案例
    if (req.cookies.prj001token) {
        //直接发起数据请求，获取prj001项目指定页面的案例
        var workurl = req.body.geninfourl;
        var authstring = req.cookies.prj001token.access_token;
        console.log(">>> current prj001 access_token: " + authstring);
        console.log(">>> current api url: " + workurl);

        var options = {
            url: workurl,
            headers: {
                'Authorization': 'Bearer ' + authstring
            }
        };

        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                res.json(body);
            }
            else {
                console.log(">>>Getting geninfo details met unknown error. " + err.error_description);
                res.json({error: unknown});
            }
        });
    }
    //如果cookie里面没有prj001的access_token，那么应该是过期了，需要重新登录
    else {
        console.log(">>>Failed to find cookie with prj001 info");
        res.redirect("login");
    }
});

//for ajax request
router.post('/geninfo_save', function (req, res, next) {
    //如果cookie里面有prj001的access_token，那么可以直接获取该项目案例
    if (req.cookies.prj001token) {
        //直接发起数据请求，获取prj001项目指定页面的案例
        var workurl = req.body.genurl;
        var authstring = req.cookies.prj001token.access_token;
        console.log(">>> current prj001 access_token: " + authstring);
        console.log(">>> current api url: " + workurl);

        //此处应该有对用户提交上来的数据的错误分析
        if (true) {

        }

        var patchobj = {
            //"name": req.body.patname,
            "age": req.body.age
        }
        var patchstring = JSON.stringify(patchobj);
        console.log(">>> stringify result: " + patchstring);

        var options = {
            url: workurl,
            headers: {
                'Authorization': 'Bearer ' + authstring,
                'content-type': 'application/json'
            },
            body: patchstring
        };

        request.patch(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                res.json({status:1, result: body});
            }
            else {
                console.log(">>>Getting geninfo details met unknown error. " + error);
                res.json({status:0, result: error});
            }
        });
    }
    //如果cookie里面没有prj001的access_token，那么应该是过期了，需要重新登录
    else {
        console.log(">>>Failed to find cookie with prj001 info");
        res.redirect("login");
    }

});

//for ajax request
router.post('/mensinfo', function (req, res, next) {
    //如果cookie里面有prj001的access_token，那么可以直接获取该项目案例
    if (req.cookies.prj001token) {
        //直接发起数据请求，获取prj001项目指定页面的案例
        var workurl = req.body.mensinfourl;
        var authstring = req.cookies.prj001token.access_token;
        console.log(">>> current prj001 access_token: " + authstring);
        console.log(">>> current api url: " + workurl);

        var options = {
            url: workurl,
            headers: {
                'Authorization': 'Bearer ' + authstring
            }
        };

        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                res.json(body);
            }
            else {
                console.log(">>>Getting geninfo details met unknown error. " + err.error_description);
                res.json({error: unknown});
            }
        });
    }
    //如果cookie里面没有prj001的access_token，那么应该是过期了，需要重新登录
    else {
        console.log(">>>Failed to find cookie with prj001 info");
        res.redirect("login");
    }
});

//for ajax request
router.post('/mensinfo_save', function (req, res, next) {
    //如果cookie里面有prj001的access_token，那么可以直接获取该项目案例
    if (req.cookies.prj001token) {
        //直接发起数据请求，获取prj001项目指定页面的案例
        var workurl = req.body.mensurl;
        var authstring = req.cookies.prj001token.access_token;
        console.log(">>> current prj001 access_token: " + authstring);
        console.log(">>> current api url: " + workurl);

        //此处应该有对用户提交上来的数据的错误分析
        if (true) {

        }

        var patchobj = {
            "first_time": req.body.first_time
        }
        var patchstring = JSON.stringify(patchobj);
        console.log(">>> stringify result: " + patchstring);

        var options = {
            url: workurl,
            headers: {
                'Authorization': 'Bearer ' + authstring,
                'content-type': 'application/json'
            },
            body: patchstring
        };

        request.patch(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                res.json({status:1, result: body});
            }
            else {
                console.log(">>>Getting geninfo details met unknown error. " + error);
                res.json({status:0, result: error});
            }
        });
    }
    //如果cookie里面没有prj001的access_token，那么应该是过期了，需要重新登录
    else {
        console.log(">>>Failed to find cookie with prj001 info");
        res.redirect("login");
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
        url: myconst.apiurl + "prj001/upload/",
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
