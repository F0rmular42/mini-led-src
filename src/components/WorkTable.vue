<template >
  <v-layout wrap>
    <!-- card list -->
    <v-flex sm12 xs12 md6 lg4 v-for="ledger in tableLedgers" :key="ledger.id" align-self-auto>
      <v-hover v-slot:default="{ hover }">
        <v-lazy
          v-model="isActiveArray[ledger.id]"
          :options="{
          threshold: .5
        }"
          :min-height="200"
          transition="fade-transition"
        >
          <v-card :elevation="hover ? 12 : 2" :class="{ 'on-hover': hover }" color>
            <v-tabs fixed-tabs background-color="blue" dark v-model="tabArray[ledger.id]">
              <v-tab key="ledger">Bills</v-tab>
              <v-tab key="balance">Balance</v-tab>
            </v-tabs>
            <v-tabs-items v-model="tabArray[ledger.id]">
              <!-- ledger tab -->
              <v-tab-item key="ledger">
                <v-data-table
                  :headers="tableLedgerheaders(ledger.isSource)"
                  :items="getTableLedgerByIdAndFilter({id: ledger.csvId, filters: ledger.filters}).bills"
                  class="elevation-1"
                >
                  <template v-slot:item.time="{ item }">
                    <span>{{item.time | millisTimeFormat}}</span>
                  </template>
                  <template v-slot:item.category="{ item }">
                    <span>{{tableCategoryFormat(item, ledger) | tableTypeNamePrefix(item.type)}}</span>
                  </template>
                  <template v-slot:item.amount="{ item }">
                    <span>{{item.amount | tableAmountFormat}}</span>
                  </template>
                  <template v-slot:top>
                    <v-toolbar flat color="amber">
                      <v-toolbar-title style="min-width:8%">
                        <v-icon style v-if="!ledger.isSource">mdi-source-fork</v-icon>
                        <span v-else>#</span>
                        {{ledger.csvId}}
                      </v-toolbar-title>
                      <v-divider class="mx-4" inset vertical></v-divider>
                      <div
                        v-if="getTableLedgerByIdAndFilter({id: ledger.csvId, filters: ledger.filters}).bills"
                        style="height:100%; width:155px; margin-left:12px; color:white;"
                      >
                        <div style="height: 50%;">
                          <v-tooltip bottom>
                            <template v-slot:activator="{ on }">
                              <v-icon v-on="on" color="white">mdi-cash-plus</v-icon>
                            </template>
                            <span>Total Income</span>
                          </v-tooltip>
                          <span
                            style="float:right;"
                          >{{$currency.locale.unitSymbol}} {{getTableLedgerByIdAndFilter({id: ledger.csvId, filters: ledger.filters}).totalIncome | tableAmountFormat}}</span>
                        </div>
                        <div style="height: 50%;">
                          <v-tooltip bottom>
                            <template v-slot:activator="{ on }">
                              <v-icon v-on="on" color="white">mdi-cash-minus</v-icon>
                            </template>
                            <span>Total Expenses</span>
                          </v-tooltip>
                          <span
                            style="float:right;"
                          >{{$currency.locale.unitSymbol}} {{getTableLedgerByIdAndFilter({id: ledger.csvId, filters: ledger.filters}).totalExpenses | tableAmountFormat}}</span>
                        </div>
                      </div>
                      <v-spacer></v-spacer>
                      <v-tooltip bottom>
                        <template v-slot:activator="{ on }">
                          <v-btn small color class="mb" v-on="on" @click="setFilter(ledger)">
                            <v-icon v-if="ledgerFiltersApplied(ledger)" color="amber">mdi-filter</v-icon>
                            <v-icon v-else color="amber">mdi-filter-outline</v-icon>
                          </v-btn>
                        </template>
                        <span>Filter</span>
                      </v-tooltip>
                      <v-tooltip bottom>
                        <template v-slot:activator="{ on }">
                          <v-btn
                            small
                            color
                            class="mb"
                            v-on="on"
                            @click="forkTableLedger({csvId: ledger.csvId, tableId: ledger.id, filters: ledger.filters})"
                          >
                            <v-icon v-if="ledger.isSource" color="amber">mdi-source-fork</v-icon>
                            <v-icon v-else color="amber">mdi-content-copy</v-icon>
                          </v-btn>
                        </template>
                        <span>Copy</span>
                      </v-tooltip>
                      <v-tooltip bottom>
                        <template v-slot:activator="{ on }">
                          <v-btn
                            v-if="!ledger.isSource"
                            small
                            color
                            class="mb"
                            v-on="on"
                            @click="removeLedger({id: ledger.id})"
                          >
                            <v-icon color="amber">mdi-trash-can-outline</v-icon>
                          </v-btn>
                        </template>
                        <span>Remove</span>
                      </v-tooltip>
                      <v-tooltip bottom>
                        <template v-slot:activator="{ on }">
                          <v-btn
                            v-if="ledger.isSource"
                            small
                            color
                            class="mb"
                            v-on="on"
                            @click="addItem(ledger)"
                          >
                            <v-icon color="amber">mdi-plus</v-icon>
                          </v-btn>
                        </template>
                        <span>Add</span>
                      </v-tooltip>
                    </v-toolbar>
                  </template>
                  <template v-slot:item.actions="{ item }">
                    <v-tooltip bottom>
                      <template v-slot:activator="{ on }">
                        <v-icon
                          v-on="on"
                          small
                          class="mr-2"
                          @click="editItem(item, ledger)"
                        >mdi-pencil</v-icon>
                      </template>
                      <span>Edit</span>
                    </v-tooltip>
                    <v-tooltip bottom>
                      <template v-slot:activator="{ on }">
                        <v-icon v-on="on" small @click="deleteItem(item, ledger)">mdi-delete</v-icon>
                      </template>
                      <span>Delete</span>
                    </v-tooltip>
                  </template>
                </v-data-table>
              </v-tab-item>

              <!-- banlance summary tab -->
              <v-tab-item key="balance">
                <v-data-table
                  :headers="getTableFilterLedgerPerCategory({id: ledger.csvId, filters: ledger.filters}).headers"
                  :items="getTableFilterLedgerPerCategory({id: ledger.csvId, filters: ledger.filters}).dataList"
                  class="elevation-1"
                >
                  <template v-for="(e, index) in getTableFilterLedgerPerCategory({id: ledger.csvId, filters: ledger.filters}).headers" 
                  v-slot:[`item.${e.value}`]="{ item }">
                      <div  v-if="e.text !== 'categories'" :key="index">
                        {{item[e.value] | tableAmountFormat}}
                    </div>
                  </template>
                  <template v-slot:item.category="{ item }">
                    <span>{{tableCategoryFormat(item, ledger) | tableTypeNamePrefix(item.type)}}</span>
                  </template>
                  <template v-slot:top>
                    <v-toolbar flat color="amber">
                      <v-toolbar-title style="min-width:8%">
                        <v-icon style v-if="!ledger.isSource">mdi-source-fork</v-icon>
                        <span v-else>#</span>
                        {{ledger.csvId}}
                      </v-toolbar-title>
                      <v-divider class="mx-4" inset vertical></v-divider>
                      <v-spacer></v-spacer>
                      <v-chip
                        class="ma-2"
                        color="amber"
                        text-color="white"
                        label
                      >Unit: {{$currency.locale.currencyCode}}</v-chip>
                      <v-tooltip bottom>
                        <template v-slot:activator="{ on }">
                          <v-btn
                            v-if="ledger.isSource"
                            small
                            color
                            class="mb"
                            v-on="on"
                            @click="removeAllLedgerConfirm(ledger.csvId)"
                          >
                            <v-icon color="amber">mdi-trash-can</v-icon>
                          </v-btn>
                        </template>
                        <span>Remove All</span>
                      </v-tooltip>
                    </v-toolbar>
                  </template>
                </v-data-table>
              </v-tab-item>
            </v-tabs-items>
          </v-card>
        </v-lazy>
      </v-hover>
    </v-flex>

    <Confirm ref="confirm"></Confirm>
    <!-- dialogs -->
    <v-dialog v-model="dialogItem" max-width="500px" :retain-focus="false">
      <v-card>
        <v-card-title>
          <span class="headline">Bill Item</span>
        </v-card-title>

        <v-card-text>
          <v-form v-model="validEditedItem" ref="editedItemForm" :lazy-validation="true">
            <v-container>
              <v-row>
                <v-col cols="12" sm="12" md="12">
                  <v-text-field disabled :value="editedItem.time | millisTimeFormat" label="Time"></v-text-field>
                </v-col>
                <v-col cols="12" sm="12" md="12">
                  <v-select
                    v-model="editedItem.type"
                    :items="typeTable"
                    item-text="name"
                    item-value="id"
                    label="Type"
                    persistent-hint
                    single-line
                    :rules="[v => !!v || 'Type is required']"
                    required
                  ></v-select>
                </v-col>
                <v-col cols="12" sm="12" md="12">
                  <v-select
                    v-model="editedItem.category"
                    :items="categoryTable({id: ledgerCsvId}).filter(item => {return item.type === editedItem.type})"
                    item-text="name"
                    item-value="id"
                    label="Category"
                    persistent-hint
                    single-line
                    clearable
                  ></v-select>
                </v-col>
                <v-col cols="12" sm="12" md="12">
                  <v-text-field
                    v-model="editedItem.amount"
                    :prefix="$currency.locale.unitSymbol"
                    step="0.01"
                    type="number"
                    min="-99999999"
                    max="99999999"
                    label="Amount"
                    :rules="[
                      v => !!v || 'Amount should be a number',
                      v => (v > 0 || v < 0) || 'Amount should not be zero',
                      v => (v >= -99999999) || 'Amount should be above -99999999',
                      v => (!editedItem.type || editedItem.type !== '0' || (v < 0)) || 'Amount should be negative for expenses',
                      v => (v <= 99999999) || 'Amount should not be above 99999999',
                      v => ((v+'').match(/^-?\d*(\.\d{1,2})?$/) || 'Amount should be with at most 2 decimal digits')
                    ]"
                    required
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-container>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="amber" text @click="closeItemDialog">Cancel</v-btn>
          <v-btn color="amber" text :loading="itemSaveLoading" @click="saveItem">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogFilter" max-width="500px" :retain-focus="false">
      <v-card>
        <v-card-title>
          <span class="headline">Filters</span>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12" sm="12" md="12">
                <v-menu
                  v-model="menu"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  offset-y
                  max-width="290px"
                  min-width="290px"
                >
                  <template v-slot:activator="{ on }">
                    <v-text-field
                      v-model="editedFilter.months"
                      label="Picker months"
                      readonly
                      v-on="on"
                    ></v-text-field>
                  </template>
                  <v-date-picker
                    v-model="editedFilter.months"
                    :allowed-dates="allowMonths({id: ledgerCsvId})"
                    type="month"
                    multiple
                  ></v-date-picker>
                </v-menu>
              </v-col>
              <v-col cols="12" sm="12" md="12">
                <v-select
                  v-model="editedFilter.categories"
                  :items="categoryTable({id: ledgerCsvId})"
                  item-text="name"
                  item-value="id"
                  label="Category"
                  multiple
                  clearable
                  single-line
                >
                  <template v-slot:selection="{ item, index }">
                    <v-chip v-if="index <= 1">
                      <span>{{ item.name }}</span>
                    </v-chip>
                    <span
                      v-if="index === 2"
                      class="grey--text caption"
                    >(+{{ editedFilter.categories.length - 2 }} others)</span>
                  </template>
                </v-select>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="amber" text @click="clearFiler()">Clear</v-btn>
          <v-btn color="amber" text @click="closeFilterDialog()">Cancel</v-btn>
          <v-btn color="amber" text @click="saveFilterItem()">Set</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-fab-transition>
      <v-btn
        v-scroll="onScroll"
        v-show="returnTop"
        fab
        fixed
        bottom
        right
        color="amber"
        @click="toTop"
      >
        <v-icon color="white">mdi-chevron-up</v-icon>
      </v-btn>
    </v-fab-transition>
    <v-row v-if="!tableLedgers || tableLedgers.length <= 0" justify="center" align="center">
      <v-chip large :ripple="false" link>WORK TABLE</v-chip>
    </v-row>
  </v-layout>
