<template>
  <div id="nav-btn" @click.prevent="sideMenuToggle()">
    <div id="nav-icon"><span></span> <span></span> <span></span></div>
  </div>
</template>
<script setup>
import { openScreen, toggleScreen } from '~~/composables/useScreen'
function sideMenuToggle() {
  const element = document.getElementById('nav-btn')
  const navToggle = document.getElementById('nav-drawer-toggle')
  if (element.classList.contains('open')) {
    element.classList.remove('open')
    console.log('nav btn remove')
  } else {
    console.log('nav btn add')
    element.classList.add('open')
    navToggle.checked = true
    // openScreen()
  }
  // navToggle.checked = !navToggle.checked
  // toggleScreen()
}
</script>
<style scoped>
#nav-btn {
  top: 16px;
  right:15px;
  z-index: 90;
  display: block;
  position: fixed;
  background: none;
  width: 50px;
  text-align: center;
  cursor: pointer;
  transition: 0.475s var(--curve);
  max-width: 300px;
  @media (min-width: theme('screens.sm')) {
    right:35px;
  }
  /* -webkit-backdrop-filter: blur(10px) invert(0.015);
  backdrop-filter: blur(10px) invert(0.015); */
  @media (min-width: theme('screens.xl')) {
    width: 50px;

    position: absolute;
  }
  /* @media (min-width: 1280px) {
    margin-right: 0px;
  } */
  #nav-icon {
    width: 45px;
    height: 30px;
    position: relative;
    margin: 4px auto 6px;
    transform: rotate(0deg);
    cursor: pointer;
    @media (min-width: theme('screens.lg')) {
      /* margin: 16px auto; */
      width: 50px;
    }

    span {
      display: block;
      position: absolute;
      height: 1px;
      width: 100%;
      background: var(--grey);
      border-radius: 1px;
      opacity: 1;
      left: 0;
      transform: rotate(0deg);
      transition: 0.25s var(--curve);
    }

    span:nth-child(1) {
      top: 11px;
      transform-origin: left center;
      @media (min-width: theme('screens.lg')) {
        top: 9px;
      }
    }

    span:nth-child(2) {
      top: 14px;
      transform-origin: left center;
      display: none;
    }

    span:nth-child(3) {
      top: 20px;
      transform-origin: left center;
      @media (min-width: theme('screens.lg')) {
        top: 22px;
      }
    }
  }
}
#nav-btn.open {
  /* width: 230px; */
  top: 200px;
  right: -10px;
  /* transform: rotate(-360deg); */
  opacity: 0;
  @media (min-width: theme('screens.lg')) {
  }

  #nav-icon {
    width: 55px;

    span {
      background: var(--white);
    }

    /* span:nth-child(1) {
      transform: rotate(40deg);
      top: 1px;
      left: 8px;
      width: 80%;
      @media (min-width: theme('screens.lg')) {
        top: 0;
        width: 100%;
      }
    } */

    span:nth-child(2) {
      width: 0;
      opacity: 0;
    }

    /* span:nth-child(3) {
      transform: rotate(-40deg);
      top: 32px;
      left: 8px;
      width: 80%;
      @media (min-width: theme('screens.lg')) {
        top: 35px;
        width: 100%;
      }
    } */
  }
}
</style>
