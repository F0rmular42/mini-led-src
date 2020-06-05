<template>
  <v-dialog v-model="isShow" max-width="500px" :retain-focus="false">
    <v-card>
      <v-card-title v-if="!!title">
        <span class="headline">{{title}}</span>
      </v-card-title>
      <v-card-text class="pa-8">{{ message }}</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="amber" text @click="cancel">Cancel</v-btn>
        <v-btn color="amber" text @click="confirm">Confirm</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "Confirm",
  data: () => ({
    isShow: false,
    resolve: null,
    reject: null,
    message: null,
    title: null
  }),
  methods: {
    openDialog({ message = "Do you confirm?", title = null }) {
      this.isShow = true;
      this.title = title;
      this.message = message;
      return new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });
    },
    confirm() {
      this.resolve(true);
      this.isShow = false;
    },
    cancel() {
      this.resolve(false);
      this.isShow = false;
    }
  }
};
</script>