</template>


<script>
import { mapGetters, mapActions } from "vuex";
import Confirm from "@/components/Confirm";

export default {
  name: "WorkTable",
  components: {
    Confirm
  },

  computed: {
    ...mapGetters({
      tableLedgers: "tableLedgers",
      getTableLedgerByIdAndFilter: "getTableLedgerByIdAndFilter",
      getCsvLedgerIndex: "getCsvLedgerIndex",
      getCategoryNameById: "getCategoryNameById",
      categoryTable: "categoryTable",
      getTableFilterLedgerPerCategory: "getTableFilterLedgerPerCategory",
      getMonthkeys: "getMonthkeys",
      tableCounter: "tableCounter"
    })
  },

  watch: {
    dialogItem(val) {
      val || this.closeItemDialog();
    },
    dialogFilter(val) {
      val || this.closeFilterDialog();
    },
    tabArray(val) {
      if (val < this.tableCounter) {
        tabArray[this.tableCounter] = "ledger";
      }
    },
    isActiveArray(val) {
      if (val < this.tableCounter) {
        isActiveArray[this.tableCounter] = false;
      }
    }
  },

  data() {
    let unitSymbol = this.$currency.locale.unitSymbol;
    return {
      // actived tab id
      isActiveArray: [],
      tab: "",
      tabArray: [],
      returnTop: false,
      headersCommon: [
        { text: "Time", value: "time", align: "start", width: 70 },
        { text: "Categories", value: "category" },
        {
          text: "Amount(" + unitSymbol + ")",
          value: "amount",
          width: 110,
          align: "end"
        },
        { text: "Actions", value: "actions", width: 80, sortable: false }
      ],
      editedIndex: -1,
      ledgerId: -1,
      ledgerCsvId: -1,
      // item dialog data holding
      itemSaveLoading: false,
      validEditedItem: true,
      dialogItem: false,
      typeTable: [{ id: "0", name: "支出" }, { id: "1", name: "收入" }],
      editedItem: {
        time: null,
        type: "0",
        category: "",
        amount: 0
      },
      defaultItem: {
        time: null,
        type: "0",
        category: "",
        amount: 0
      },
      // filter dialog data holding
      dialogFilter: false,
      editedFilter: {
        months: [],
        categories: []
      },
      defaultFilter: {
        months: [],
        categories: []
      },
      menu: false
    };
  },

  methods: {
    ...mapActions({
      editBillItem: "editBillItem",
      deleteBillItem: "deleteBillItem",
      addBillItem: "addBillItem",
      applyLedgerFilter: "applyLedgerFilter",
      forkTableLedger: "forkTableLedger",
      removeAllLedger: "removeAllLedger",
      removeLedger: "removeLedger"
    }),

    tableLedgerheaders(isSource) {
      return isSource ? this.headersCommon : this.headersCommon.slice(0, -1);
    },

    toTop() {
      this.$vuetify.goTo(0);
    },

    onScroll(e) {
      if (typeof window === "undefined") {
        return;
      }
      const top = window.pageYOffset || e.target.scrollTop || 0;
      this.returnTop = top > 30;
    },

    removeAllLedgerConfirm(csvId) {
      this.$refs.confirm
        .openDialog({ message: "Are you sure you want to delete all ledgers?" })
        .then(confirm => {
          confirm && this.removeAllLedger({ csvId: csvId });
        });
    },

    /*
      bill item list format method
    */
    tableCategoryFormat(item, ledger) {
      return this.getCategoryNameById({
        categoryId: item.category,
        id: ledger.csvId
      });
    },
    tabShow(key, tableIndex) {
      this.tabArray[tableIndex] = key;
    },
    /*
     ledger filter dialog method
    */
    clearFiler() {
      this.editedFilter = Object.assign({}, this.defaultFilter);
    },

    setFilter(ledger) {
      this.dialogFilter = true;
      this.ledgerId = ledger.id;
      this.ledgerCsvId = ledger.csvId;
      this.editedFilter = Object.assign({}, ledger.filters);
    },

    ledgerFiltersApplied(ledger) {
      if (
        (ledger.filters.months && ledger.filters.months.length > 0) ||
        (ledger.filters.categories && ledger.filters.categories.length > 0)
      ) {
        return true;
      } else {
        return false;
      }
    },

    allowMonths(id) {
      let keys = this.getMonthkeys(id);
      return val => keys.indexOf(val) >= 0;
    },

    closeFilterDialog() {
      this.dialogFilter = false;
      this.$nextTick(() => {
        this.clearFiler();
        this.ledgerId = -1;
      });
    },

    saveFilterItem() {
      if (this.ledgerId) {
        this.applyLedgerFilter({
          id: this.ledgerId,
          filters: this.editedFilter
        });
      }
      this.closeFilterDialog();
    },
    /*
     bill item dialog method
    */
    editItem(item, ledger) {
      this.ledgerCsvId = ledger.csvId;
      this.editedIndex = this.getCsvLedgerIndex({ csvId: ledger.csvId, item });
      this.editedItem = Object.assign({}, item);
      this.editedItem.amount = this.$currency.parseFloatAmount(this.editedItem.amount);
      this.dialogItem = true;
    },

    deleteItem(item, ledger) {
      const index = this.getCsvLedgerIndex({ csvId: ledger.csvId, item });
      this.$refs.confirm
        .openDialog({ message: "Are you sure you want to delete this item?" })
        .then(confirm => {
          confirm && this.deleteBillItem({ id: ledger.csvId, index });
        });
    },

    addItem(ledger) {
      this.editedItem = Object.assign({}, this.defaultItem);
      this.editedItem.amount = this.$currency.parseFloatAmount(this.editedItem.amount);
      this.ledgerCsvId = ledger.csvId;
      this.editedItem.time = Date.now();
      this.dialogItem = true;
    },

    closeItemDialog() {
      this.dialogItem = false;
      this.itemSaveLoading = false;
      this.$nextTick(() => {
        this.editedIndex = -1;
        this.ledgerCsvId = -1;
        this.$refs.editedItemForm.reset();
      });
    },

    saveItem() {
      // validations
      if (!this.$refs.editedItemForm.validate()) {
        return;
      }
      this.itemSaveLoading = true;
      // set category
      if (!this.editedItem.category) {
        if (this.editedItem.type === "0") {
          this.editedItem.category = "others-out";
        } else {
          this.editedItem.category = "others-in";
        }
      }
      this.editedItem.amount = this.$currency.parseIntAmount(this.editedItem.amount);
      if (this.editedIndex > -1) {
        this.editBillItem({
          id: this.ledgerCsvId,
          editedIndex: this.editedIndex,
          item: this.editedItem
        });
      } else {
        this.addBillItem({ id: this.ledgerCsvId, item: this.editedItem });
      }
      this.closeItemDialog();
    }
  }
};
</script>

<style scoped>
.v-list-item {
  padding: 0 12px;
}
.v-btn:not(.v-btn--round).v-size--small {
  width: 42px;
  min-width: 42px;
}
</style>
