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
    const { data: exists, pending, refresh } = await useLazyAsyncData(
      'exists',
      () => $fetch(`https://admin.1033lenox.com/users?filter[email][_eq]=${value}`)
    )
    if (exists.value.data.length < 1) {
      console.log("no")
      return 'This email is not registered.'
    }
    console.log("yes")
    return true
  }

}
async function emailNotExists(value) {
  if (!value) {
    return 'Email is required'
  }
  const regex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i
  if (!regex.test(value)) {
    return 'This must be a valid email'
  }

  if (value && regex.test(value)) {
    const { data: exists } = await useFetch('https://admin.1033lenox.com/users?filter[email][_eq]=' + value)
    if (exists.value.data.length > 0) {
      console.log("no")
      return 'This email is already registered.'
    }
    console.log("yes")
    return true
  }

}
async function personExists(value) {
  if (!value) {
    return 'Email is required'
  }
  const regex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i
  if (!regex.test(value)) {
    return 'This must be a valid email'
  }

  if (value && regex.test(value)) {
    const { data: exists } = await useFetch('https://admin.1033lenox.com/items/people?filter[email][_eq]=' + value)
    const { data: user } = await useFetch('https://admin.1033lenox.com/users?filter[email][_eq]=' + value)
    if (exists.value.data.length < 1) {
      console.log("no")
      return 'This email is not in the system.'
    } else if(user.value.data.length > 0) {
      return 'This email is already registered. Please login.'
    }
    console.log("yes")
    return true
  }

}
export default defineNuxtPlugin((nuxtApp) => {
  defineRule('required', required)
  defineRule('email', email)
  defineRule('min', min)
  defineRule('emailExists', emailExists)
  defineRule('emailNotExists', emailNotExists)
  defineRule('personExists', personExists)
  // Object.keys(rules)
  // 	.filter((k) => k !== "default")
  // 	.forEach((rule) => {
  // 		defineRule(rule, rules[rule]);
  // 		// console.log(rule);
  // 	});

})
