import Dinero from 'dinero.js'
// currency settings and format functions
let locale = {
    unitSymbol: '¥',
    currencyCode: 'CNY',
    code: 'zh-CN',
    precision: 2,
}

export default {
    parseIntAmount: function (val) {
        return parseInt(val * 100);
    },
    add: function(a, b) {
        return a + b;
    },
    sub: function(a, b) {
        return a - b;
    },
    intAmountFormat: function (val) {
        if (!val) return val; 
        return Dinero({
            amount: val
        }).toFormat('0.00');
    },
    parseFloatAmount: function (val) {
        return parseFloat(val/100).toFixed(locale.precision);
    },
    locale: locale
}