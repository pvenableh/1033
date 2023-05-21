<template>
  <div class="w-full flex items-center justify-center flex-col">
    <div class="w-full h-4 email__border"></div>
    <div class="w-full flex items-center justify-center flex-col email">
      <div class="w-full flex items-center justify-center email__header">
        <a href="https://1033lenox.com" class="inline-block">
          <img src="https://admin.1033lenox.com/assets/61e1a568-679d-4965-9527-c89009ee2486?key=large" />
        </a>
      </div>
      <div class="w-full flex items-center justify-center flex-col email__body">
        <h3 class="email__title" :class="{ red: email.urgent }">
          <span v-if="email.urgent">🚨 </span><span v-else>📢 </span>{{ email.title }}
        </h3>
        <h5 class="email__subtitle">{{ email.subtitle }}</h5>
        <div class="w-full email__content">
          <p>{{ email.greeting }}</p>
          <div v-html="email.content"></div>

          <div class="w-full flex flex-row flex-wrap items-start signature">
            <p class="w-full font-bold greeting">Sincerely,</p>
            <p class="w-full font-bold greeting">Lenox Plaza Association Board of Directors ☀️</p>
            <p class="tracking-wide font-bold uppercase w-full sm:w-1/2"><span class="icon peter">🕶</span>Peter
              Wyatt<span class="title">President</span></p>
            <p class="tracking-wide font-bold uppercase w-full sm:w-1/2"><span class="icon">🏍</span>Alejandro
              Salinas<span class="title">Vice-President</span></p>
            <p class="tracking-wide font-bold uppercase w-full sm:w-1/2"><span class="icon">✨</span>Camila Hoffman<span
                class="title">Secretary</span></p>
            <p class="tracking-wide font-bold uppercase w-full sm:w-1/2"><span class="icon">🏊‍♂️</span>Nenad Rakita<span
                class="title">Treasurer</span></p>
            <p class="tracking-wide font-bold uppercase w-full sm:w-1/2"><span class="icon">🪴</span>Cecilia V. Demattos
            </p>
          </div>
        </div>
      </div>
      <div class="w-full text-center email__footer">
        <a href="https://1033lenox.com" class="font-bold tracking-wide uppercase" target="_blank">1033lenox.com</a>
        <h5 class="font-bold tracking-wide uppercase">
          &copy; {{ new Date().getFullYear() }} LENOX PLAZA ASSOCIATION INC.
        </h5>
        <div class="w-full">
          <img src="https://admin.1033lenox.com/assets/a7e9ae99-656a-4c18-aeea-f96071ddcb57?key=large" alt="1033 Lenox Ave Building" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const { params, path } = useRoute()
const { getItems } = useDirectusItems()
const emailReq = await getItems({
  collection: 'announcements',
  params: {
    filter: {
      url: {
        _eq: params.url,
      },
    },
    fields: ['*'],
  },
})

const email = ref(emailReq[0])
</script>
<style>
.email {
  max-width: 600px;
  line-height: 1.4em;
  font-size: 15px;
  padding: 0 20px;

  &__border {
    background: #555555;
  }

  &__header {
    img {
      max-width: 400px;
      padding: 20px 10px 10px;
    }
  }

  &__body {
    padding: 20px 0px;
  }

  &__title {
    line-height: 1.1em;
    font-size: 20px;
    text-transform: uppercase;
    @apply font-bold text-center;
  }

  &__title.red {
    color: var(--red);
  }

  &__subtitle {
    line-height: 1.1em;
    text-transform: uppercase;
    padding-bottom: 20px;
    padding-top: 10px;
    @apply font-bold text-center;
  }

  &__content {
    padding: 20px 0px 20px;
    border-top: thin solid #999;
    border-bottom: thin solid #999;
    line-height: 1.4em !important;

    p {
      padding: 10px 0px 10px;
      line-height: 1.6em;
      font-weight: 600;
      /* font-family: var(--bold-font); */
    }
    ul, ol {
      padding-left: 30px !important;
    }

    b,
    strong {
      font-family: var(--bold-font);
      @apply font-bold;
    }

    li {
      list-style-type: disc;
      padding: 2px 0px;
    }
  }

  .signature {
    .greeting {
      /* line-height: 1em; */
      font-size: 15px;
      /* margin-bottom: 0px;
      padding-bottom: 0px; */
    }
    p {
      font-size: 10px;

      .icon {
        font-size: 20px;
        margin-right: 2px;
        @apply inline-block;
      }

      .title {
        display: block;
        font-size: 7px;
        line-height: 12px;
        margin-left: 23px
      }
    }
  }

  &__footer {
    padding: 20px 0px 0px;
    font-size: 10px;

    h5 {
      margin-top: 10px;
    }
    img {
      margin-top:40px;
    }
  }
}</style>
