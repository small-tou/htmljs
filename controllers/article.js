// Generated by CoffeeScript 1.9.3
(function() {
  var RSS, Sina, authorize, config, func_article, func_bi, func_card, func_column, func_comment, func_count, func_email, func_info, func_payment, func_search, func_user, md5, moment, pagedown, path, request, safeConverter, sina;

  func_user = __F('user');

  func_article = __F('article/article');

  func_info = __F('info');

  func_column = __F('column');

  func_card = __F('card');

  func_bi = __F('bi');

  func_email = __F('email');

  func_search = __F('search');

  func_comment = __F('comment');

  func_payment = __F('payment');

  func_count = __F('user/count');

  moment = require('moment');

  config = require('./../config.coffee');

  authorize = require("./../lib/sdk/authorize.js");

  md5 = require('MD5');

  Sina = require("./../lib/sdk/sina.js");

  sina = new Sina(config.sdks.sina);

  pagedown = require("pagedown-htmljs");

  safeConverter = new pagedown.Converter();

  pagedown.Extra.init(safeConverter);


  path = require('path');

  request = require('request');

  RSS = require('rss');

  // setInterval(function() {
  //   return func_article.run_sort();
  // }, 1000 * 60 * 10);
  module.exports.controllers = {
    "/": {
      "get": function(req, res, next) {
        return res.render('article/articles.jade');
      }
    },
    "/email":{
      get:function(req,res){
        func_article.getAll(1,20,['articles.createdAt > ?',(moment(new Date().getTime() - 1000*60*60*24*7).format("YYYY-MM-DD"))],"static_score desc",function(err,weekly_articles){
            res.locals.weekly_articles = weekly_articles;
            func_article.getAll(1,20,['articles.createdAt > ?',(moment(new Date().getTime() - 1000*60*60*24*30).format("YYYY-MM-DD"))],"static_score desc",function(err,month_articles){
                res.locals.month_articles = month_articles;
                func_article.getAll(1,20,['articles.createdAt > ?',(moment(new Date().getTime() - 1000*60*60*24*30*12).format("YYYY-MM-DD"))],"static_score desc",function(err,year_articles){
                    res.locals.year_articles = year_articles;
                    res.render('email_tpl.jade');
                })
            })
        })

      }
    },
    "/rss|/rss.xml": {
      "get": function(req, res, next) {
        var feed;
        feed = new RSS({
          title: "前端乱炖，前端人才资源学习资源集散地",
          description: "前端乱炖，前端人才资源学习资源集散地",
          feed_url: 'http://www.html-js.com/rss.xml',
          site_url: 'http://www.html-js.com',
          image_url: 'http://www.html-js.com/icon.png',
          author: "前端乱炖"
        });
        return func_article.getAll(1, 20, {
          is_yuanchuang: 1
        }, "id desc", function(error, articles) {
          if (error) {
            return next(error);
          } else {
            articles.forEach(function(article) {
              return feed.item({
                title: article.title,
                description: article.html,
                url: 'http://www.html-js.com/article/' + article.id,
                author: article.user_nick,
                date: article.publish_time * 1000
              });
            });
            return res.end(feed.xml());
          }
        });
      }
    },
    ".json": {
      "get": function(req, res, next) {
        var condition, result;
        condition = {
          is_yuanchuang: 1
        };
        result = {
          success: 0,
          data: {}
        };
        var size = req.query.size||20;
        return func_article.count(condition, function(error, count) {
          if (error) {
            return result.info = error.message;
          } else {
            result.data.total = count;
            result.data.totalPage = Math.ceil(count / size);
            result.data.page = req.query.page || 1;
            return func_article.getAllWithContent(result.data.page, size, condition, function(error, articles) {
              if (error) {
                result.info = error.message;
              } else {
                result.success = 1;
                articles.forEach(function(article) {
                  article.publish_time = moment(article.publish_time*1000).fromNow();
                  if(article.tags){
                    var arr = [];
                    article.tags.split(",").forEach(function(tag_id){
                        var tag = res.locals.ts[tag_id]
                        if(tag){
                          arr.push(tag.name)
                        }
                    })
                    article.tags = arr.join(",")
                  }
                  return article.html = article.html.replace(/<[^>]*?>/g, '').replace(/\s/g, '').substr(0, 100);

                });
                result.data.articles = articles;
              }
              return res.send(result);
            });
          }
        });
      }
    },
    "/old": {
      "get": function(req, res, next) {
        var condition;
        condition = {
          is_yuanchuang: 1,
          column_id: null
        };
        return func_article.count(condition, function(error, count) {
          if (error) {
            return next(error);
          } else {
            res.locals.total = count;
            res.locals.totalPage = Math.ceil(count / 20);
            res.locals.page = req.query.page || 1;
            return func_article.getAll(res.locals.page, 20, condition, function(error, articles) {
              if (error) {
                return next(error);
              } else {
                res.locals.articles = articles;
                return res.render('article/articles.jade');
              }
            });
          }
        });
      }
    },
    "/add/recommend": {
      "get": function(req, res, next) {
        return res.render('add-recommend.jade');
      },
      "post": function(req, res, next) {
        var data, result;
        data = {
          html: req.body.html,
          title: req.body.title,
          type: 2,
          quote_url: req.body.quote_url,
          user_id: res.locals.user.id,
          user_nick: res.locals.user.nick,
          user_headpic: res.locals.user.head_pic,
          publish_time: new Date().getTime() / 1000
        };
        result = {
          success: 0
        };
        return func_article.add(data, function(error, article) {
          if (error) {
            result.info = error.message;
          } else {
            result.success = 1;
          }
          return res.send(result);
        });
      }
    },
    // "/online_to_local": {
    //   "post": function(req, res, next) {
    //     var result, url;
    //     url = req.body.url.replace(/#.*$/, "");
    //     result = {
    //       success: 0,
    //       info: ""
    //     };
    //     return func_article.getByUrl(url, function(error, art) {
    //       if (art) {
    //         result.data = art;
    //         result.success = 1;
    //         return res.send(result);
    //       } else {
    //         return request.get(url, function(e, s, entry) {
    //           if (e) {
    //             result.info = e.message;
    //             return res.send(result);
    //           } else {
    //             return read.parse(entry, "", function(parseResult) {
    //               var t, titlematch;
    //               titlematch = entry.match(/<title>(.*?)<\/title>/);
    //               t = "";
    //               if (titlematch) {
    //                 t = titlematch[1];
    //               }
    //               result.data = {
    //                 url: url,
    //                 title: (parseResult.title ? parseResult.title : t).replace(/^\s*|\s*$/, ""),
    //                 content: parseResult.content,
    //                 desc: parseResult.desc,
    //                 real_url: s.request.href,
    //                 is_publish: 0
    //               };
    //               result.success = 1;
    //               result.is_realtime = 1;
    //               return res.send(result);
    //             });
    //           }
    //         });
    //       }
    //     });
    //   }
    // },
    // "/online_to_storage": {
    //   "post": function(req, res, next) {
    //     var result, url;
    //     url = req.body.url.replace(/#.*$/, "");
    //     result = {
    //       success: 0,
    //       info: ""
    //     };
    //     return func_article.getByUrl(url, function(error, art) {
    //       if (art) {
    //         result.data = art;
    //         result.success = 1;
    //         return res.send(result);
    //       } else {
    //         return request.get(url, function(e, s, entry) {
    //           if (e) {
    //             result.info = e.message;
    //             return res.send(result);
    //           } else {
    //             return read.parse(entry, "", function(parseResult) {
    //               var data, t, titlematch;
    //               titlematch = entry.match(/<title>(.*?)<\/title>/);
    //               t = "";
    //               if (titlematch) {
    //                 t = titlematch[1];
    //               }
    //               data = {
    //                 quote_url: url,
    //                 title: (parseResult.title ? parseResult.title : t).replace(/^\s*|\s*$/, ""),
    //                 html: parseResult.content,
    //                 desc: parseResult.desc,
    //                 is_publish: 0,
    //                 is_yuanchuang: 0
    //               };
    //               return func_article.add(data, function(error, art) {
    //                 result.data = art;
    //                 result.success = 1;
    //                 result.is_realtime = 1;
    //                 return res.send(result);
    //               });
    //             });
    //           }
    //         });
    //       }
    //     });
    //   }
    // },
    "/add": {
      "get": function(req, res, next) {
        if (!res.locals.card) {
          next(new Error('必须添加花名册后才能发表专栏文章！', 100));
        }
        res.locals.column_id = req.query.column_id ? req.query.column_id : "";
        return res.render('article/add-article.jade');
      },
      "post": function(req, res, next) {
        var data, html, match, result;
        html = safeConverter.makeHtml(req.body.md);
        match = html.match(/<img[^>]+?src="([^"]+?)"/);
        data = {
          md: req.body.md,
          html: html,
          title: req.body.title,
          type: req.body.type,
          user_id: res.locals.user.id,
          user_nick: res.locals.user.nick,
          column_id: req.body.column_id,
          user_headpic: res.locals.user.head_pic,
          publish_time: new Date().getTime() / 1000,
          is_yuanchuang: 1,
          main_pic: match ? match[1] : null,
          desc: req.body.desc,
          is_publish: req.body.is_publish,
          score: 10,
          tags: req.body.tags
        };
        result = {
          success: 0
        };
        return func_article.add(data, function(error, article) {
          if (error) {
            result.info = error.message;
          } else {
            result.success = 1;
            result.article = article;
            if (req.body.tags) {
              func_article.addTagsToArticle(article.id, req.body.tags.split(","));
            }
            if (req.body.fufei) {
              func_info.add({
                target_user_id: 1,
                type: 8,
                source_user_id: res.locals.user.id,
                source_user_nick: res.locals.user.nick,
                time: new Date(),
                target_path: '/article/' + article.id,
                action_name: "请求开通付费",
                target_path_name: article.title
              });
            }
            (__F('coin')).add(40, article.user_id, "发表了一篇专栏文章");
            if (req.body.is_pub) {
              if (req.body.column_id) {
                func_column.update(req.body.column_id, {
                  last_article_time: (new Date()).getTime()
                }, function() {});
                func_column.addCount(req.body.column_id, "article_count", function(error) {});
                func_column.getRsses(req.body.column_id, function(error, rsses) {
                  var emails;
                  if (rsses && rsses.length > 0) {
                    emails = [];
                    rsses.forEach(function(rss) {
                      if (rss.cards && rss.cards.email) {
                        return emails.push(rss.cards.email);
                      }
                    });
                    return func_email.sendArticleRss(article, emails.join(";"));
                  }
                });
              }
              func_count.addCount(res.locals.user.id, "article_count", function() {});
              func_search.add({
                type: "article",
                "pid": article.uuid,
                "title": article.title,
                "html": article.html.replace(/<[^>]*>/g, ""),
                "udid": article.uuid,
                "id": article.id
              }, function() {});
              (__F('create_thumbnail')).create_article(article.id, function() {
                if (req.body.to_weibo) {
                  return sina.statuses.upload({
                    access_token: res.locals.user.weibo_token,
                    pic: path.join(__dirname, "../uploads/article_thumb/" + article.id + ".png"),
                    status: '我在@前端乱炖 发表了一篇原创文章《' + article.title + '》点击查看：http://www.html-js.com/article/' + article.id + " 。前端乱炖是一个专业的前端原创内容社区"
                  });
                }
              });
            }
          }
          return res.send(result);
        });
      }
    },
    "/add-direct": {
      post: function(req, res, next) {
        var result, user_id, user_uuid;
        user_id = req.body.userId;
        user_uuid = req.body.appId;
        result = {
          success: 0
        };
        return func_user.getById(user_id, function(error, user) {
          var data, html, match;
          if (error) {
            result.info = error.message;
            return res.send(result);
          } else {
            if (md5(user.uuid) !== user_uuid) {
              result.info = "不正确的uuid";
              return res.send(result);
            } else {
              html = safeConverter.makeHtml(req.body.md);
              match = html.match(/<img[^>]+?src="([^"]+?)"/);
              data = {
                md: req.body.md,
                html: html,
                title: req.body.title,
                type: 1,
                user_id: user.id,
                user_nick: user.nick,
                column_id: req.body.column_id,
                user_headpic: user.head_pic,
                publish_time: new Date().getTime() / 1000,
                is_yuanchuang: 1,
                is_publish: 1
              };
              return func_article.add(data, function(error, article) {
                if (error) {
                  result.info = error.message;
                } else {
                  result.success = 1;
                  func_article.update(article.id, {
                    sort: article.id
                  });
                  (__F('coin')).add(40, article.user_id, "发表了一篇专栏文章");
                  if (req.body.column_id) {
                    func_column.update(req.body.column_id, {
                      last_article_time: (new Date()).getTime()
                    }, function() {});
                    func_column.addCount(req.body.column_id, "article_count", function(error) {});
                    func_column.getRsses(req.body.column_id, function(error, rsses) {
                      var emails;
                      if (rsses && rsses.length > 0) {
                        emails = [];
                        rsses.forEach(function(rss) {
                          if (rss.cards && rss.cards.email) {
                            return emails.push(rss.cards.email);
                          }
                        });
                        return func_email.sendArticleRss(article, emails.join(";"));
                      }
                    });
                  }
                  func_search.add({
                    type: "article",
                    "pid": article.uuid,
                    "title": article.title,
                    "html": article.html.replace(/<[^>]*>/g, ""),
                    "udid": article.uuid,
                    "id": article.id
                  }, function() {});
                  (__F('create_thumbnail')).create_article(article.id, function() {
                    return sina.statuses.upload({
                      access_token: user.weibo_token,
                      pic: path.join(__dirname, "../uploads/article_thumb/" + article.id + ".png"),
                      status: '我在@前端乱炖 发表了一篇原创文章《' + article.title + '》点击查看：http://www.html-js.com/article/' + article.id + " 。前端乱炖是一个专业的前端原创内容社区"
                    });
                  });
                }
                return res.send(result);
              });
            }
          }
        });
      }
    },
    "/:id/edit": {
      "get": function(req, res, next) {
        return func_article.getById(req.params.id, function(error, article) {
          if (error) {
            return next(error);
          } else if (res.locals.user.is_admin !== 1 && article.user_id !== res.locals.user.id) {
            return next(new Error('没有权限编辑此文章'));
          } else {
            res.locals.article = article;
            return res.render('article/add-article.jade');
          }
        });
      },
      "post": function(req, res, next) {
        var data, html, match, result;
        html = safeConverter.makeHtml(req.body.md);
        match = html.match(/<img[^>]+?src="([^"]+?)"/);
        data = {
          md: req.body.md,
          html: html,
          title: req.body.title,
          publish_time: new Date().getTime() / 1000,
          main_pic: match ? match[1] : null,
          desc: safeConverter.makeHtml(req.body.md.substr(0, 600)),
          column_id: req.body.column_id,
          is_publish: req.body.is_publish,
          tags: req.body.tags
        };
        result = {
          success: 0
        };
        return func_article.update(req.params.id, data, function(error, article) {
          if (error) {
            result.info = error.message;
          } else {
            result.success = 1;
            if (req.body.tags) {
              func_article.addTagsToArticle(article.id, req.body.tags.split(","));
            }
          }
          if (req.body.is_pub) {
            if (req.body.column_id) {
              func_column.update(req.body.column_id, {
                last_article_time: (new Date()).getTime()
              }, function() {});
              func_column.addCount(req.body.column_id, "article_count", function(error) {});
              func_column.getRsses(req.body.column_id, function(error, rsses) {
                var emails;
                if (rsses && rsses.length > 0) {
                  emails = [];
                  rsses.forEach(function(rss) {
                    if (rss.cards && rss.cards.email) {
                      return emails.push(rss.cards.email);
                    }
                  });
                  return func_email.sendArticleRss(article, emails.join(";"));
                }
              });
            }
            func_search.add({
              type: "article",
              "pid": article.uuid,
              "title": article.title,
              "html": article.html.replace(/<[^>]*>/g, ""),
              "udid": article.uuid,
              "id": article.id
            }, function() {});
            (__F('create_thumbnail')).create_article(article.id, function() {
              if (req.body.to_weibo) {
                return sina.statuses.upload({
                  access_token: res.locals.user.weibo_token,
                  pic: path.join(__dirname, "../uploads/article_thumb/" + article.id + ".png"),
                  status: '我在@前端乱炖 发表了一篇原创文章《' + article.title + '》点击查看：http://www.html-js.com/article/' + article.id + " 。前端乱炖是一个专业的前端原创内容社区"
                });
              }
            });
          }
          return res.send(result);
        });
      }
    },
    "/:id/update": {
      get: function(req, res, next) {
        return func_article.update(req.params.id, req.query, function(error, article) {
          if (error) {
            return next(error);
          } else {
            return res.redirect('back');
          }
        });
      }
    },
    "/:id/delete": {
      get: function(req, res, next) {
        return func_article.getById(req.params.id, function(error, article) {
          if (article.user_id === res.locals.user.id || res.locals.user.is_admin) {
            return func_article["delete"](req.params.id, function(error, article) {
              if (error) {
                return next(error);
              } else {
                return res.redirect('back');
              }
            });
          }
        });
      }
    },
    "/:id/zan": {
      post: function(req, res, next) {
        var result;
        result = {
          success: 0
        };
        return func_article.addZan(req.params.id, res.locals.user.id, req.body.score, function(error, log, article) {
          var data;
          if (error) {
            result.info = error.message;
          } else {
            result.success = 1;
            func_info.add({
              target_user_id: article.user_id,
              type: 1,
              source_user_id: res.locals.user.id,
              source_user_nick: res.locals.user.nick,
              time: new Date(),
              target_path: "/article/",
              action_name: "【赞】了您的原创文章",
              target_path_name: article.title
            });
          }
          data = {
            md: "赞了此文章！"
          };
          data.html = "赞了此文章！";
          data.user_id = res.locals.user.id;
          data.user_headpic = res.locals.user.head_pic;
          data.user_nick = res.locals.user.nick;
          data.target_id = "article_" + req.params.id;
          func_comment.add(data, function(error, comment, topic) {
            if (error) {
              return result.info = error.message;
            } else {
              result.success = 1;
              return func_article.addCount(req.params.id, "comment_count");
            }
          });
          return res.send(result);
        });
      }
    },
    "/:id/create_pic": {
      get: function(req, res, next) {
        (__F('create_thumbnail')).create_article(req.params.id);
        return res.redirect('back');
      }
    },
    "/:id/pay": {
      get: function(req, res, next) {
        return func_article.getById(req.params.id, function(error, article) {
          return func_payment.add({
            trade_num: uuid.v4().replace(/-/g, ""),
            trade_title: "前端乱炖活动付费：" + article.title,
            target_uuid: article.id,
            trade_price: 1,
            target_type: 2,
            target_user_id: res.locals.user.id
          }, function(error, payment) {
            if (error) {
              return next(error);
            } else {
              return res.redirect("/alipay/create?trade_num=" + payment.trade_num);
            }
          });
        });
      }
    },
    "/column": {
      get: function(req, res, next) {
        return res.render('article/columns.jade');
      }
    },
    "/:id\.json": {
      get: function(req, res, next) {
        var result;
        result = {
          success: 0,
          data: {}
        };
        return func_article.getById(req.params.id, function(error, article) {
          if (error) {
            result.info = error.message;
            return res.send(result);
          } else {
            return func_comment.getAllByTargetId("article_" + article.id, 1, 100, null, function(error, comments) {
              if (error) {
                result.info = error.message;
                return res.send(result);
              } else {
                result.data.article = article;
                result.data.comments = comments;
                return res.send(result);
              }
            });
          }
        });
      }
    },
    "/:id": {
      "get": function(req, res, next) {
        var article;
        article = res.locals.article;
        res.locals.article = article;
        res.locals.for_app = req.query.for_app
        func_article.addVisit(req.params.id, res.locals.user || null);
        if (article.column_id) {
          func_column.addCount(article.column_id, "visit_count", (function() {}), 2);
        }
        if (req.query.is_clear) {
          return res.render('article/clear-article.jade');
        } else {
          return res.render('article/article.jade');
        }
      }
    },
    "/user/:id": {
      "get": function(req, res, next) {
        return res.render('article/his-articles.jade');
      }
    },
    "/column/add": {
      get: function(req, res, next) {
        if (!res.locals.card) {
          next(new Error('必须添加“花名册”后才能添加自己的专栏'));
        }
        return res.render('article/add-column.jade');
      },
      post: function(req, res, next) {
        if (!res.locals.card) {
          next(new Error('必须添加“花名册”后才能添加自己的专栏'));
        }
        if (!req.body.desc_md) {
          next(new Error('必须填写简介'));
        }
        req.body.desc_html = safeConverter.makeHtml(req.body.desc_md);
        req.body.user_id = res.locals.user.id;
        req.body.is_publish = 1;
        return func_column.add(req.body, function(error, column) {
          if (error) {
            return next(error);
          } else {
            func_info.add({
              target_user_id: 1,
              type: 8,
              source_user_id: res.locals.user.id,
              source_user_nick: res.locals.user.nick,
              time: new Date(),
              target_path: '/article/column/' + column.id,
              action_name: "请求开通专栏",
              target_path_name: column.name
            });
            return res.redirect('/article/column/' + column.id);
          }
        });
      }
    },
    "/column/:id/edit": {
      get: function(req, res, next) {
        return res.render('article/add-column.jade');
      },
      post: function(req, res, next) {
        if (!req.body.desc_md) {
          next(new Error('必须填写简介'));
        }
        req.body.desc_html = safeConverter.makeHtml(req.body.desc_md);
        req.body.user_id = res.locals.user.id;
        req.body.is_publish = 1;
        return func_column.update(req.body.id, req.body, function(error, column) {
          if (error) {
            return next(error);
          } else {
            return res.redirect('/article/column/' + column.id);
          }
        });
      }
    },
    "/column/:id/update": {
      get: function(req, res, next) {
        return func_column.update(req.params.id, req.query, function(error) {
          if (error) {
            return next(error);
          } else {
            return res.redirect('back');
          }
        });
      }
    },
    "/column/:id/adduser": {
      post: function(req, res, next) {
        var result;
        result = {
          success: 0,
          info: ""
        };
        return func_column.addColumnUser(req.params.id, req.body.nick, function(error) {
          if (error) {
            result.info = error.message;
          } else {
            result.success = 1;
          }
          return res.send(result);
        });
      }
    },
    "/column/:id": {
      get: function(req, res, next) {
        var condition;
        condition = {
          is_yuanchuang: 1,
          column_id: req.params.id
        };
        return func_article.count(condition, function(error, count) {
          if (error) {
            return next(error);
          } else {
            res.locals.total = count;
            res.locals.totalPage = Math.ceil(count / 20);
            res.locals.page = req.query.page || 1;
            return func_article.getAll(res.locals.page, 20, condition, function(error, articles) {
              if (error) {
                return next(error);
              } else {
                res.locals.articles = articles;
                if (req.query.is_clear) {
                  return res.render('article/clear-column.jade');
                } else {
                  return res.render('article/column.jade');
                }
              }
            });
          }
        });
      }
    },
    "/column/:id/create_pic": {
      get: function(req, res, next) {
        (__F('create_thumbnail')).create_column(req.params.id);
        return res.redirect('back');
      }
    },
    "/column/:id/rss": {
      get: function(req, res, next) {
        if (!res.locals.card) {
          return next(new Error('请先添加花名册并且填写正确的邮箱地址才能使用此功能！'));
        } else if (!res.locals.card.email) {
          return next(new Error('请先添加花名册并且填写正确的邮箱地址才能使用此功能！'));
        } else {
          return func_column.addRss(req.params.id, res.locals.user.id, function(error, rss) {
            if (error) {
              return next(error);
            } else {
              func_column.getById(req.params.id, function(error, column) {
                if (column) {
                  return func_info.add({
                    target_user_id: column.user_id,
                    type: 10,
                    source_user_id: res.locals.user.id,
                    source_user_nick: res.locals.user.nick,
                    time: new Date(),
                    target_path: '/article/column/' + column.id,
                    action_name: "订阅了您的专栏",
                    target_path_name: column.name
                  });
                }
              });
              func_column.checkNotify(req.params.id);
              return res.redirect('back');
            }
          });
        }
      },
      post: function(req, res, next) {
        var result;
        result = {
          success: 0,
          info: ""
        };
        if (!res.locals.card) {
          result.info = '请先添加花名册并且填写正确的邮箱地址才能使用此功能！';
          return res.send(result);
        } else if (!res.locals.card.email) {
          result.info = '请先添加花名册并且填写正确的邮箱地址才能使用此功能！';
          return res.send(result);
        } else {
          return func_column.addRss(req.params.id, res.locals.user.id, function(error, rss) {
            if (error) {
              result.info = error.message;
              return res.send(result);
            } else {
              func_column.getById(req.params.id, function(error, column) {
                if (column) {
                  return func_info.add({
                    target_user_id: column.user_id,
                    type: 10,
                    source_user_id: res.locals.user.id,
                    source_user_nick: res.locals.user.nick,
                    time: new Date(),
                    target_path: '/article/column/' + column.id,
                    action_name: "订阅了您的专栏",
                    target_path_name: column.name
                  });
                }
              });
              func_column.checkNotify(req.params.id);
              result.success = 1;
              return res.send(result);
            }
          });
        }
      }
    }
  };

  module.exports.filters = {
    "/add": {
      get: ['checkLogin', "checkCard", "article/all-pub-columns", 'tag/all-tags'],
      post: ['checkLoginJson', "checkCard"]
    },
    "/:id/edit": {
      get: ['checkLogin', "checkCard", "article/all-pub-columns", 'tag/all-tags'],
      post: ['checkLoginJson', "checkCard"]
    },
    "/add/recommend": {
      get: ['checkLogin', "checkCard"],
      post: ['checkLoginJson', "checkCard"]
    },
    "/:id/pay": {
      get: ['checkLogin']
    },
    ".json": {
      get: [ 'tag/tags-obj']
    },
    "/": {
      get: ['freshLogin', 'get_infos', 'article/my-columns', 'article/public-columns', 'article/all-publish-articles', 'article/all-notpublish', 'article/index-columns', 'tag/tags-obj']
    },
    "/user/:id": {
      get: ['freshLogin', 'article/who', 'article/his-articles']
    },
    "/old": {
      get: ['freshLogin', 'getRecent', 'get_infos', 'article/new-comments']
    },
    "/:id": {
      get: ['freshLogin', 'getRecent', 'get_infos', 'article/get-article', 'article/article-writer', 'article/get-article-column', 'article/this-column', 'article/comments', 'article/article_zan_logs', 'article/favs', 'article/get-canread', 'article/get-payer', 'article/article_tags']
    },
    "/:id/zan": {
      post: ['checkLoginJson']
    },
    "/column": {
      get: ['freshLogin', 'getRecent', 'get_infos', 'article/new-comments', 'article/my-columns', 'article/index-columns', 'article/checkRss']
    },
    "/column/add": {
      get: ['checkLogin', "checkCard"],
      post: ['checkLogin', "checkCard"]
    },
    "/column/:id/update": {
      get: ['checkLogin']
    },
    "/column/:id": {
      get: ['freshLogin', 'getRecent', 'get_infos', 'article/new-comments', 'article/recent-columns', "article/get-column", 'article/get-column-rss', 'article/get-rsses', 'article/checkColumnUser']
    },
    "/column/:id/rss": {
      get: ['checkLogin', 'checkCard'],
      post: ['checkLoginJson', 'checkCard']
    },
    "/:id/update": {
      get: ['checkLogin']
    },
    "/:id/delete": {
      get: ['checkLogin']
    },
    "/column/:id/edit": {
      get: ['checkLogin', 'checkCard', "article/get-column"],
      post: ['checkLogin', 'checkCard']
    }
  };

}).call(this);
