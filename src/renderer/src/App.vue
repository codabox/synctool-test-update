<template>
    <SyncTool />
</template>

<script>
import SyncTool from './components/SyncTool.vue'

export default {
    name: 'app',
    components: {
        SyncTool,
    },
}
</script>

<style>
body, a, p {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

#app {
  padding: 30px;
  height: 100vh;
}
</style>
