import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

export function useDebug() {
    const debug = ref(false);

    const route = useRoute();
    watch(route, () => {
        debug.value = route.query.hasOwnProperty('debug') && (!!route.query.debug || route.query.debug === null);
    }, { immediate: true });

    return debug;
}
