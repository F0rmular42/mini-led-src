<template>
  <div>
    <div id="snackbars" v-for="item in snackBarQue" :key="item.id">
      <v-snackbar v-model="item.isShow" :color="item.color" right :timeout="3000">
        {{ item.text }}
        <v-btn dark text @click="notificationHide({id: item.id})">Close</v-btn>
      </v-snackbar>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";

export default {
  name: "Notification",
  computed: {
    ...mapGetters({
      snackBarQue: "snackBarQue"
    })
  },
  methods: {
    ...mapActions({
      notificationHide: "notificationHide"
    })
  }
};
</script>