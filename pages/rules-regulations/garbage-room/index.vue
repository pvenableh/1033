<template>
    <div class="relative w-full min-h-screen flex items-center justify-start flex-col">
        <h1 class="w-full uppercase tracking-wider mt-6 mb-6 pb-2 w-full text-center border-b max-w-2xl">Garbage Room Reminders</h1>

        <div class="w-full max-w-2xl rule">
            <div v-for="(rule, index) in rules" :key="index">
                <h3 :id="rule.url">{{ rule.title }}</h3>
                <div v-html="rule.description"></div>
            </div>
        </div>


    </div>
</template>

<script setup>
const { getItems } = useDirectusItems()
const rules = await getItems({
    collection: 'rules',
    params: {
        fields: ['*'],
        filter: {
            url: {
                _eq: 'trash-recycling'
            }
        }
    },
})
</script>
<style >



.rule {



    @media (min-width: theme('screens.lg')) {
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

    ol,
    ul {

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


}</style>
