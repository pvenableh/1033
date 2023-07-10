import { defineStore } from 'pinia'
export const usePersonStore = defineStore('PersonStore', {

    state: () => {
        return {
            person: {},
        };
    },
  getters: {
    personData: (state) => state.person,
  },

  actions: {
    // async getPersonData() { 
    //   const { data: person } = await useFetch('https://admin.1033lenox.com/items/people?filter[email][_eq]=' + this.$auth.user.email)
    //   this.person = person.data[0]
    // }
  },
})