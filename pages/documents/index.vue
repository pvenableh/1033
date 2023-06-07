<template>
    <div
        class="relative w-full min-h-screen flex items-center justify-center flex-col scroll-smooth documents">
        <h1 class="uppercase tracking-wide my-8">Lenox Plaza Association By-Laws</h1>
        <div class="w-full flex flex-row items-start justify-center relative">
            <div class="sticky flex flex-col items-start flex-shrink uppercase mr-10 text-right nav">
                <h5 class="uppercase text-xs opacity-25 tracking-wider font-bold w-full mb-4">Sections</h5>
                <a href="#one">Identity</a>
                <a href="#two">Members</a>
                <a href="#three">Members' Meeting</a>
                <a href="#four">Directors</a>
                <a href="#five">Officers</a>
                <a href="#six">Fiscal Management</a>
                <a href="#seven">Parlimentary Rules</a>
                <a href="#eight">Developer</a>
                <a href="#nine">Amendment</a>
            </div>
        <div v-if="doc.document" v-html="doc.document" class="pr-4 pl-4 lg:pl-10 w-full flex-grow scroll-smooth by-laws"></div>
    </div>
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
 .nav {
        width: 250px;
        @apply pt-10 mt-10 top-0;
        display: none;
        @media (min-width: theme('screens.lg')) {
            display: flex
    }
        a {
            @apply w-full tracking-wider text-xs py-2;
        }
        h5 {
            
        }
    }
.by-laws {
    max-width: 800px;
    

    @media (min-width: theme('screens.lg')) {
        border-left: thin solid var(--grey);
    }
   
    h1 {
        font-size: 24px;
        letter-spacing: 0.05em;
        @apply pt-10 mt-10 uppercase font-bold;
    }
    h2 {
        font-size: 20px;
        text-decoration: none !important;
        letter-spacing: 0.05em;
        @apply mt-6 uppercase font-bold;
    }
    h3 {
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
    a {
        text-decoration: underline;
        color: var(--blue);
    }
}
h1 {


    @media (min-width: theme('screens.md')) {
        max-width: 400px;
    }

   
}
</style>
