import Vue from 'vue'
import Vuex from 'vuex'
import Currency from '@/settings/currency.js'

Vue.use(Vuex)

// transform filter to filter rules
function filterTransform(filters) {
  let filtersTranformed = [];
  if (filters.months && filters.months.length > 0) {
    filtersTranformed.push( val => filters.months.indexOf(val.monthKey) >= 0 );
  }
  if (filters.categories && filters.categories.length > 0) {
    filtersTranformed.push( val => filters.categories.indexOf(val.category) >= 0 );
  }
  return filtersTranformed;
}

function formMonthKey(month, year) {
  return year + '-' + ('0' + month).slice(-2);
}

function getCsvLedgerById(state, id) {
  return state.csvLedgers.find(i => i.id === id);
}

function filterCheck(item, filtersTranformed) {
  return filtersTranformed.every(f => f(item)); 
}

function dateParse(item) {
  let formatTime = new Date(parseInt(item.time));
  item.month = formatTime.toLocaleDateString('en', {month: 'numeric'});
  item.year = formatTime.toLocaleDateString('en', {year: 'numeric'});
  item.monthKey = formMonthKey(item.month, item.year);
}

export default new Vuex.Store({

  state: {
    // for storing oringinal data of csvs
    // data structure [{id:0,bill:[{type,time,category,amount,month,year}],category:[{id,type,name}],monthTable:[]},...]
    csvLedgers: [], 
    // for storing all visible ledgers on table
    // data structure [{id:0,filters:{months: [], categories: []},csvId:0,isSource:false},...]
    tableLedgers: [], 
    counters: {
      csvId: 0, // the unique id of csvs data
      tableId: 0, // the unique id of table data
    },
    // snack bar display globally
    snackBarQue: [{id: '1', text: 'Greetings!', color: 'info', isShow: true}]//datastructure [{text: text1, color: color, isShow, id} ...]
  },

  getters: {
    tableCounter(state) {
      return state.counters.tableId;
    },
    tableLedgers(state) {
      return state.tableLedgers;
    },
    snackBarQue(state) {
      return state.snackBarQue;
    },
    // display data on table according to their filters
    // result data structure: same as csvLedgers.bill
    getTableLedgerByIdAndFilter: (state) => ({id, filters}) => {
      let bills = []
      if(!state.csvLedgers && state.csvLedgers.length <= 0) {
        return bills;
      }
      let ledger = getCsvLedgerById(state, id);
      if(!ledger) {
        return bills;
      }
      if(!filters) {
        return bills;
      }
      let filtersApply = Object.assign({}, filters);
      let filtersTranformed = filterTransform(filtersApply);
      bills = ledger.bill.filter(item => filterCheck(item, filtersTranformed));
      let totalIncome = Currency.parseIntAmount(0);
      let totalExpenses = Currency.parseIntAmount(0);
      bills.forEach(e => {
        if(e.type == '0') {
          totalExpenses = Currency.add(totalExpenses, e.amount);
        } else {
          totalIncome = Currency.add(totalIncome, e.amount);
        }
      });
      return {bills,totalExpenses,totalIncome};
    },

    // data structure: [{month:1, year:1900, category:[{category1,amount,type}, ...]},...]
    // filters data structure: {months: [], categories: []}
    // get data summary by month according to filters 
    getTableFilterLedgerPerMonth: (state) => ({id, filters}) => {
      let dataList = [];
      if(!state.csvLedgers && state.csvLedgers.length <= 0) {
        return dataList;
      }
      let ledger = getCsvLedgerById(state, id);
      if(!ledger) {
        return dataList;
      }
      // dataList: hold the monthly income and expenses summary
      if (!filters || !filters.months ) {
        // full list of months
        dataList = ledger.monthTable.slice();
      } else {
        // partial list of months
        dataList = filters.months.slice();
      }
      let filtersApply = Object.assign({}, filters);
      let filtersTranformed = filterTransform(filtersApply);

      ledger.bill.forEach(item => {
        // after being filtered, store the item of bill to dataList group by category
        if(filterCheck(item, filtersTranformed)) {
          let index = dataList.findIndex(i => (i.year === item.year && i.month === item.month));
          if(dataList[index].category) {
            let categoryIndex = dataList[index].category.findIndex(i => (i.category === item.category));
            if(categoryIndex >= 0) {
              // sum up the amount
              dataList[index].category[categoryIndex].amount = Currency.add(dataList[index].category[categoryIndex].amount, item.amount);
              // dataList[index].category[categoryIndex].amount += item.amount;
            } else {
              // append a new item
              dataList[index].category.push({category: item.category, amount: item.amount, type: item.type});
            }
          } else {
            // append a new category and a new item
            dataList[index].category = [];
            dataList[index].category.push({category: item.category, amount: item.amount, type: item.type});
          }
        }
      });
      return dataList;
    },

    // data structure: [{category:cata1, monthKey:1900-1, amount: 100.00, type: 0},...]
    // filters data structure: {months: [], categories: []}
    // get data summary by month according to filters 
    getTableFilterLedgerPerCategory: (state) => ({id, filters}) => {
      let dataList = [];
      let headers = [];

      if(!state.csvLedgers && state.csvLedgers.length <= 0) {
        return {dataList, headers};
      }
      let ledger = getCsvLedgerById(state, id);
      if(!ledger) {
        return {dataList, headers};
      }
      // dataList: hold the monthly income and expenses summary
      headers.push({text: 'Categories', value: 'category', width: '135'});
      if (!filters || !filters.months || filters.months.length <= 0 ) {
        // full list of months
        ledger.monthTable.forEach(i => {
          headers.push({text: i.monthKey, value: i.monthKey, width: '80'});
        });
      } else {
        // partial list of months
        filters.months.forEach(i => {
          headers.push({text: i, value: i, width: '80'});
        });
      }
      let filtersApply = Object.assign({}, filters);
      let filtersTranformed = filterTransform(filtersApply);
      ledger.bill.forEach(item => {
        let monthKey = item.monthKey;
        // after being filtered, store the item of bill to dataList group by category
        if(filterCheck(item, filtersTranformed)) {
          let index = dataList.findIndex(i => (i.category === item.category));
          if(index >= 0) {
            if(dataList[index][monthKey]) {
              // dataList[index][monthKey] += parseFloat(item.amount);
              dataList[index][monthKey] = Currency.add(dataList[index][monthKey], item.amount);
            } else {
              // dataList[index][monthKey] = parseFloat(item.amount);
              dataList[index][monthKey] = item.amount;
            }
          } else {
            dataList.push({category: item.category, [monthKey]: item.amount, type: item.type});
          }
        }
      });
      return {dataList, headers};
    },

    getCsvLedgerIndex: (state) => ({csvId, item}) => {
      let ledger = getCsvLedgerById(state, csvId);
      if (ledger) {
        return ledger.bill.indexOf(item);
      } else {
        return -1;
      }
    },

    getCategoryNameById: (state) => ({id, categoryId}) => {
      let ledger = getCsvLedgerById(state, id);
      let name = '';
      ledger.category.some(item => {
        if(item.id === categoryId) {
          name = item.name;
          return true;
        }
      })
      return name;
    },

    getMonthkeys: (state) => ({id}) => {
      let keys = [];
      if (!id || id < 0) {
        return keys;
      }
      let ledger = getCsvLedgerById(state, id);
      if(!ledger) {
        return keys;
      }
      if(!ledger.monthTable) {
        return keys;
      }
      ledger.monthTable.forEach(e => {
        keys.push(e.monthKey);
      });
      return keys;
    },

    categoryTable: (state) => ({id}) => {
      if (!id || id < 0) {
        return [];
      }
      let ledger = getCsvLedgerById(state, id);
      if (ledger) {
        return ledger.category;
      } else {
        return [];
      }
    }
  },

  mutations: {
    shiftSnackBarQue(state, depth=3) {
      if (state.snackBarQue.length >= depth) {
        state.snackBarQue.shift();
      }
    },
    // push item to snackBarQue
    pushToSnackBarQue(state, {text, color='info', isShow=true}) {
      state.snackBarQue.push({id: Date.now(), text: text, color: color, isShow:isShow});
    },
    hideSnackBarQueItem(state, {id}) {
      let index = state.snackBarQue.findIndex(e => { if (e.id === id) return true});
      if (index >= 0) {
        state.snackBarQue[index].isShow = false;
      }
    },
    // storing original data of csv
    pushCsvToLedgers(state, {csvBill=[], csvCategory, id}) {
      csvBill.map(item => {
        // let formatTime = new Date(parseInt(item.time));
        // item.month = formatTime.toLocaleDateString('en', {month: 'numeric'});
        // item.year = formatTime.toLocaleDateString('en', {year: 'numeric'});
        // item.monthKey = formMonthKey(item.month, item.year);
        dateParse(item);
      });
      // pre-set possible empty category id of bills to 'others'
      csvBill.forEach(item => {
        // reverse amount of expenses
        if (item.type === '0') {
          item.amount = Currency.sub(Currency.parseIntAmount(0), Currency.parseIntAmount(item.amount));
          if (!item.category) {
            item.category = 'others-out';
          }
        } else {
          item.amount = Currency.parseIntAmount(item.amount);
          if (!item.category) {
            item.category = 'others-in';
          }
        }
      });
      csvCategory.push({id: 'others-in', name: 'Others(Income)', type: '1'});
      csvCategory.push({id: 'others-out', name: 'Others(Expenses)', type: '0'});

      state.csvLedgers.push({
        id: id,
        bill: csvBill,
        category: csvCategory,
        monthTable: new Array()
      });
    },
    // storing original data to work table 
    pushFilteredLedgerToTable(state, {nextTableId, tableId = null, csvId, isSource = false,
      filters = {months:[], categories:[]}}) {
      let index = -1;
      if (tableId) {
        index = state.tableLedgers.findIndex( i => {
          return i.id === tableId;
        })
      }
      let filtersApply = Object.assign({}, filters);
      let item = {
        id: nextTableId,
        csvId: csvId,
        filters: filtersApply,
        isSource: isSource
      };
      if(index >= 0){
        state.tableLedgers.splice(index + 1, 0, item); 
      } else {
        state.tableLedgers.push(item);
      }
    },
    removeFilteredLedgerFromTable(state, {index}) {
      state.tableLedgers.splice(index, 1);
    },
    removeAllFilteredLedgerFromTable(state, {csvId}) {
      for (let i = state.tableLedgers.length - 1; i >= 0; i--) {
        if( state.tableLedgers[i].csvId === csvId ) {
          state.tableLedgers.splice(i, 1);
        }
      }
    },
    removeCsvLedger(state, {index}) {
      state.csvLedgers.splice(index, 1);
    },
    // update table Ledger filters
    updateTableLedgerFilter(state, {tableLedger, filters}) {
      tableLedger.filters = filters;
    },
    // set id counter 
    setCounter(state, {counterName, id}) {
      state.counters[counterName] = id;
    },
    // crud of ledger bill
    updateCsvLedgersBill(state, {ledger, editedIndex, item}) {
      Object.assign(ledger.bill[editedIndex], item);
    },
    spliceCsvLedgersBill(state, {ledger, index}) {
      ledger.bill.splice(index, 1);
    },
    pushCsvLedgersBill(state, {ledger, item}) {
      let billItem = Object.assign({}, item)
      dateParse(billItem);
      ledger.bill.push(billItem);
    },
    // set codetable of months that exist in data in one csvledger
    setMonthTable(state, {ledger}) {
      ledger.bill.forEach(e => {
        let item = {year: e.year, month: e.month, monthKey: e.monthKey};
        if(e.month && e.year && ledger.monthTable.findIndex(i => (i.year === e.year && i.month === e.month)) < 0) {
          ledger.monthTable.push(item);
        }
      });
    },
  },
  actions: {
    // loading csv data action: 1.load csv data 2.push csv data to table 3.change corresponding ids
    addDataToLedger({state, commit}, {csvBill, csvCategory}) {
      const csvId = state.counters['csvId'] + 1;
      commit('setCounter', {counterName: 'csvId', id: csvId});
      commit('pushCsvToLedgers', {csvBill, csvCategory, id: csvId});
      let ledger = getCsvLedgerById(state, csvId);
      if (ledger) {
        commit('setMonthTable',{ledger});
      }
      const nextTableId = state.counters['tableId'] + 1;
      commit('setCounter', {counterName: 'tableId', id: nextTableId});
      commit('pushFilteredLedgerToTable', {csvId: csvId, nextTableId: nextTableId, isSource: true});
    },
    // change filter of ledger on table
    applyLedgerFilter({state, commit}, {id, filters}) {
      let tableLedger = state.tableLedgers.find(i => i.id === id);
      let filtersApply = Object.assign({}, filters);
      if (tableLedger) {
        commit('updateTableLedgerFilter', {tableLedger, filters: filtersApply});
      } else {
        commit('pushToSnackBarQue', { text: 'Filter setting failed', color: 'error'});
      }
    },

    // crud of bill item in csvledger
    editBillItem({state, commit}, {id, editedIndex, item}) {
      let ledger = getCsvLedgerById(state, id);
      if (ledger) {
        commit('updateCsvLedgersBill', {ledger, editedIndex, item});
        commit('setMonthTable',{ledger});
        commit('pushToSnackBarQue', { text: 'Bill Editing completed', color: 'success'});
      } else {
        commit('pushToSnackBarQue', { text: 'Bill Editing failed', color: 'error'});
      }

    },
    deleteBillItem({state, commit}, {id, index}) {
      let ledger = getCsvLedgerById(state, id);
      if (ledger) {
        commit('spliceCsvLedgersBill', {ledger, index});
        commit('setMonthTable',{ledger});
        commit('pushToSnackBarQue', { text: 'Bill removing  completed', color: 'success'});
      } else {
        commit('pushToSnackBarQue', { text: 'Bill removing failed', color: 'error'});
      }
    },
    addBillItem({state, commit}, {id, item}) {
      let ledger = getCsvLedgerById(state, id);
      if (ledger) {
        commit('pushCsvLedgersBill', {ledger, item});
        commit('setMonthTable',{ledger});
        commit('pushToSnackBarQue', { text: 'Bill adding completed', color: 'success'});
      } else {
        commit('pushToSnackBarQue', { text: 'Bill adding failed', color: 'error'});
      }
    },
    // make a copy of a ledger on table
    forkTableLedger({state, commit}, {csvId, tableId, filters}) {
      const nextTableId = state.counters['tableId'] + 1;
      commit('setCounter', {counterName: 'tableId', id: nextTableId});
      commit('pushFilteredLedgerToTable', {csvId: csvId, nextTableId: nextTableId, tableId: tableId, isSource: false, filters});
    },
    // remove all ledgers on table and the csvledger they share
    removeAllLedger({state, commit}, {csvId}) {
      commit('removeAllFilteredLedgerFromTable', {csvId: csvId});
      let index = state.csvLedgers.findIndex( i => { return i.id === csvId });
      if( index >= 0 ) {
        commit('removeCsvLedger', {index});
        commit('pushToSnackBarQue', { text: 'Ledgers Removing completed', color: 'success'});
      } else {
        commit('pushToSnackBarQue', { text: 'Ledgers Removing failed', color: 'error'});
      }
    },
    // remove one ledger on table
    removeLedger({state, commit}, {id}) {
      let index = state.tableLedgers.findIndex( i => { return i.id === id });
      if (index >= 0) {
        commit('removeFilteredLedgerFromTable', {index});
        commit('pushToSnackBarQue', { text: 'Ledger removing completed', color: 'success'});
      } else {
        commit('pushToSnackBarQue', { text: 'Ledger Removing failed', color: 'error'});
      }
    },
    // all alerts/notification call this
    notify({commit}, {text, color}) {
      commit('shiftSnackBarQue');
      commit('pushToSnackBarQue', {text, color});
    },
    // hide one notification
    notificationHide({commit}, {id}) {
      commit('hideSnackBarQueItem', {id});
    }
  },
})