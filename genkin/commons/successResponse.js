'use strict';
module.exports = (data, meta = {}) => {
    return ({
        status: true,
        meta: meta,
        data: data
    })
};