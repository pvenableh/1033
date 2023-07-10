<template>
  <div class="
      md:px-6
      mx-auto
      flex
      items-start
      justify-start
      flex-col
      md:flex-row
      relative
      px-4
      account
    ">
    <div class="
        md:top-4
        flex
        md:items-end md:justify-end
        flex-col
        w-full
        md:mr-6
        lg:mr-10
        mt-4
        md:sticky
        account__navigation
      ">
      <img :src="'https://ui-avatars.com/api/?name=' +
        user.first_name +
        ' ' +
        user.last_name +
        '&background=cccccc&color=502989'
        " class="mb-2 md:mb-6" />
      <h1 class="hidden md:inline-block">
        {{ user.first_name }} {{ user.last_name }}
      </h1>
      <a @click.prevent="changePanel(1)" :class="{ active: panel === 1 }">Profile</a>
      <a @click.prevent="changePanel(2)" :class="{ active: panel === 2 }">Orders</a>
      <a @click.prevent="changePanel(3)" :class="{ active: panel === 3 }">Addresses</a>
      <a @click.prevent="changePanel(4)" :class="{ active: panel === 4 }">Payment Methods</a>
      <AccountLogout v-if="user" class="logout-icon" />
    </div>
    <transition-group name="list" tag="div" class="
        w-full
        flex flex-col
        items-center
        justify-start
        relative
        account__panels
      ">

      <div v-if="panel === 1" key="1" class="account__panel profile">
        <AccountProfile />
      </div>
      <div v-if="panel === 2" key="2" class="account__panel">
      </div>
      <div v-if="panel === 3" key="3" class="account__panel">
      </div>
      <div v-if="panel === 4" key="4" class="account__panel">
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
const user = useDirectusUser()
definePageMeta({
  middleware: ['auth'],
})
const panel = ref(1)
function changePanel(val) {
  panel.value = val
}

</script>
<style>
.account {
  max-width: 1600px;

  &__navigation {
    border-bottom: thin solid var(--lightGrey);

    @media (min-width: theme('screens.md')) {
      width: 220px;
      border-bottom: none;
    }

    img {
      width: 50px;
      height: 50px;
      @apply rounded-full mx-auto md:mx-0;
      
    }

    h1 {
      font-size: 10px;
      @apply w-full text-center md:text-right uppercase tracking-wider pb-2 mb-0 md:mb-2;
    }

    a,
    .logout-btn {
      font-size: 10px;
      @apply w-full text-center md:text-right uppercase tracking-wider pb-2 mb-0 md:mb-2 cursor-pointer;
    }

    a.active {
      color: var(--purple);
      opacity: 0.25;
    }
  }

  &__panels {
    width: 100%;

    @media (min-width: theme('screens.md')) {
      width: 800px;
    }
  }

  &__panel {
    @apply w-full;

    h2 {
      @apply uppercase tracking-wider font-bold text-sm text-center w-full mt-6;
    }

    .addresses {
      &__nav {
        a {
          max-width: 200px;
        }
      }
    }
  }
}
</style>