// Generated by CoffeeScript 1.9.3
(function() {
  var _, func_article;

  func_article = __F('article/article');

  _ = require('underscore');

  module.exports = function(req, res, next) {
    if (req.query.page) {
      next();
      return;
    }
    return func_article.getVisitors(null, 60, function(error, visitors) {
      visitors = _.uniq(_.sortBy(visitors), false, function(r1, r2) {
        return r1.user_id;
      });
      res.locals.article_visitors = visitors;
      return next();
    });
  };

}).call(this);