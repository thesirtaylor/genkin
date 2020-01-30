'use strict';
module.exports = (error, meta = {}) => {
    return ({
        status: false,
        meta: meta,
        errors: error
    })
};