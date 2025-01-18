<script setup lang="ts">
import { onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue';

const RESIZE_INTERVAL_MS = 500;

const emit = defineEmits<{
    (e: 'resize', size: DOMRect): void,
}>();

const container = useTemplateRef<HTMLElement>('container');
const containerSize = ref(new DOMRect(0, 0, 0, 0));
let sizeInterval = 0;

onMounted(() => {
    if (sizeInterval) {
        clearInterval(sizeInterval);
        sizeInterval = 0;
    }
    updatePlayerSizes()
    sizeInterval = setInterval(updatePlayerSizes, RESIZE_INTERVAL_MS);

    window.addEventListener('resize', updatePlayerSizes);
});

onUnmounted(() => {
    if (sizeInterval) {
        clearInterval(sizeInterval);
        sizeInterval = 0;
    }

    window.removeEventListener('resize', updatePlayerSizes);
    if (container.value) {
        resizeObserver.unobserve(container.value);
    }
});

const resizeObserver = new ResizeObserver(updatePlayerSizes);
watch(container, () => {
    if (container.value) {
        resizeObserver.observe(container.value);
    }
});

function updatePlayerSizes() {
    const size = container.value?.getBoundingClientRect?.();
    if (!size) {
        return;
    }

    if (size?.width !== containerSize.value.width || size?.height !== containerSize.value.height) {
        containerSize.value = size;
        emit('resize', size);
    }
}
</script>

<template>
    <div class="container-outer">
        <div class="container-middle">
            <div ref="container" class="container-inner">
                <div class="container-the-one-after-inner">
                    <slot :size="containerSize" />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.container-outer {
    display: grid;
    aspect-ratio: 16 / 9;
    height: 100%;
    max-width: 100%;
    grid-template: 1fr / 100%;
    align-items: center;
    overflow: hidden;
}

.container-middle {
    position: relative;
    aspect-ratio: 16 / 9;
    width: 100%;
    max-height: 100%;
}

.container-inner {
    position: absolute;
    width: 100%;
    height: 100%;
}

.container-the-one-after-inner {
    margin: 0 auto;
    width: 100%;
    height: 100%;
}
</style>
