<template>
  <div id="app">
    <div ref="pixiContainer"></div>
  </div>
  
</template>

<script>
import { onMounted, ref } from 'vue';
import { appPromise } from './pixi/game';
export default {
  name: 'App',
  setup() {
    const pixiContainer = ref(null);

    onMounted(async () => {
      const app = await appPromise;
      pixiContainer.value.appendChild(app.canvas);
    });

    return {
      pixiContainer,
    };
  },
};
</script>

<style>
#app {
  text-align: center;
}

body{
  margin: 0;
  padding: 0;
  overflow: hidden;
}

@font-face {
    font-family: 'PixelifySans';
    src: url('assets/fonts/PixelifySans.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
}

</style>