<template>
  <v-container fill-height fluid grid-list-xl>
    <v-layout wrap>
      <v-flex>
        <v-form v-model="validForm" ref="uploadForm" :lazy-validation="true">
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn
                id="addToTable"
                :loading="loading"
                v-on="on"
                color="amber"
                @click="addToWorkTable()"
              >Add to Work Table</v-btn>
            </template>
            <span v-if="isCategoryDataEmpty()">Category file is required</span>
            <span
              v-if="isBillDataEmpty() && !isCategoryDataEmpty()"
            >Create a new ledger from category File</span>
            <span v-if="!isBillDataEmpty() && !isCategoryDataEmpty()">Upload migration data</span>
          </v-tooltip>
          <v-file-input
            accept=".csv"
            v-model="categoryFile"
            id="categoryFileInput"
            show-size
            chips
            :rules="[v => !!v || 'Category file is Required',
            v => !v || v.size < 1e4 || 'File size should be less than 10 kB!']"
            @change="addCategoryFile()"
            label="Select a category csv file"
            :disabled="inputDisabled"
          ></v-file-input>
          <v-file-input
            accept=".csv"
            v-model="billFile"
            id="billFileInput"
            show-size
            chips
            :rules="[v => !v || v.size < 2e6 || 'File size should be less than 2 MB!']"
            @change="addBillFile()"
            label="Select a bill csv file"
            :disabled="inputDisabled"
          ></v-file-input>
        </v-form>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import Papa from "papaparse";
import { mapState, mapGetters, mapActions } from "vuex";
import { setTimeout } from "timers";

export default {
  name: "CsvUpload",

  data() {
    return {
      validForm: true,
      billFile: null,
      categoryFile: null,
      billData: null,
      categoryData: null,
      loading: false,
      inputDisabled: false
    };
  },

  methods: {
    ...mapActions({
      addDataToLedger: "addDataToLedger",
      notify: "notify"
    }),
    addBillFile() {
      if (this.billFile) {
        if (!this.$refs.uploadForm.validate()) {
          return;
        }
        let isFirstExecuted = true;
        Papa.parse(this.billFile, {
          header: true,
          skipEmptyLines: true,
          encoding: "UTF-8",
          complete: results => {
            this.billData = results.data;
            this.notify({
              text: "Bill file parse completed",
              color: "success"
            });
          },
          error: function(err, file, inputElem, reason) {
            this.billFile = null;
            this.billData = null;
            this.notify({
              text: "Bill file parse error: " + reason,
              color: "error"
            });
          }
        });
      } else {
        this.clearBillData();
      }
    },
    addCategoryFile() {
      if (this.categoryFile) {
        if (!this.$refs.uploadForm.validate()) {
          return;
        }
        Papa.parse(this.categoryFile, {
          header: true,
          encoding: "UTF-8",
          before: function(file, inputElem) {
            // executed before parsing each file begins;
            // what you return here controls the flow
            return {
              action: "abort",
              reason: "Some reason"
            };
          },
          complete: results => {
            this.categoryData = results.data;
            this.notify({
              text: "Category File parse completed",
              color: "success"
            });
          },
          error: function(err, file, inputElem, reason) {
            this.categoryFile = null;
            this.categoryData = null;
            this.notify({
              text: "Category File parse error: " + reason,
              color: "error"
            });
          }
        });
      } else {
        this.clearCategoryData();
      }
    },
    addToWorkTable() {
      // validations
      if (!this.$refs.uploadForm.validate()) {
        return;
      }

      if (this.isCategoryDataEmpty()) {
        return;
      }
      if (this.isBillDataEmpty()) {
        this.billData = [];
      }
      this.loading = true;
      this.inputDisabled = true;
      let billData = this.billData.slice();
      let categoryData = this.categoryData.slice();
      this.addDataToLedger({
        csvBill: billData,
        csvCategory: categoryData
      });
      setTimeout(() => {
        this.notify({ text: "Files upload successfully", color: "success" });
        this.clearAll();
        this.loading = false;
        this.inputDisabled = false;
      }, 500);
    },
    isCategoryDataEmpty() {
      return !this.categoryData || this.categoryData.length <= 0;
    },
    isBillDataEmpty() {
      return !this.billData || this.billData.length <= 0;
    },
    clearBillData() {
      this.billFile = null;
      this.billData = null;
    },
    clearCategoryData() {
      this.categoryFile = null;
      this.categoryData = null;
    },
    clearAll() {
      this.$refs.uploadForm.reset();
      this.clearBillData();
      this.clearCategoryData();
    }
  }
};
</script>
