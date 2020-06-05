<template>
  <v-app id="ledger">
    <v-app-bar app clipped-left color="amber">
      <!-- <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon> -->
      <span class="title ml-3 mr-5">
        <span class="font-weight-light">Mini Ledger</span>
      </span>
      <v-spacer></v-spacer>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <a v-on="on" href=".\\example\\bill.csv" rel="nofollow noreferrer" download>bill.csv</a>
          <span class="title ml-2 mr-2"></span>
          <a
            v-on="on"
            href=".\\example\\categories.csv"
            rel="nofollow noreferrer"
            download
          >catagories.csv</a>
        </template>
        <span>example files</span>
      </v-tooltip>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn icon v-on="on" @click="uploadSheet = true">
            <v-icon>mdi-upload</v-icon>
          </v-btn>
        </template>
        <span>Upload Csv</span>
      </v-tooltip>
    </v-app-bar>
    <Notification/>
    <v-content>
      <v-container fluid class="grey lighten-4" grid-list-xl fill-height>
        <WorkTable/>
      </v-container>
      <v-bottom-sheet v-model="uploadSheet" inset>
        <v-sheet class="text-center" height="230px">
          <CsvUpload/>
        </v-sheet>
      </v-bottom-sheet>
    </v-content>
  </v-app>
</template>


<script>
import CsvUpload from "@/components/CsvUpload";
import WorkTable from "@/components/WorkTable";
import Notification from "@/components/Notification";
import { mapActions } from "vuex";

export default {
  props: {
    source: String
  },
  components: {
    CsvUpload,
    WorkTable,
    Notification
  },
  data() {
    return {
      uploadSheet: false
    };
  },

  mounted() {
    // show case
    const billData = [
      {
        type: "0",
        time: "1561910400000",
        category: "27wquwjnsa",
        amount: "-10000"
      },
      {
        type: "0",
        time: "1561910400000",
        category: "27wquwjnsa",
        amount: "-900.01"
      },
      {
        type: "0",
        time: "1561910400000",
        category: "328jka9aslss",
        amount: "100.01"
      },
      { type: "1", time: "1577345638784", category: "", amount: "2000.012" }
    ];

    const categoryData = [
      { id: "27wquwjnsa", type: "0", name: "Maintenance" },
      { id: "328jka9aslss", type: "0", name: "Food" }
    ];

    this.addDataToLedger({
      csvBill: billData,
      csvCategory: categoryData
    });
  },

  methods: {
    ...mapActions({
      addDataToLedger: "addDataToLedger"
    })
  }
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  margin-top: 60px;
}
.v-snack--bottom {
  bottom: 88px;
}
</style>

