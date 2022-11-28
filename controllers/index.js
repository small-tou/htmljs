// Generated by CoffeeScript 1.9.3
(function () {
  var RSS,
    Sina,
    UPYun,
    authorize,
    config,
    fs,
    func_article,
    func_card,
    func_column,
    func_index,
    func_info,
    func_rss_email,
    func_search,
    func_user,
    md5,
    moment,
    path,
    request,
    searchStatic,
    sina;
  const DMsg = require("dd-msg");
  const robot = new DMsg(
    "6f01b464830cdd3ab27edad823c49809e428594db23aa67dab5b841b448d0b65"
  );
  var AipSpeechClient = require("baidu-aip-sdk").speech;

  // 设置APPID/AK/SK
  var APP_ID = "23575457";
  var API_KEY = "dMT5uL09AkkNLL4nFMVuGWHU";
  var SECRET_KEY = "rVGkViSmNpidgCq7CCBnzasIWiLwZ9Aw";

  // 新建一个对象，建议只保存一个对象调用服务接口
  var client = new AipSpeechClient(APP_ID, API_KEY, SECRET_KEY);
  func_user = __F("user");

  func_card = __F("card");

  func_article = __F("article/article");

  func_info = __F("info");

  func_index = __F("index");

  func_column = __F("column");

  func_rss_email = __F("rss_email");

  config = require("./../config.coffee");

  func_search = __F("search");

  authorize = require("./../lib/sdk/authorize.js");

  Sina = require("./../lib/sdk/sina.js");

  RSS = require("rss");

  sina = new Sina(config.sdks.sina);

  moment = require("moment");

  path = require("path");

  fs = require("fs");

  request = require("request");

  UPYun = require("upyun");

  fs = require("fs");

  esp8266 = require("./esp8266.json");
  searchStatic = {};

  md5 = function (string) {
    var crypto, md5sum;
    crypto = require("crypto");
    md5sum = crypto.createHash("md5");
    md5sum.update(string, "utf8");
    return md5sum.digest("hex");
  };

  module.exports.controllers = {
    "/": {
      get: function (req, res, next) {
        return res.render("article/articles.jade");
      },
    },
    "/esp8266": {
      get: function (req, res, next) {
        var data = esp8266[req.query.chipid] || {};
        data.initModeCool = true;
        data.initTemp = 24;
        return res.send(data);
      },
    },
    "/index/:id/update": {
      get: function (req, res, next) {
        return func_index.update(req.params.id, req.query, function (error) {
          return res.redirect("/");
        });
      },
    },
    "/rss.xml": {
      get: function (req, res, next) {
        var feed;
        feed = new RSS({
          title: "前端乱炖，前端人才资源学习资源集散地",
          description: "前端乱炖，前端人才资源学习资源集散地",
          feed_url: "http://www.html-js.com/rss.xml",
          site_url: "http://www.html-js.com",
          image_url: "http://www.html-js.com/icon.png",
          author: "芋头",
        });
        return func_article.getAll(
          1,
          20,
          {
            is_yuanchuang: 1,
          },
          "id desc",
          function (error, articles) {
            if (error) {
              return next(error);
            } else {
              articles.forEach(function (article) {
                return feed.item({
                  title: article.title,
                  description: article.html,
                  url: "http://www.html-js.com/article/" + article.id,
                  author: article.user_nick,
                  date: article.publish_time * 1000,
                });
              });
              return res.end(feed.xml());
            }
          }
        );
      },
    },
    "/articles": {
      get: function (req, res, next) {},
    },
    "/article/add": {
      get: function (req, res, next) {
        return res.render("add-article.jade");
      },
    },
    "/nft": {
      get: function (req, res, next) {
        // if (!res.locals.card) {
        //   next(new Error("暂时找不到您的花名册信息！"));
        //   return;
        // }
        return res.render("nft.jade");
      },
    },
    "/cards": {
      get: function (req, res, next) {
        var condition;
        res.locals.md5 = md5;
        res.locals.login = authorize.sina({
          app_key: config.sdks.sina.app_key,
          redirect_uri: config.sdks.sina.redirect_uri,
        });
        condition = null;
        if (req.query.q) {
          condition = condition || {};
          condition =
            "cards.name like '%" +
            req.query.q +
            "%' or cards.nick like '%" +
            req.query.q +
            "%'";
          res.locals.q = req.query.q;
        }
        if (req.query.filter) {
          condition = condition || {};
          req.query.filter.split(":").forEach(function (f) {
            var kv;
            kv = f.split("|");
            if (kv.length) {
              condition[kv[0]] = kv[1];
              return (res.locals["filter_" + kv[0]] = kv[1]);
            }
          });
        }
        return func_card.count(condition, function (error, count) {
          if (error) {
            return next(error);
          } else {
            res.locals.total = count;
            res.locals.totalPage = Math.ceil(count / 40);
            res.locals.page = req.query.page || 1;
            return func_card.getAll(
              res.locals.page,
              40,
              condition,
              function (error, cards) {
                if (error) {
                  return next(error);
                } else {
                  res.locals.cards = cards;
                  return res.render("card/cards.jade");
                }
              }
            );
          }
        });
      },
    },
    "/add-card": {
      get: function (req, res, next) {
        if (res.locals.card) {
          res.redirect("/edit-card");
          return;
        }
        if (res.locals.user) {
          return sina.users.show(
            {
              access_token: res.locals.user.weibo_token,
              uid: res.locals.user.weibo_id,
              method: "get",
            },
            function (error, data) {
              if (!error) {
                res.locals.weibo_info = data;
                return res.render("card/add-card.jade");
              }
            }
          );
        } else {
          return res.render("card/add-card.jade");
        }
      },
      post: function (req, res, next) {
        if (res.locals.user.card_id) {
          next(new Error("您已经拥有一个名片！"));
          return;
        }
        return func_card.add(req.body, function (error, card) {
          if (error) {
            return next(error);
          } else {
            func_index.add(card.uuid);
            __F("coin").add(40, res.locals.user.id, "创建了名片");
            func_user.connectCard(
              res.locals.user.id,
              card.id,
              function (error) {
                if (error) {
                  return next(error);
                } else {
                  return res.redirect("/user");
                }
              }
            );
            func_user.update(
              res.locals.user.id,
              {
                email: card.email,
              },
              function () {}
            );
            func_search.add(
              {
                type: "card",
                pid: card.uuid,
                title: card.nick + "的花名册",
                html: card.nick + "的花名册 简介：" + card.desc,
                udid: card.uuid,
                id: card.id,
              },
              function () {}
            );
            return __F("create_thumbnail").create_card(card.id, function () {
              return sina.statuses.upload({
                access_token: res.locals.user.weibo_token,
                pic: path.join(
                  __dirname,
                  "../uploads/article_thumb/card-" + card.id + ".png"
                ),
                status:
                  "我在@前端乱炖 的《前端花名册》添加了我的名片，欢迎收藏：http://www.html-js.com/user/" +
                  res.locals.user.id +
                  " ",
              });
            });
          }
        });
      },
    },
    "/edit-card": {
      get: function (req, res, next) {
        if (!res.locals.card) {
          return res.redirect("/add-card");
        } else {
          return res.render("card/edit-card.jade");
        }
      },
      post: function (req, res, next) {
        return func_card.update(req.body.id, req.body, function (error, card) {
          if (error) {
            return next(error);
          } else {
            func_user.update(
              card.user_id,
              {
                nick: card.nick,
                sex: card.sex,
                desc: card.desc,
                email: card.email,
              },
              function (error) {
                if (error) {
                  return console.log(error);
                }
              }
            );
            return res.redirect("/user");
          }
        });
      },
    },
    "/card/:id": {
      get: function (req, res, next) {
        if (req.query && req.query.is_clear) {
          res.render("user/p-clear.jade");
        }
        return func_card.getVisitors(req.params.id, function (error, visitors) {
          if (error) {
            return next(error);
          } else {
            res.locals.visitors = visitors;
            func_card.addVisit(req.params.id, res.locals.user || null);
            if (
              res.locals.card.user_id &&
              res.locals.user &&
              res.locals.card.user_id !== res.locals.user.id
            ) {
              func_info.add(
                {
                  target_user_id: res.locals.card.user_id,
                  type: 1,
                  source_user_id: res.locals.user.id,
                  source_user_nick: res.locals.user.nick,
                  time: new Date(),
                  target_path: req.originalUrl,
                  action_name: "【访问】了您的名片",
                  target_path_name: res.locals.card.nick + "的名片",
                },
                function () {
                  return console.log("success");
                }
              );
              return res.render("user/p.jade");
            } else {
              return res.render("user/p.jade");
            }
          }
        });
      },
    },
    "/card/:id/zan": {
      post: function (req, res, next) {
        var result;
        result = {
          success: 1,
        };
        return func_card.addZan(
          req.params.id,
          res.locals.user.id,
          function (error, card) {
            if (error) {
              result.info = error.message;
              result.success = 0;
            } else {
              if (card.user_id) {
                func_info.add({
                  target_user_id: card.user_id,
                  type: 4,
                  source_user_id: res.locals.user.id,
                  source_user_nick: res.locals.user.nick,
                  time: new Date(),
                  target_path: "/card/" + req.params.id,
                  action_name: "【赞】了您的名片",
                  target_path_name: card.nick + "的名片",
                });
              }
              result.zan_count = card.zan_count;
            }
            return res.send(result);
          }
        );
      },
    },
    "/card/:id/kai": {
      post: function (req, res, next) {
        var result;
        result = {
          success: 1,
        };
        return func_card.getById(req.params.id, function (error, card) {
          if (error) {
            result.info = error.message;
            result.success = 0;
          } else {
            if (card.user_id) {
              func_info.add({
                target_user_id: card.user_id,
                type: 11,
                source_user_id: res.locals.user.id,
                source_user_nick: res.locals.user.nick,
                time: new Date(),
                target_path: "/article/column/add",
                action_name: "【希望】您开通技术专栏分享经验和技术知识",
                target_path_name: "点击这里开通专栏",
              });
            }
          }
          return res.send(result);
        });
      },
    },
    "/upload": {
      post: function (req, res, next) {
        var pack, pack_name, result, sourcePath, targetPath;
        result = {
          success: 0,
          info: "",
        };
        console.log(req.files);
        pack = req.files["pic"];
        if (pack) {
          sourcePath = pack.path;
          pack_name =
            new Date().getTime() +
            "-" +
            md5(pack.name) +
            path.extname(pack.name);
          targetPath = config.upload_path + pack_name;
          return fs.rename(sourcePath, targetPath, function (err) {
            var fileContent, md5Str, upyun;
            upyun = new UPYun(
              config.upyun_bucketname,
              config.upyun_username,
              config.upyun_password,
              "ctcc",
              "legacy"
            );
            fileContent = fs.readFileSync(targetPath);
            // md5Str = md5(fileContent);
            // upyun.setContentMD5(md5Str);
            // upyun.setFileSecret('bac');
            return upyun.uploadFile(
              "/uploads/" + pack_name,
              fileContent,
              "",
              false,
              function (error, data) {
                console.log(error, data);
                if (error) {
                  result.info = error.message;
                  res.send(result);
                  return;
                } else {
                  result.success = 1;
                  result.data = {
                    filename: "https://assets.html-js.com/uploads/" + pack_name,
                  };
                }
                return res.send(result);
              }
            );
          });
        } else {
          result.info = "错误的图片文件";
          return res.send(result);
        }
      },
    },
    "/speech": {
      post: function (req, res, next) {
        var result = {
          success: 0,
          info: "",
        };
        console.log(req.files);
        pack = req.files["pic"];
        if (pack) {
          sourcePath = pack.path;
          let voice = fs.readFileSync(sourcePath);

          let voiceBuffer = new Buffer(voice);
          // 识别本地文件
          client
            .recognize(voiceBuffer, "wav", 16000)
            .then(function (result) {
              console.log("<recognize>: " + JSON.stringify(result));
              result.data = JSON.stringify(result);
              result.success = true;
              res
                .header("Access-Control-Allow-Credentials", true)
                .header("Access-Control-Allow-Origin", "*")
                .header(
                  "Access-Control-Allow-Headers",
                  "x-authorization,DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type"
                )
                .header(
                  "Access-Control-Allow-Methods",
                  "GET,HEAD,PUT,PATCH,POST,DELETE"
                )
                .send(result);
            })
            .catch(function (err) {
              console.log(err);
              res
                .header("Access-Control-Allow-Credentials", true)
                .header("Access-Control-Allow-Origin", "*")
                .header(
                  "Access-Control-Allow-Headers",
                  "x-authorization,DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type"
                )
                .header(
                  "Access-Control-Allow-Methods",
                  "GET,HEAD,PUT,PATCH,POST,DELETE"
                )
                .send(result);
            });
        } else {
          res
            .header("Access-Control-Allow-Credentials", true)
            .header("Access-Control-Allow-Origin", "*")
            .header(
              "Access-Control-Allow-Headers",
              "x-authorization,DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type"
            )
            .header(
              "Access-Control-Allow-Methods",
              "GET,HEAD,PUT,PATCH,POST,DELETE"
            )
            .send(result);
        }
      },
      options: function (req, res) {
        res
          .header("Access-Control-Allow-Credentials", true)
          .header("Access-Control-Allow-Origin", "*");
        res
          .setHeader(
            "Access-Control-Allow-Headers",
            "x-authorization,DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type"
          )
          .header(
            "Access-Control-Allow-Methods",
            "GET,HEAD,PUT,PATCH,POST,DELETE"
          )
          .send();
      },
    },
    "/upload_resume": {
      post: function (req, res, next) {
        var pack, pack_name, result, sourcePath, targetPath;
        result = {
          success: 0,
          info: "",
        };
        pack = req.files["file"];
        if (pack) {
          sourcePath = pack.path;
          pack_name = new Date().getTime() + "-" + pack.name;
          targetPath = config.resume_path + pack_name;
          return fs.rename(sourcePath, targetPath, function (err) {
            var fileContent, md5Str, upyun;
            upyun = new UPYun(
              config.upyun_bucketname,
              config.upyun_username,
              config.upyun_password
            );
            fileContent = fs.readFileSync(targetPath);
            md5Str = md5(fileContent);
            upyun.setContentMD5(md5Str);
            upyun.setFileSecret("bac");
            return upyun.writeFile(
              "/uploads/" + pack_name,
              fileContent,
              false,
              function (error, data) {
                if (error) {
                  result.info = error.message;
                  res.send(result);
                  return;
                } else {
                  result.success = 1;
                  result.data = {
                    filename:
                      "http://htmljs.b0.upaiyun.com/uploads/" + pack_name,
                  };
                }
                return res.send(result);
              }
            );
          });
        } else {
          result.info = "错误的图片文件";
          return res.send(result);
        }
      },
    },
    "/online_to_local": {
      post: function (req, res, next) {
        var pack, pack_name, result, targetPath;
        result = {
          success: 0,
          info: "",
        };
        pack = req.body.url;
        pack_name = new Date().getTime() + "-" + md5(req.body.url);
        targetPath = config.upload_path + pack_name;
        return request(req.body.url, function (e, r, body) {
          if (e) {
            result.info = e.message;
            return res.send(result);
          } else {
            return setTimeout(function () {
              var fileContent, md5Str, upyun;
              upyun = new UPYun(
                config.upyun_bucketname,
                config.upyun_username,
                config.upyun_password
              );
              fileContent = fs.readFileSync(targetPath);
              md5Str = md5(fileContent);
              upyun.setContentMD5(md5Str);
              upyun.setFileSecret("bac");
              return upyun.writeFile(
                "/uploads/" + pack_name,
                fileContent,
                false,
                function (error, data) {
                  if (error) {
                    result.info = error.message;
                    res.send(result);
                    return;
                  } else {
                    result.success = 1;
                    result.data = {
                      filename:
                        "http://htmljs.b0.upaiyun.com/uploads/" + pack_name,
                    };
                  }
                  return res.send(result);
                }
              );
            }, 2000);
          }
        }).pipe(fs.createWriteStream(targetPath));
      },
    },
    "/ad": {
      get: function (req, res, next) {
        return res.render("ad.jade");
      },
    },
    /**
    "/search-his": {
      "get": function(req, res, next) {
        return func_search.count(null, function(error, count) {
          res.locals.total = count;
          res.locals.totalPage = Math.ceil(count / 500);
          res.locals.page = req.query.page || 1;
          return func_search.getAll(req.query.page || 1, 500, null, 'updatedAt desc', function(error, recent) {
            res.locals.recent_words = recent;
            return res.render('search_his.jade');
          });
        });
      }
    },
    "/search": {
      "get": function(req, res, next) {
        var e, nowtime;
        if (!req.query.q) {
          res.render('search.jade');
          return;
        }
        nowtime = new Date().getTime();
        try {
          if (searchStatic[req.originalUrl] && (nowtime - searchStatic[req.originalUrl] < 1000 * 60 * 60 * 24 * 10)) {
            console.log('read from static');
            res.set('Content-Type', 'text/html');
            res.send(fs.readFileSync('./static/' + encodeURIComponent(req.originalUrl) + ".html"));
            return;
          }
        } catch (_error) {
          e = _error;
        }
        res.locals.q = req.query.q;
        return func_search.query({
          "query": req.query.q,
          "limit": 10,
          "offset": ((req.query.page || 1) - 1) * 10
        }, function(error, data) {
          if (error) {
            return next(error);
          } else {
            try {
              data = JSON.parse(data);
            } catch (_error) {}
            res.locals.results = data.data;
            res.locals.total = data.total_count;
            res.locals.totalPage = Math.ceil(data.total_count / 10);
            res.locals.page = req.query.page || 1;
            res.locals.relative_words = data.relative;
            return func_search.getAll(1, 20, null, 'count desc', function(error, hot) {
              res.locals.hot_words = hot;
              return func_search.getAll(1, 30, null, 'updatedAt desc', function(error, recent) {
                res.locals.recent_words = recent;
                return res.render('search.jade', null, function(error, html) {
                  try {
                    fs.writeFileSync('./static/' + encodeURIComponent(req.originalUrl) + ".html", html, 'utf-8');
                  } catch (_error) {
                    e = _error;
                  }
                  searchStatic[req.originalUrl] = nowtime;
                  return res.send(html);
                });
              });
            });
          }
        });
      }
    },
**/
    "/google72b29f4df6c0059b.html": {
      get: function (req, res, next) {
        return res.end("google-site-verification: google72b29f4df6c0059b.html");
      },
    },
    "/robots.txt": {
      get: function (req, res, next) {
        return res.end(
          "User-agent: *\n Disallow: /user/login\n Disallow: /talk/\n"
        );
      },
    },
    "/rss/email": {
      post: function (req, res, next) {
        if (
          req.body.email &&
          /^(\w)+(\.\w+)*@(\w)+((\.\w+)+)$/.test(req.body.email)
        ) {
          return func_rss_email.add(
            {
              email: req.body.email,
            },
            function (e) {
              if (!e) {
                return res.send({
                  success: 1,
                });
              } else {
                return res.send({
                  success: 0,
                  info: e.message,
                });
              }
            }
          );
        } else {
          return res.send({
            success: 0,
            info: "提交失败，错误的邮箱格式",
          });
        }
      },
    },
    "/bmwgithook": {
      post: function (req, res) {
        console.log(req.body);
        if (req.body.eventKey == "pr:opened") {
          robot
            .markDown({
              atAll: false,
              title: "新的 pull request",
              mdText: `新的 pull request，请处理
                \n\n发起者：${req.body.actor.displayName}
                \n\n分支：${req.body.pullRequest.fromRef.displayId}
                \n\n内容：\n\n${req.body.pullRequest.description}
                \n\n地址：${req.body.pullRequest.links.self[0].href}`,
            })
            .then((res) => console.log(res));
        } else if (req.body.eventKey == "pr:merged") {
          robot
            .markDown({
              atAll: false,
              title: "pull request 已合并",
              mdText: `pull request 已合并
                \n\n发起者：${req.body.actor.displayName}
                \n\n分支：${req.body.pullRequest.fromRef.displayId}
                \n\n内容：\n\n${req.body.pullRequest.title}
                \n\n地址：${req.body.pullRequest.links.self[0].href}`,
            })
            .then((res) => console.log(res));
        }

        res.send(`新的 pull request，请处理
\n\n发起者：${req.body.actor.displayName}
\n\n分支：${req.body.pullRequest.fromRef.displayId}
\n\n内容：${req.body.pullRequest.description}
\n\n地址：${req.body.pullRequest.links.self[0].href}`);
      },
    },
    "/.well-known/apple-app-site-association": {
      get: function (req, res, next) {
        res.send({
          appclips: {
            apps: ["M78L9G96T2.com.html-js.story.Clip"],
          },
        });
      },
    },
  };

  module.exports.filters = {
    "/article/add": {
      get: ["checkLogin", "checkCard"],
    },
    "/cards": {
      get: ["freshLogin", "checkCard", "card_recent", "card/new-comments"],
    },
    "/card/:id": {
      get: [
        "freshLogin",
        "card/get-card",
        "card/comments",
        "card/zans",
        "card/his-columns",
        "card/his-articles",
        "card/his-question",
        "card/his-topic",
        "card/his-answer",
      ],
    },
    "/add-card": {
      get: ["checkLogin", "checkCard"],
      post: ["checkLogin"],
    },
    "/nft": {
      // get: ["checkLogin", "checkCard"],
    },
    "/edit-card": {
      get: ["checkLogin", "checkCard"],
    },
    "/": {
      get: [
        "freshLogin",
        "get_infos",
        "article/my-columns",
        "article/public-columns",
        "article/all-publish-articles",
        "article/all-notpublish",
        "article/index-columns",
        "tag/tags-obj",
      ],
    },
    "/card/:id/zan": {
      post: ["checkLoginJson"],
    },
    "/card/:id/kai": {
      post: ["checkLoginJson"],
    },
    "/card/:id/bao": {
      post: ["checkLogin", "checkCard"],
    },
    "/search": {
      get: ["freshLogin"],
    },
  };
}.call(this));