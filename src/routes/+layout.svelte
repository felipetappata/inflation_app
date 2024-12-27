<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<div id="app">
    <main id="main-content">
        {@render children()}
    </main>
</div>

<style>
    #app {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
    }

    #main-content {
        flex: 1;
        width: 100%;
        max-width: 100vw;
        margin: 0;
        padding: 0;
        position: relative;
    }
</style>
