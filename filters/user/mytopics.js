// Generated by CoffeeScript 1.9.3
(function() {
  var func_topic;

  func_topic = __F('topic');

  module.exports = function(req, res, next) {
    var count, page;
    page = req.query.page || 1;
    count = req.query.count || 30;
    return func_topic.count({
      user_id: res.locals.user.id
    }, function(error, _count) {
      if (error) {
        return next(error);
      } else {
        res.locals.total = _count;
        res.locals.totalPage = Math.ceil(_count / count);
        res.locals.page = req.query.page || 1;
        return func_topic.getAll(page, count, {
          user_id: res.locals.user.id
        }, function(error, topics) {
          if (error) {
            return next(error);
          } else {
            res.locals.topics = topics;
            return next();
          }
        });
      }
    });
  };

}).call(this);