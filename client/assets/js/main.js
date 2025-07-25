
import * as pages from "./pages/router.js";
const Pages = pages.default;

const app = {
    name: 'App',
    components: Pages,
    setup() {
        const { onMounted, ref, shallowRef } = Vue;
        const page = shallowRef(Pages?.dashboard);

        // get valid page names from imported pages
        const available_pages = Object.keys(Pages);

        const setPageFromURL = () => {
            const url_page = window.location.pathname.split("/").pop().toLowerCase() || 'dashboard';

            if (available_pages.includes(url_page)) {
                page.value = Pages[url_page];
            } else {
                page.value = Pages['dashboard'];
                window.history.replaceState({}, '', '/');
            }
        }

        onMounted(() => {
            setPageFromURL();

            window.onpopstate = () => { setPageFromURL(); };
        });

        return { page, pages };
    },
    template: `
        <component :is="page"></component>
    `,

}

const { createApp } = Vue;
createApp(app).mount("#app");