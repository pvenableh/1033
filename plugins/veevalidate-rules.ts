import { defineRule } from 'vee-validate'
import { required, email, min } from '@vee-validate/rules'


// import axios from 'axios'
// import * as rules from "@vee-validate/rules";
async function emailExists(value) {
  // if the field is empty
  if (!value) {
    return 'Email is required'
  }
  const regex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i
  if (!regex.test(value)) {
    return 'This must be a valid email'
  }

  if (value && regex.test(value)) {
    // const { data: exists } = await directus.items("directus_users").readByQuery({
    //   filter: {
    //     email: {
    //       _eq: value,
    //     },
    //   },
    // })
    const { data: exists, pending, refresh } = await useLazyAsyncData(
      'exists',
      () => $fetch(`https://admin.1033lenox.com/users?filter[email][_eq]=${value}`)
    )
    // watch(() => value, () => refresh() );

    // return axios.get('https://admin.danablairdesigns.com/users?filter[email][_eq]=' + value).then(function(res){
    //   const exists = res
    // }).catch((e) => {
    //   console.log(e)
    // })

    console.log(exists)
    if (exists.length < 1) {
      console.log("no")
      return 'This email is not registered.'
    }
    console.log("yes")
    return true
  }

}
async function emailNotExists(value) {
  // if the field is empty
  if (!value) {
    return 'Email is required'
  }
  const regex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i
  if (!regex.test(value)) {
    return 'This must be a valid email'
  }

  if (value && regex.test(value)) {
    const { data: exists } = await useFetch('https://admin.1033lenox.com/users?filter[email][_eq]=' + value)
    // console.log('https://admin.danablairdesigns.com/users?filter[email][_eq]=' + value)
    // console.log(exists._value.data)
    // const { data: exists } = await directus.items("directus_users").readByQuery({
    //   filter: {
    //     email: {
    //       _eq: value,
    //     },
    //   },
    // })
    if (exists.length > 0) {
      console.log("no")
      return 'This email is already registered.'
    }
    console.log("yes")
    return true
  }

}
// async function emailNotExists(value) {
//   // if the field is empty
//   if (!value) {
//     return 'Email is required'
//   }
//   const regex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i
//   if (!regex.test(value)) {
//     return 'This must be a valid email'
//   }
//   const { data, pending, error, refresh } = useFetch(
//     'https://admin.danablairdesigns.com/users?filter[email]=' + value,
//     {
//       onResponse({ request, response, options }) {
//         return response._data
//       },
//     }
//   )
//   console.log('https://admin.danablairdesigns.com/users?filter[email]= ' + value)
//   console.log(data._value.data.length)
//   if (data._value.data.length) {
//     return 'This email is already registered.'
//   }
//   return true
// }

export default defineNuxtPlugin((nuxtApp) => {
  defineRule('required', required)
  defineRule('email', email)
  defineRule('min', min)
  defineRule('emailExists', emailExists)
  defineRule('emailNotExists', emailNotExists)
  // Object.keys(rules)
  // 	.filter((k) => k !== "default")
  // 	.forEach((rule) => {
  // 		defineRule(rule, rules[rule]);
  // 		// console.log(rule);
  // 	});

})
