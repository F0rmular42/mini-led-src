import currency from '@/settings/currency.js'

export default {
    millisTimeFormat: function (value) {
        let date = new Date(parseInt(value))
        return date.toLocaleDateString('en', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric'
            }) +
            ' ' +
            date.toLocaleTimeString('en-GB')
    },
    tableAmountFormat: function (value) {
        return currency.intAmountFormat(value);
    },
    tableTypeNamePrefix: function (value, type) {
        if (type == '0') {
            return 'Expenses: ' + value;
        } else {
            return 'Income: ' + value;
        }
    }
}