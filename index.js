'use strict';

var _ = require('lodash'),
    async = require('async'),
    extend = require('extend'),
    S = require('string');

var get_fields = function (object) {
    if(Array.isArray(object)) {
        return object;
    }
    
    object = object || {};
    var list = [];

    _.each(object, function (value, key) {
        if(typeof value == "boolean" && !!value) {
            list.push(key);
        }
    });
    
    return list;
};

module.exports = function (config) {
    config = extend(true, {
        defaults: {
            pageSize: 20
        },
        query: {
			search: ['like', "%{{search}}%"]
		}
    }, config);
    return function (Model) {
        var self = this,
            options = {
                page: 1,
                limit: config.defaults.pageSize,
                columns: '*',
                query: {
                    fields: [],
                    value: ''
                }
            };
    
        self.columns = function (columns) {
            options.columns = columns || '*';
            return self;
        };
    
        self.query = function (fields, value) {
            options.query = {
                fields: fields,
                value: value || ''
            };
    
            return self;
        };
        
        self.where = function (fn) {
            options.where = fn || function () {};
            return self;
        };
    
        self.orWhere = function (fn) {
            options.orWhere = fn || function () {};
            return self;
        };
    
        self.filters = function (filters) {
            options.filters = filters;
            return self;
        };
    
        self.sort = function(params) {
            options.sort = params || options.sort;
            return self;
        };
    
        self.page = function (page) {
            options.page = page || options.page;
            return self;
        };
    
        self.limit = function (limit) {
            options.limit = limit || options.limit;
            return self;
        };
    
        self.related = function (related) {
            options.related = related || [];
            return self;
        };
    
        self.fetchAll = function (callback) {
            async.waterfall([
                //-- Count event
                function (cb) {
                    Model.query(function (qb) {
                        options.where && qb.where(options.where);
    
                        options.query.value != '' && qb.where(function (qb) {
                            _.each(get_fields(options.query.fields), function (param) {
                                qb.orWhere(
                                    param, config.query.search[0], S(config.query.search[1]).template({
                                        search: options.query.value
                                    }).s
                                );
                            });
    
                            _.each(options.related, function (related) {
                                var fields = get_fields(options.query.fields[related]);
                                if(fields.length > 0) {
                                    qb.orWhereIn(
                                        related + '_id', function () {
                                            this.select('id').from(related).where(function (qb) {
                                                _.each(fields, function (param) {
                                                    qb.orWhere(
                                                        param, config.query.search[0], S(config.query.search[1]).template({
                                                            search: options.query.value
                                                        }).s
                                                    );
                                                });
                                            });
                                        }
                                    );
                                }
                            });
                        });
    
                        _.each(options.filters, function (values, field) {
                            if(Array.isArray(values)) {
                                qb.where(function (qb) {
                                    _.each(values, function (value) {
                                        if(value) {
                                            qb.orWhere(field, value[0], value[1]);
                                        }
                                    });
                                });
                            } else {
                                qb.whereIn(
                                    field + '_id', function () {
                                        this.select('id').from(field).where(function (qb) {
                                            var table = field;
                                            _.each(values, function (values, field) {
                                                qb.where(function (qb) {
                                                    _.each(values, function (value) {
                                                        if(value) {
                                                            qb.orWhere(table + '.' + field, value[0], value[1]);
                                                        }
                                                    });
                                                });
                                            });
                                        });
                                    }
                                );
                            }
                        });
    
                        options.orWhere && qb.orWhere(options.orWhere);
                    }).count().then(function (count) {
                        cb(null, {
                            sort: options.sort,
                            filters: options.filters,
                            query: options.query,
                            pagination: {
                                total: count,
                                pages: Math.ceil(count / options.limit),
                                page: options.page,
                                pageSize: options.limit
                            }
                        });
                    }).catch(cb);
                },
                
                //-- Retrieve event
                function (data, cb) {
                    Model.query(function (qb) {
                        qb.columns(options.columns);
    
                        options.where && qb.where(options.where);
    
                        options.query.value != '' && qb.where(function (qb) {
                            _.each(get_fields(options.query.fields), function (param) {
                                qb.orWhere(
                                    param, config.query.search[0], S(config.query.search[1]).template({
                                        search: options.query.value
                                    }).s
                                );
                            });
    
                            _.each(options.related, function (related) {
                                var fields = get_fields(options.query.fields[related]);
                                if(fields.length > 0) {
                                    qb.orWhereIn(
                                        related + '_id', function () {
                                            this.select('id').from(related).where(function (qb) {
                                                _.each(fields, function (param) {
                                                    qb.orWhere(
                                                        param, config.query.search[0], S(config.query.search[1]).template({
                                                            search: options.query.value
                                                        }).s
                                                    );
                                                });
                                            });
                                        }
                                    );
                                }
                            });
                        });
    
                        _.each(options.filters, function (values, field) {
                            if(Array.isArray(values)) {
                                qb.where(function (qb) {
                                    _.each(values, function (value) {
                                        if(value) {
                                            qb.orWhere(field, value[0], value[1]);
                                        }
                                    });
                                });
                            } else {
                                qb.whereIn(
                                    field + '_id', function () {
                                        this.select('id').from(field).where(function (qb) {
                                            var table = field;
                                            _.each(values, function (values, field) {
                                                qb.where(function (qb) {
                                                    _.each(values, function (value) {
                                                        if(value) {
                                                            qb.orWhere(table + '.' + field, value[0], value[1]);
                                                        }
                                                    });
                                                });
                                            });
                                        });
                                    }
                                );
                            }
                        });
    
                        options.orWhere && qb.orWhere(options.orWhere);
    
                        qb.offset(
                            ((options.page || 1) - 1) * options.limit
                        ).limit(
                            options.limit
                        );
    
                        options.sort && _.each(options.sort, function (sort, field) {
                            qb.orderBy(
                                field, sort
                            );
                        });
                    }).fetchAll({
                        withRelated: options.related
                    }).then(function (result) {
                        data.models = result.toJSON();
                        
                        cb(null, data);
                    }).catch(cb);
                }
            ], callback);
        };
    };
};