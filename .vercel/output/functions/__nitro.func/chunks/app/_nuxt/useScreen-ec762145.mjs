import { ref } from 'vue';

const screen = ref(false);
const loader = ref(false);
function closeScreen() {
  screen.value = false;
  loader.value = false;
}
function openScreen() {
  screen.value = true;
}

export { closeScreen as c, loader as l, openScreen as o, screen as s };
//# sourceMappingURL=useScreen-ec762145.mjs.map
