<template>
    <div
        class="relative w-full min-h-screen flex items-center justify-center flex-col documents">
        <h1 class="uppercase tracking-wide my-8">Lenox Plaza Association By-Laws</h1>
        <div v-if="doc.document" v-html="doc.document" class="w-full by-laws"></div>
    </div>
</template>

<script setup>
const { getItemById } = useDirectusItems()
const doc = await getItemById({
    collection: 'by_laws',
    id: '1',
    params: {
        fields: ['*'],
    },
})

</script>
<style >
.by-laws {
    max-width: 800px;
    @apply px-4;
    @media (min-width: theme('screens.lg')) {
    }
    h1 {
        font-size: 20px;
        letter-spacing: 0.05em;
        @apply mt-10 uppercase font-bold;
    }
    h2 {
        font-size: 16px;
        text-decoration: none !important;
        letter-spacing: 0.05em;
        @apply mt-6 uppercase font-bold;
    }
    p {
        line-height: 1.8em;
        @apply my-2;
    }
    ol,ul {

        @apply ml-8;
        list-style-type: disc;
        li {
            @apply pl-2 my-2;
        }
    }
    ol {
        list-style-type: decimal;
    }
}
h1 {


    @media (min-width: theme('screens.md')) {
        max-width: 400px;
    }

   
}
</style>
